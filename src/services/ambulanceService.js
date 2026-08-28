import { supabase } from './supabase.js';
import { distanceKm } from './locationService.js';
import { routeAdvisorService } from './routeAdvisorService.js';

/**
 * Ambulance Emergency Routing & Crowd Alert service.
 *
 * Privacy model (enforced at the service/data layer, not just the UI):
 *  - Public reads hit the `public_ambulances` SQL VIEW which only ever selects
 *    the public projection (ambulance_id, color, status, location, trail,
 *    destination, geometry, etas). It NEVER selects driver_name, driver_phone,
 *    registration_number.
 *  - Private fields are only ever returned to the OWNER/admin via a direct
 *    row query on `ambulances` filtered by driver_id/role in RLS.
 */

const subscribers = new Set();
let cache = []; // public projection cache
let loaded = false;
let realtimeChannel = null;

function notify() {
  for (const fn of subscribers) {
    try { fn(cache); } catch (_e) { /* subscriber must handle */ }
  }
}

// Public projection fetch — selects ONLY the view (no private columns).
async function loadPublic() {
  const { data, error } = await supabase
    .from('public_ambulances')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('[ambulanceService] loadPublic error:', error);
    return;
  }
  cache = data || [];
  loaded = true;
  notify();
}

function ensureRealtime() {
  if (realtimeChannel) return;
  try {
    realtimeChannel = supabase
      .channel('realtime:public:ambulances')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulances' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // Refresh via the projection view so RLS still strips private columns.
          loadPublic();
        } else if (payload.eventType === 'DELETE') {
          cache = cache.filter((t) => t.id !== payload.old.id);
          notify();
        }
      })
      .subscribe();
  } catch (err) { console.error('[ambulanceService] realtime error:', err); }
}

async function ensure() { if (!loaded) await loadPublic(); ensureRealtime(); }

