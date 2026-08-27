import { supabase } from './supabase.js';

const BUCKET = 'lost-found-photos';

const sightingSubscribers = new Set();
let sightingCache = [];
let sightingLoaded = false;
let sightingChannel = null;

function notifySightings() {
  for (const fn of sightingSubscribers) {
    try { fn(sightingCache); } catch (_e) {}
  }
}

async function loadSightings() {
  const { data, error } = await supabase
    .from('lost_found_sightings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('[lostFoundService] loadSightings error:', error); return; }
  sightingCache = data || [];
  sightingLoaded = true;
  notifySightings();
}

function ensureSightingRealtime() {
  if (sightingChannel) return;
  try {
    sightingChannel = supabase
      .channel('realtime:public:lost_found_sightings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lost_found_sightings' }, (payload) => {
        if (payload.eventType === 'INSERT') sightingCache = [payload.new, ...sightingCache];
        else if (payload.eventType === 'UPDATE') sightingCache = sightingCache.map((s) => (s.id === payload.new.id ? payload.new : s));
        else if (payload.eventType === 'DELETE') sightingCache = sightingCache.filter((s) => s.id !== payload.old.id);
        notifySightings();
      })
      .subscribe();
  } catch (err) { console.error('[lostFoundService] sighting realtime error:', err); }
}

async function ensureSightings() {
  if (!sightingLoaded) await loadSightings();
  ensureSightingRealtime();
}

export const lostFoundService = {
  // Upload a photo to Supabase Storage
  uploadPhoto: async (file) => {
    if (!file) return null;
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `lost-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });
    if (error) { console.error('[lostFoundService] uploadPhoto error:', error); return null; }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return urlData?.publicUrl || null;
  },

  // Check for duplicate name among active missing person reports
  checkDuplicate: async (name) => {
    if (!name?.trim()) return false;
    const normalised = name.trim().toLowerCase();
    const { data, error } = await supabase
      .from('incidents')
      .select('id, title, pilgrim_name, status')
      .eq('type', 'MISSING_PERSON')
      .in('status', ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESPONDING']);
    if (error) { console.error('[lostFoundService] checkDuplicate error:', error); return false; }
    return (data || []).some((row) => {
      const rowName = (row.pilgrim_name || row.title || '').toLowerCase().replace(/^missing:\s*/, '').trim();
      return rowName === normalised;
    });
  },

  // Report a lost person — returns { success, error, data }
  reportLost: async ({ name, age, gender, clothingDescription, contactPhone, lastSeenLocation, lastSeenTime, description, photoFile, reportedBy, zoneId, zoneName }) => {
    const trimmedName = name?.trim();
    if (!trimmedName) return { success: false, error: 'Person name is required.' };

    // Duplicate check
    const isDuplicate = await lostFoundService.checkDuplicate(trimmedName);
    if (isDuplicate) return { success: false, error: 'A report for this person already exists. Please check the list before submitting a new report.' };

    // Upload photo if provided
    let photoUrl = null;
    if (photoFile) {
      photoUrl = await lostFoundService.uploadPhoto(photoFile);
    }

    const payload = {
      type: 'MISSING_PERSON',
      title: `Missing: ${trimmedName}`,
      description: description || null,
      severity: 'HIGH',
      status: 'OPEN',
      source: 'LOST_FOUND_FORM',
      priority: 'HIGH',
      pilgrim_name: trimmedName,
      person_age: age || null,
      person_gender: gender || null,
      clothing_description: clothingDescription || null,
      contact_phone: contactPhone || null,
      last_seen_location: lastSeenLocation || null,
      last_seen_time: lastSeenTime || new Date().toISOString(),
      photo_url: photoUrl,
      reported_by: reportedBy || null,
      zone_id: zoneId || null,
      zone_name: zoneName || null,
    };

    const { data, error } = await supabase.from('incidents').insert(payload).select('*').single();
    if (error) { console.error('[lostFoundService] reportLost error:', error); return { success: false, error: 'Failed to submit report. Please try again.' }; }
    return { success: true, data };
  },

  // Report a sighting — "I've seen this person"
  reportSighting: async ({ incidentId, sightingLocation, sightingNotes, reporterName, reporterPhone, reportedBy }) => {
    if (!incidentId || !sightingLocation?.trim()) {
      return { success: false, error: 'Location is required for a sighting report.' };
    }

    const payload = {
      incident_id: incidentId,
      reported_by: reportedBy || null,
      reporter_name: reporterName || null,
      reporter_phone: reporterPhone || null,
      sighting_location: sightingLocation.trim(),
      sighting_notes: sightingNotes || null,
      seen_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('lost_found_sightings').insert(payload).select('*').single();
    if (error) { console.error('[lostFoundService] reportSighting error:', error); return { success: false, error: 'Failed to submit sighting. Please try again.' }; }
    return { success: true, data };
  },

  // Mark a lost person as found
  markAsFound: async ({ incidentId, foundLocation, foundNearby, foundNotes }) => {
    if (!incidentId) return { success: false, error: 'Incident ID is required.' };

    const { data, error } = await supabase
      .from('incidents')
      .update({
        status: 'RESOLVED',
        found_location: foundLocation || null,
        found_nearby: foundNearby || null,
        found_notes: foundNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', incidentId)
      .select('*')
      .single();

    if (error) { console.error('[lostFoundService] markAsFound error:', error); return { success: false, error: 'Failed to mark as found.' }; }
    return { success: true, data };
  },

  // Get sightings for a specific lost person report
  getSightings: async (incidentId) => {
    await ensureSightings();
    if (!incidentId) return [];
    return sightingCache.filter((s) => s.incident_id === incidentId);
  },

  // Get all sightings
  listSightings: async () => {
    await ensureSightings();
    return sightingCache;
  },

  // Subscribe to sighting changes
  subscribeSightings: (fn) => {
    sightingSubscribers.add(fn);
    fn(sightingCache);
    ensureSightings();
    return () => sightingSubscribers.delete(fn);
  },

  // Get lost person incidents (MISSING_PERSON type, not resolved)
  listLost: async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('type', 'MISSING_PERSON')
      .in('status', ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESPONDING'])
      .order('created_at', { ascending: false });
    if (error) { console.error('[lostFoundService] listLost error:', error); return []; }
    return data || [];
  },

  // Get found/reunited incidents
  listFound: async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('type', 'MISSING_PERSON')
      .eq('status', 'RESOLVED')
      .order('updated_at', { ascending: false });
    if (error) { console.error('[lostFoundService] listFound error:', error); return []; }
    return data || [];
  },
};
