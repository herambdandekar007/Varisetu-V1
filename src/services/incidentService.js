import { supabase } from './supabase.js';

const subscribers = new Set();
let cache = [];
let loaded = false;
let realtimeChannel = null;

function notify() {
  for (const fn of subscribers) {
    try { fn(cache); } catch (_e) { /* subscriber must handle */ }
  }
}

async function load() {
  const { data, error } = await supabase.from('incidents').select('*').order('created_at', { ascending: false });
  if (error) { console.error('[incidentService] load error:', error); return; }
  cache = data || [];
  loaded = true;
  notify();
}

function ensureRealtime() {
  if (realtimeChannel) return;
  try {
    realtimeChannel = supabase
      .channel('realtime:public:incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (payload) => {
        if (payload.eventType === 'INSERT') cache = [payload.new, ...cache];
        else if (payload.eventType === 'UPDATE') cache = cache.map((t) => (t.id === payload.new.id ? payload.new : t));
        else if (payload.eventType === 'DELETE') cache = cache.filter((t) => t.id !== payload.old.id);
        notify();
      })
      .subscribe();
  } catch (err) { console.error('[incidentService] realtime error:', err); }
}

async function ensure() { if (!loaded) await load(); ensureRealtime(); }

export const incidentService = {
  list: async () => { await ensure(); return cache; },
  listOpen: async () => { await ensure(); return cache.filter((i) => ['OPEN','ACKNOWLEDGED','IN_PROGRESS','RESPONDING'].includes(i.status)); },
  listActive: async () => { await ensure(); return cache.filter((i) => ['OPEN','ACKNOWLEDGED','IN_PROGRESS','RESPONDING'].includes(i.status)); },
  listByZone: async (zoneId) => { await ensure(); return cache.filter((i) => i.zone_id === zoneId); },
  listByReportedBy: async (profileId) => { await ensure(); return cache.filter((i) => i.reported_by === profileId); },
  listByAssignedTo: async (profileId) => { await ensure(); return cache.filter((i) => i.assigned_to === profileId); },
  listByType: async (type) => { await ensure(); return cache.filter((i) => i.type === type); },
  listBySeverity: async (severity) => { await ensure(); return cache.filter((i) => i.severity === severity); },
  getById: async (id) => { await ensure(); return cache.find((i) => i.id === id) || null; },
  getStats: async () => {
    await ensure();
    return {
      total: cache.length,
      open: cache.filter((i) => ['OPEN','ACKNOWLEDGED','IN_PROGRESS','RESPONDING'].includes(i.status)).length,
      critical: cache.filter((i) => i.severity === 'CRITICAL' && ['OPEN','ACKNOWLEDGED','IN_PROGRESS','RESPONDING'].includes(i.status)).length,
      sos: cache.filter((i) => i.type === 'SOS' && ['OPEN','ACKNOWLEDGED','IN_PROGRESS','RESPONDING'].includes(i.status)).length,
      medical: cache.filter((i) => i.type === 'MEDICAL' && ['OPEN','ACKNOWLEDGED','IN_PROGRESS','RESPONDING'].includes(i.status)).length,
      crowd: cache.filter((i) => i.type === 'CROWD_SURGE' && ['OPEN','ACKNOWLEDGED','IN_PROGRESS','RESPONDING'].includes(i.status)).length,
      missing: cache.filter((i) => i.type === 'MISSING_PERSON' && ['OPEN','ACKNOWLEDGED','IN_PROGRESS','RESPONDING'].includes(i.status)).length,
      closed: cache.filter((i) => ['RESOLVED','CLOSED'].includes(i.status)).length,
    };
  },
  subscribe: (fn) => {
    subscribers.add(fn);
    fn(cache);
    ensure();
    return () => subscribers.delete(fn);
  },
  create: async (incident) => {
    const payload = {
      type: incident.type || 'OTHER',
      title: incident.title,
      description: incident.description || null,
      latitude: incident.latitude ?? null,
      longitude: incident.longitude ?? null,
      severity: incident.severity || 'MEDIUM',
      status: incident.status || 'OPEN',
      reported_by: incident.reportedBy || incident.reported_by || null,
      assigned_to: incident.assignedTo || incident.assigned_to || null,
      zone_id: incident.zoneId || incident.zone_id || null,
      source: incident.source || 'MANUAL',
      priority: incident.priority || 'MEDIUM',
      zone_name: incident.zoneName || incident.zone_name || null,
      pilgrim_name: incident.pilgrimName || incident.pilgrim_name || null,
      contacts: incident.contacts || null,
      distance_km: incident.distanceKm ?? incident.distance_km ?? null,
    };
    const { data, error } = await supabase.from('incidents').insert(payload).select('*').single();
    if (error) { console.error('[incidentService] create error:', error); return null; }
    cache = [data, ...cache];
    notify();
    return data;
  },
  createSOS: async (opts = {}) => {
    const payload = {
      type: 'SOS',
      title: opts.title || 'SOS — Pilgrim Emergency',
      description: opts.description || null,
      latitude: opts.latitude ?? null,
      longitude: opts.longitude ?? null,
      severity: 'CRITICAL',
      status: 'OPEN',
      reported_by: opts.reportedBy || opts.reported_by || null,
      zone_id: opts.zoneId || opts.zone_id || null,
      source: 'PILGRIM_SOS',
      priority: 'CRITICAL',
      zone_name: opts.zoneName || opts.zone_name || null,
      pilgrim_name: opts.pilgrimName || opts.pilgrim_name || null,
    };
    const { data, error } = await supabase.from('incidents').insert(payload).select('*').single();
    if (error) { console.error('[incidentService] createSOS error:', error); return null; }
    cache = [data, ...cache];
    notify();
    return data;
  },
  update: async (id, patch) => {
    const remap = {
      reportedBy: 'reported_by', assignedTo: 'assigned_to',
      zoneId: 'zone_id', zoneName: 'zone_name',
      pilgrimName: 'pilgrim_name', distanceKm: 'distance_km',
    };
    const dbPatch = {};
    for (const [k, v] of Object.entries(patch || {})) {
      dbPatch[remap[k] || k] = v;
    }
    const { data, error } = await supabase.from('incidents').update(dbPatch).eq('id', id).select('*').single();
    if (error) { console.error('[incidentService] update error:', error); return null; }
    cache = cache.map((t) => (t.id === id ? data : t));
    notify();
    return data;
  },
  acknowledge: async (id) => incidentService.update(id, { status: 'ACKNOWLEDGED' }),
  respond: async (id) => incidentService.update(id, { status: 'IN_PROGRESS' }),
  resolve: async (id) => incidentService.update(id, { status: 'RESOLVED' }),
  close: async (id) => incidentService.update(id, { status: 'CLOSED' }),
  assign: async (id, profileId) => incidentService.update(id, { assigned_to: profileId, status: 'ACKNOWLEDGED' }),
  delete: async (id) => {
    const { error } = await supabase.from('incidents').delete().eq('id', id);
    if (error) { console.error('[incidentService] delete error:', error); return false; }
    cache = cache.filter((t) => t.id !== id);
    notify();
    return true;
  },

  startResponding: async (id, volunteerId) =>
    incidentService.update(id, { assigned_to: volunteerId, status: 'RESPONDING' }),

  createEmergencyFromSOS: async (opts = {}) =>
    incidentService.createSOS({
      title: 'Pilgrim SOS',
      pilgrimName: opts.pilgrimName || undefined,
      description: opts.description || undefined,
      latitude: opts.latitude,
      longitude: opts.longitude,
      zoneId: opts.zoneId,
      zoneName: opts.zoneName,
      contacts: opts.contacts || undefined,
      reportedBy: opts.reportedBy || undefined,
    }),
};