// Generate the public short ambulance id from the registration number.
// e.g. "MH-12-JW-3456" -> "AMB-3456-XZ"
export function deriveAmbulanceId(registrationNumber) {
  if (!registrationNumber) return `AMB-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const clean = registrationNumber.replace(/[^A-Z0-9]/gi, '');
  const last4 = clean.slice(-4);
  const suffix = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `AMB-${last4}-${suffix}`;
}

function toPoint(lat, lng) {
  if (lat == null || lng == null) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

export const ambulanceService = {
  // ---- Public API ----
  list: async () => { await ensure(); return cache; },
  subscribe: (fn) => {
    subscribers.add(fn);
    fn(cache);
    ensure();
    return () => subscribers.delete(fn);
  },

  // Ambulances in an active emergency (public projection).
  listEmergency: async () => {
    await ensure();
    return cache.filter((a) => a.status === 'EMERGENCY');
  },

  /**
   * Fetch a single ambulance by its public ambulance_id using the projection
   * view (safe for public/any user). Returns only public fields.
   */
  getPublic: async (ambulanceId) => {
    await ensure();
    const fromCache = cache.find((a) => a.ambulance_id === ambulanceId);
    if (fromCache) return fromCache;
    const { data, error } = await supabase
      .from('public_ambulances')
      .select('*')
      .eq('ambulance_id', ambulanceId)
      .maybeSingle();
    return error ? null : data;
  },

  /**
   * Fetch the OWNER's full row (includes private fields: driver_name,
   * driver_phone, registration_number, approval_status). RLS restricts this
   * to the owner / admin, so it is safe to call from the driver console.
   */
  getOwn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('ambulances')
      .select('*')
      .eq('driver_id', user.id)
      .maybeSingle();
    if (error) { console.error('[ambulanceService] getOwn error:', error); return null; }
    return data;
  },

  // ---- Driver registration ----
  /**
   * Upload a driver photo to Supabase Storage (bucket `driver-photos`).
   * Returns a public URL, or null on failure. Follows the lostFound upload
   * pattern so the bucket can be created separately in the dashboard.
   */
  uploadDriverPhoto: async (file) => {
    if (!file) return null;
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `driver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('driver-photos')
      .upload(fileName, file, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });
    if (error) {
      console.error('[ambulanceService] uploadDriverPhoto error:', error);
      return null;
    }
    const { data: urlData } = supabase.storage.from('driver-photos').getPublicUrl(data.path);
    return urlData?.publicUrl || null;
  },

  /**
   * Register an ambulance record tied to the current driver. Driver stays
   * `pending` until an admin approves.
   */
  register: async ({ driverName, driverPhone, registrationNumber, color, hospitalAffiliation, driverLicense, ambulanceType, driverPhotoUrl }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'You must be signed in to register an ambulance.' };
    const ambulanceId = deriveAmbulanceId(registrationNumber);
    const { data, error } = await supabase
      .from('ambulances')
      .insert({
        driver_id: user.id,
        ambulance_id: ambulanceId,
        registration_number: registrationNumber?.trim(),
        driver_name: driverName?.trim(),
        driver_phone: driverPhone?.trim(),
        color: color || 'white',
        hospital_affiliation: hospitalAffiliation || null,
        driver_license: driverLicense?.trim() || null,
        ambulance_type: ambulanceType || null,
        driver_photo_url: driverPhotoUrl || null,
        status: 'OFFLINE',
        approval_status: 'pending',
      })
      .select('*')
      .single();
    if (error) return { error: error.message };
    cache = [data, ...cache];
    notify();
    return { data };
  },

  // ---- Driver console actions ----
  /**
   * Update the driver's registration detail fields (owner-only). These are
   * private fields (registration_number, driver_license, ambulance_type,
   * color, hospital_affiliation). Does NOT touch the public projection of
   * driver_name/phone which live on the profile.
   */
  updateRegistrationDetails: async (patch) => {
    const own = await ambulanceService.getOwn();
    if (!own) return { error: 'No ambulance record found for this account.' };
    const allowed = [
      'registration_number',
      'driver_license',
      'ambulance_type',
      'color',
      'hospital_affiliation',
      'driver_photo_url',
    ];
    const clean = {};
    for (const k of allowed) if (patch[k] !== undefined) clean[k] = patch[k];
    const { data, error } = await supabase
      .from('ambulances')
      .update(clean)
      .eq('id', own.id)
      .select('*')
      .single();
    if (error) return { error: error.message };
    return { data };
  },

  /**
   * Replace or clear the driver photo. `file` null → clears the photo URL.
   * Returns the new/cleared photo URL.
   */
  setDriverPhoto: async (file) => {
    const own = await ambulanceService.getOwn();
    if (!own) return { error: 'No ambulance record found for this account.' };
    let driverPhotoUrl = null;
    if (file) {
      driverPhotoUrl = await ambulanceService.uploadDriverPhoto(file);
      if (!driverPhotoUrl) return { error: 'Photo upload failed.' };
    }
    const { error } = await supabase
      .from('ambulances')
      .update({ driver_photo_url: driverPhotoUrl })
      .eq('id', own.id);
    if (error) return { error: error.message };
    return { data: { driverPhotoUrl } };
  },

  /**
   * Update status only (AVAILABLE / ON_DUTY / EMERGENCY / OFFLINE).
   * Starts an emergency session when set to EMERGENCY (records timestamps).
   */
  setStatus: async (status) => {
    const own = await ambulanceService.getOwn();
    if (!own) return { error: 'No ambulance record found for this account.' };
    const patch = { status };
    if (status === 'EMERGENCY') {
      patch.emergency_started_at = new Date().toISOString();
      patch.emergency_ended_at = null;
    } else {
      if (own.status === 'EMERGENCY') patch.emergency_ended_at = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from('ambulances')
      .update(patch)
      .eq('id', own.id)
      .select('*')
      .single();
    if (error) return { error: error.message };
    // Sync local cache so listeners see the change even before realtime kicks in
    const publicRow = data && {
      id: data.id,
      ambulance_id: data.ambulance_id,
      color: data.color,
      status: data.status,
      ambulance_type: data.ambulance_type,
      current_location: data.current_location,
      route_trail: data.route_trail,
      destination_hospital: data.destination_hospital,
      route_geometry: data.route_geometry,
      etas: data.etas,
      emergency_started_at: data.emergency_started_at,
      updated_at: data.updated_at,
    };
    cache = cache.map((t) => (t && t.id === data.id ? publicRow : t));
    notify();
    return { data };
  },

  /**
   * Set the destination hospital and compute the route/ETA using OSRM
   * (reused from routeAdvisorService).
   */
  setDestinationHospital: async ({ name, lat, lng }) => {
    const own = await ambulanceService.getOwn();
    if (!own) return { error: 'No ambulance record found for this account.' };
    const destination_hospital = { name: name || 'Hospital', lat: Number(lat), lng: Number(lng) };
    let route_geometry = null;
    let etas = null;

    const loc = own.current_location || {};
    if (loc.lat != null && loc.lng != null && lat != null && lng != null) {
      // Try OSRM quick route for the ambulance->hospital polyline + ETA.
      try {
        const res = await routeAdvisorService.quickRoute([loc.lat, loc.lng], [Number(lat), Number(lng)]);
        if (res && res.geometry?.length && !res.error) {
          route_geometry = res.geometry; // already [lat,lng]
          etas = { distanceKm: res.distanceKm, durationMin: res.durationMin };
        }
      } catch (err) {
        console.warn('[ambulanceService] OSRM destination route failed:', err);
      }
    }

    const { data, error } = await supabase
      .from('ambulances')
      .update({ destination_hospital, route_geometry, etas })
      .eq('id', own.id)
      .select('*')
      .single();
    if (error) return { error: error.message };
    return { data };
  },

  /**
   * Update the live current location while in EMERGENCY. Appends to the
   * route trail so the crowd map can draw a path. Called on every GPS fix.
   */
  updateLocation: async ({ lat, lng, accuracy = null }) => {
    const own = await ambulanceService.getOwn();
    if (!own) return { error: 'No ambulance record found for this account.' };
    const now = new Date().toISOString();
    const trail = Array.isArray(own.route_trail) ? own.route_trail : [];
    const last = trail[trail.length - 1];
    // Skip duplicate points within ~5m to keep the trail compact.
    if (last && last.lat != null && distanceKm(Number(last.lat), Number(last.lng), Number(lat), Number(lng)) < 0.005) {
      return { data: own };
    }
    const nextTrail = [...trail, { lat: Number(lat), lng: Number(lng), timestamp: now }].slice(-200);
    const current_location = { lat: Number(lat), lng: Number(lng), updatedAt: now, accuracy: accuracy ?? null };

    const patch = {
      current_location,
      route_trail: nextTrail,
      updated_at: now,
    };
    // Recompute ETA to destination if we have one (straight-line fallback).
    if (own.destination_hospital?.lat != null) {
      const dKm = distanceKm(Number(lat), Number(lng), Number(own.destination_hospital.lat), Number(own.destination_hospital.lng));
      patch.etas = { ...(own.etas || {}), straightLineKm: Math.round(dKm * 10) / 10 };
    }

    const { data, error } = await supabase
      .from('ambulances')
      .update(patch)
      .eq('id', own.id)
      .select('*')
      .single();
    if (error) return { error: error.message };
    cache = cache.map((t) => (t && t.id === data.id ? { ...t, current_location, route_trail: nextTrail, etas: patch.etas, updated_at: now } : t));
    notify();
    return { data };
  },

  /**
   * Resolve the emergency. Driver picks next status (AVAILABLE/ON_DUTY/OFFLINE).
   * Ends the emergency session, stops tracking (the caller stops geolocation),
   * resolves all active alerts to this ambulance, and clears destination.
   */
  resolveEmergency: async ({ nextStatus = 'ON_DUTY' } = {}) => {
    const own = await ambulanceService.getOwn();
    if (!own) return { error: 'No ambulance record found for this account.' };
    const now = new Date().toISOString();

    const patch = {
      status: nextStatus,
      emergency_ended_at: now,
      destination_hospital: null,
      route_geometry: null,
      etas: null,
    };

    const { data, error } = await supabase
      .from('ambulances')
      .update(patch)
      .eq('id', own.id)
      .select('*')
      .single();
    if (error) return { error: error.message };

    // Resolve all active alerts for this ambulance.
    try {
      await supabase
        .from('ambulance_alerts')
        .update({ status: 'resolved', resolved_at: now })
        .eq('ambulance_id_fk', own.id)
        .eq('status', 'active');
    } catch (e) { console.warn('[ambulanceService] resolve alerts error:', e); }

    const publicRow = data && {
      id: data.id,
      ambulance_id: data.ambulance_id,
      color: data.color,
      status: data.status,
      ambulance_type: data.ambulance_type,
      current_location: data.current_location,
      route_trail: data.route_trail,
      destination_hospital: data.destination_hospital,
      route_geometry: data.route_geometry,
      etas: data.etas,
      emergency_started_at: data.emergency_started_at,
      updated_at: data.updated_at,
    };
    cache = cache.map((t) => (t && t.id === data.id ? publicRow : t));
    notify();
    return { data };
  },

  // ---- Targeted crowd alerting ----
  /**
   * Identify users (pilgrims/volunteers) within `radiusM** meters of the
   * ambulance's upcoming route polyline, prioritizing those closer to the
   * ambulance. The list is computed from the latest `location_pings` that are
   * NOT mock/test rows. Returns public-ish contact (user id + distance).
   *
   * NOTE: full device push (FCM/APNs) is not yet wired into this project, so
   * this returns the targeted user list and also upserts `ambulance_alerts`
   * rows so the in-app realtime status can surface to those users. See the
   * README/AGENTS note about FCM for the remaining device-push work.
   */
  computeProximityTargets: async ({ lat, lng, trail = [], radiusM = 400, limit = 50 }) => {
    const origin = { lat: Number(lat), lng: Number(lng) };
    const corridor = trail.length ? trail : [origin];
    const { data: pings, error } = await supabase
      .from('location_pings')
      .select('user_id, latitude, longitude, recorded_at')
      .not('user_id', 'is', null)
      .eq('is_test_data', false)
      .order('recorded_at', { ascending: false })
      .limit(800);
    if (error) { console.error('[ambulanceService] proximity pings error:', error); return []; }

    const seen = new Map();
    for (const p of pings || []) {
      if (seen.has(p.user_id)) continue;
      const distanceToAmbulance = distanceKm(origin.lat, origin.lng, Number(p.latitude), Number(p.longitude));
      let distanceToCorridor = Infinity;
      // Distance from user to nearest trail point (approximate corridor).
      for (const pt of corridor) {
        const d = distanceKm(Number(pt.lat), Number(pt.lng), Number(p.latitude), Number(p.longitude));
        if (d < distanceToCorridor) distanceToCorridor = d;
      }
      const meters = Math.min(distanceToAmbulance, distanceToCorridor) * 1000;
      if (meters <= radiusM) {
        seen.set(p.user_id, { userId: p.user_id, distanceM: Math.round(meters), lat: Number(p.latitude), lng: Number(p.longitude) });
      }
      if (seen.size >= limit) break;
    }
    return Array.from(seen.values()).sort((a, b) => a.distanceM - b.distanceM);
  },

  /**
   * Record targeted alerts to this ambulance for the given user ids, and
   * return them. Skip users who already have an ACTIVE alert for this
   * ambulance (idempotent — safe to call periodically while in emergency).
   * Realtime on `ambulance_alerts` lets those users' clients react
   * immediately with the in-app emergency banner.
   */
  createAlerts: async ({ userIds = [], distanceM = 0 }) => {
    const own = await ambulanceService.getOwn();
    if (!own) return { error: 'No ambulance record found for this account.' };
    if (!userIds.length) return { count: 0 };

    // Drop any user who already has an active alert for this ambulance.
    const { data: existing } = await supabase
      .from('ambulance_alerts')
      .select('affected_user_id')
      .eq('ambulance_id_fk', own.id)
      .eq('status', 'active');
    const existingIds = new Set((existing || []).map((e) => e.affected_user_id));
    const fresh = userIds.filter((uid) => !existingIds.has(uid));
    if (!fresh.length) return { count: 0 };

    const rows = fresh.map((uid) => ({
      ambulance_id_fk: own.id,
      ambulance_public: own.ambulance_id,
      affected_user_id: uid,
      status: 'active',
      distance_m: distanceM || 0,
    }));
    const { data, error } = await supabase.from('ambulance_alerts').insert(rows).select('*');
    if (error) return { error: error.message, count: 0 };
    return { count: data.length, data };
  },

  /**
   * Subscribe a user to their own active emergency alerts (realtime).
   * Returns an unsubscribe function.
   */
  subscribeMyAlerts: (fn, userId) => {
    if (!userId) return () => {};
    const alertSubscribers = new Set();
    alertSubscribers.add(fn);

    const channel = supabase
      .channel(`realtime:alerts:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ambulance_alerts', filter: `affected_user_id=eq.${userId}` },
        (payload) => {
          for (const sub of alertSubscribers) { try { sub(payload.new); } catch (_e) {} }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ambulance_alerts', filter: `affected_user_id=eq.${userId}` },
        (payload) => {
          for (const sub of alertSubscribers) { try { sub(payload.new); } catch (_e) {} }
        },
      )
      .subscribe();

    return () => {
      alertSubscribers.clear();
      supabase.removeChannel(channel);
    };
  },

  // ---- Demo utilities ----
  distanceKm,
};
