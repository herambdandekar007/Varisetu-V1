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
  const { data, error } = await supabase.from('alerts').select('*').order('created_at', { ascending: false });
  if (error) { console.error('[alertService] load error:', error); return; }
  cache = data || [];
  loaded = true;
  notify();
}

function ensureRealtime() {
  if (realtimeChannel) return;
  try {
    realtimeChannel = supabase
      .channel('realtime:public:alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
        if (payload.eventType === 'INSERT') cache = [payload.new, ...cache];
        else if (payload.eventType === 'UPDATE') cache = cache.map((t) => (t.id === payload.new.id ? payload.new : t));
        else if (payload.eventType === 'DELETE') cache = cache.filter((t) => t.id !== payload.old.id);
        notify();
      })
      .subscribe();
  } catch (err) { console.error('[alertService] realtime error:', err); }
}

async function ensure() { if (!loaded) await load(); ensureRealtime(); }

export const alertService = {
  list: async () => { await ensure(); return cache; },
  listActive: async () => {
    await ensure();
    const now = new Date();
    return cache.filter((a) => !a.expires_at || new Date(a.expires_at) > now);
  },
  listByZone: async (zoneId) => { await ensure(); return cache.filter((a) => a.zone_id === zoneId); },
  listBySeverity: async (severity) => { await ensure(); return cache.filter((a) => a.severity === severity); },
  listByCreatedBy: async (profileId) => { await ensure(); return cache.filter((a) => a.created_by === profileId); },
  getById: async (id) => { await ensure(); return cache.find((a) => a.id === id) || null; },
  subscribe: (fn) => {
    subscribers.add(fn);
    fn(cache);
    ensure();
    return () => subscribers.delete(fn);
  },
  create: async (alert) => {
    const payload = {
      title: alert.title,
      message: alert.message,
      severity: alert.severity || 'MEDIUM',
      zone_id: alert.zoneId || alert.zone_id || null,
      zone_name: alert.zoneName || alert.zone_name || null,
      category: alert.category || 'BROADCAST',
      source: alert.source || 'MANUAL',
      recommended_action: alert.recommendedAction || alert.recommended_action || null,
      broadcast_by: alert.broadcastBy || alert.broadcast_by || 'Control Tower',
      created_by: alert.createdBy || alert.created_by || null,
      expires_at: alert.expiresAt || alert.expires_at || null,
      demo_only: !!alert.demoOnly || !!alert.demo_only,
      is_demo: !!alert.isDemo || !!alert.is_demo,
    };
    const { data, error } = await supabase.from('alerts').insert(payload).select('*').single();
    if (error) { console.error('[alertService] create error:', error); return null; }
    cache = [data, ...cache];
    notify();
    return data;
  },
  broadcast: async ({ title, message, severity = 'MEDIUM', zoneId = null, zoneName = null, createdBy = null, category = 'BROADCAST', recommendedAction = null }) => {
    return alertService.create({
      title, message, severity, zone_id: zoneId, zone_name: zoneName,
      created_by: createdBy, category, recommended_action: recommendedAction,
      broadcast_by: 'Control Tower',
    });
  },
  broadcastFromController: ({ zoneId, zoneName, severity = 'HIGH', message, title, recommendedAction } = {}) => {
    // Synchronously returns an object with id so AppContext.addNotification won't crash
    // The actual insert happens in background. Real ID is patched on completion.
    const temp = {
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title || 'Controller Broadcast',
      message,
      severity,
      zone_id: zoneId || null,
      zone_name: zoneName || null,
      category: 'BROADCAST',
      source: 'MANUAL',
      recommended_action: recommendedAction || null,
      broadcast_by: 'Control Tower',
      created_at: new Date().toISOString(),
      acknowledged: false,
    };
    alertService.create({
      title: temp.title, message, severity,
      zoneId, zoneName,
      category: 'BROADCAST',
      recommendedAction,
      broadcastBy: 'Control Tower',
    });
    return temp;
  },
  update: async (id, patch) => {
    const remap = {
      zoneId: 'zone_id', zoneName: 'zone_name',
      recommendedAction: 'recommended_action', broadcastBy: 'broadcast_by',
      createdBy: 'created_by', expiresAt: 'expires_at',
    };
    const dbPatch = {};
    for (const [k, v] of Object.entries(patch || {})) {
      dbPatch[remap[k] || k] = v;
    }
    const { data, error } = await supabase.from('alerts').update(dbPatch).eq('id', id).select('*').single();
    if (error) { console.error('[alertService] update error:', error); return null; }
    cache = cache.map((t) => (t.id === id ? data : t));
    notify();
    return data;
  },
  acknowledge: async (id) => alertService.update(id, { acknowledged: true }),
  delete: async (id) => {
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (error) { console.error('[alertService] delete error:', error); return false; }
    cache = cache.filter((t) => t.id !== id);
    notify();
    return true;
  },
};
