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
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('[taskService] load error:', error);
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
      .channel('realtime:public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          cache = [payload.new, ...cache];
        } else if (payload.eventType === 'UPDATE') {
          cache = cache.map((t) => (t.id === payload.new.id ? payload.new : t));
        } else if (payload.eventType === 'DELETE') {
          cache = cache.filter((t) => t.id !== payload.old.id);
        }
        notify();
      })
      .subscribe();
  } catch (err) {
    console.error('[taskService] realtime error:', err);
  }
}

async function ensure() {
  if (!loaded) await load();
  ensureRealtime();
}

export const taskService = {
  list: async () => { await ensure(); return cache; },
  listByVolunteer: async (profileId) => {
    await ensure();
    return cache.filter((t) => t.assigned_to === profileId || t.assigned_to == null);
  },
  listByZone: async (zoneId) => { await ensure(); return cache.filter((t) => t.zone_id === zoneId); },
  listByIncident: async (incidentId) => { await ensure(); return cache.filter((t) => t.incident_id === incidentId); },
  listByAssignedBy: async (profileId) => { await ensure(); return cache.filter((t) => t.assigned_by === profileId); },
  getById: async (id) => { await ensure(); return cache.find((t) => t.id === id) || null; },
  getStats: async () => {
    await ensure();
    return {
      total: cache.length,
      pending: cache.filter((t) => t.status === 'PENDING').length,
      accepted: cache.filter((t) => t.status === 'ACCEPTED').length,
      inProgress: cache.filter((t) => t.status === 'IN_PROGRESS').length,
      completed: cache.filter((t) => t.status === 'COMPLETED').length,
    };
  },
  subscribe: (fn) => {
    subscribers.add(fn);
    fn(cache);
    ensure();
    return () => subscribers.delete(fn);
  },
  create: async (task) => {
    const payload = {
      incident_id: task.incidentId || task.incident_id || null,
      assigned_to: task.assignedTo || task.assigned_to || null,
      assigned_by: task.assignedBy || task.assigned_by || null,
      assigned_to_name: task.assignedToName || task.assigned_to_name || null,
      title: task.title,
      description: task.description || null,
      instructions: task.instructions || null,
      priority: task.priority || 'MEDIUM',
      status: task.status || 'PENDING',
      latitude: task.latitude ?? null,
      longitude: task.longitude ?? null,
      zone_id: task.zoneId || task.zone_id || null,
      zone_name: task.zoneName || task.zone_name || null,
      distance_km: task.distanceKm ?? task.distance_km ?? null,
      eta_minutes: task.etaMinutes ?? task.eta_minutes ?? null,
      category: task.category || null,
      incident_title: task.incidentTitle || task.incident_title || null,
      is_demo: !!task.is_demo || !!task.isDemo,
    };
    const { data, error } = await supabase.from('tasks').insert(payload).select('*').single();
    if (error) { console.error('[taskService] create error:', error); return null; }
    cache = [data, ...cache];
    notify();
    return data;
  },
  updateStatus: async (id, status) => {
    const patch = { status };
    if (status === 'ACCEPTED') patch.accepted_at = new Date().toISOString();
    if (status === 'IN_PROGRESS') patch.started_at = new Date().toISOString();
    if (status === 'COMPLETED') patch.completed_at = new Date().toISOString();
    const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select('*').single();
    if (error) { console.error('[taskService] updateStatus error:', error); return null; }
    cache = cache.map((t) => (t.id === id ? data : t));
    notify();
    return data;
  },
  update: async (id, patch) => {
    const remap = {
      incidentId: 'incident_id',
      assignedTo: 'assigned_to',
      assignedBy: 'assigned_by',
      zoneId: 'zone_id',
      zoneName: 'zone_name',
      distanceKm: 'distance_km',
      etaMinutes: 'eta_minutes',
      incidentTitle: 'incident_title',
      assignedToName: 'assigned_to_name',
    };
    const dbPatch = {};
    for (const [k, v] of Object.entries(patch || {})) {
      dbPatch[remap[k] || k] = v;
    }
    const { data, error } = await supabase.from('tasks').update(dbPatch).eq('id', id).select('*').single();
    if (error) { console.error('[taskService] update error:', error); return null; }
    cache = cache.map((t) => (t.id === id ? data : t));
    notify();
    return data;
  },
  assign: async (id, profileId, profileName = null) => {
    const patch = { assigned_to: profileId, status: 'PENDING' };
    if (profileName) patch.assigned_to_name = profileName;
    const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select('*').single();
    if (error) { console.error('[taskService] assign error:', error); return null; }
    cache = cache.map((t) => (t.id === id ? data : t));
    notify();
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) { console.error('[taskService] delete error:', error); return false; }
    cache = cache.filter((t) => t.id !== id);
    notify();
    return true;
  },

  // Compatibility aliases (sync wrappers around cache for AppContext)
  listActive: async (profileId) => {
    await ensure();
    const assigned = profileId
      ? cache.filter((t) => t.assigned_to === profileId || t.assigned_to == null)
      : cache;
    return assigned.filter((t) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(t.status));
  },
  createFromIncident: async (incident, opts = {}) => {
    const loc = opts.location || { latitude: incident.latitude, longitude: incident.longitude };
    return taskService.create({
      title: opts.title || `Respond: ${incident.title || incident.id}`,
      description: opts.description || incident.description || '',
      instructions: opts.instructions || '',
      priority: opts.priority || incident.priority || 'HIGH',
      incident_id: incident.id,
      incident_title: incident.title,
      latitude: loc.latitude,
      longitude: loc.longitude,
      zone_id: opts.zoneId || incident.zone_id,
      zone_name: opts.zoneName || incident.zone_name,
      category: incident.type,
      is_demo: !!incident.is_demo || !!opts.is_demo,
    });
  },
  accept: async (id, volunteerId, volunteerName = null) => {
    await ensure();
    await taskService.update(id, { assigned_to: volunteerId, assigned_to_name: volunteerName });
    return taskService.updateStatus(id, 'ACCEPTED');
  },
  start: async (id) => taskService.updateStatus(id, 'IN_PROGRESS'),
  complete: async (id) => taskService.updateStatus(id, 'COMPLETED'),
};
