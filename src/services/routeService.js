import { supabase } from './supabase.js';

const subscribers = new Set();
let cache = [];
let loaded = false;

function notify() {
  for (const fn of subscribers) {
    try { fn(cache); } catch (_e) { /* subscriber must handle */ }
  }
}

async function load() {
  const { data, error } = await supabase.from('routes').select('*').order('created_at', { ascending: false });
  if (error) { console.error('[routeService] load error:', error); return; }
  cache = data || [];
  loaded = true;
  notify();
}

async function ensure() { if (!loaded) await load(); }

function scoreRoute(r) {
  // Lower is better.  Combine time, crowd, risk, distance (all normalized 0-1).
  const maxKm = 30, maxMin = 300;
  const dScore = Math.min(1, (Number(r.distance_km) || 0) / maxKm);
  const tScore = Math.min(1, (Number(r.estimated_minutes) || 0) / maxMin);
  const cScore = (Number(r.crowd_score) || 0) / 100;
  const rScore = (Number(r.risk_score) || 0) / 100;
  return (
    dScore * 0.15 + tScore * 0.30 + cScore * 0.30 + rScore * 0.25
  );
}

const DENSITY_LEVEL = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const RISK_LEVEL = ['LOW', 'MEDIUM', 'HIGH', 'SEVERE', 'CRITICAL'];
const STATUS_LEVEL = ['OPEN', 'SLOW', 'BLOCKED', 'CLOSED'];

function categorizeFromScore(r) {
  const crowdIdx = Math.min(3, Math.floor((Number(r.crowd_score) || 0) / 25));
  const riskIdx = Math.min(4, Math.floor((Number(r.risk_score) || 0) / 20));
  let statusIdx = 0;
  if (Number(r.crowd_score) >= 80 || Number(r.risk_score) >= 80) statusIdx = 2; // BLOCKED
  else if (Number(r.crowd_score) >= 55 || Number(r.risk_score) >= 55) statusIdx = 1; // SLOW
  return {
    crowd_level: DENSITY_LEVEL[crowdIdx],
    risk: RISK_LEVEL[riskIdx],
    status: STATUS_LEVEL[statusIdx],
  };
}

export const routeService = {
  list: async () => { await ensure(); return cache; },
  listActive: async () => { await ensure(); return cache.filter((r) => r.status !== 'CLOSED'); },
  listRecommended: async () => { await ensure(); return cache.filter((r) => r.is_recommended); },
  getById: async (id) => { await ensure(); return cache.find((r) => r.id === id) || null; },
  getRecommendedRoute: async () => {
    await ensure();
    const rec = cache.find((r) => r.is_recommended);
    if (rec) return rec;
    if (!cache.length) return null;
    return [...cache].sort((a, b) => scoreRoute(a) - scoreRoute(b))[0] || null;
  },
  compareAndGetBest: async () => {
    await ensure();
    const list = [...cache].sort((a, b) => scoreRoute(a) - scoreRoute(b));
    if (!list.length) return [];
    // Recompute categorization, and persist best as recommended (idempotent)
    const best = list[0];
    const cat = categorizeFromScore(best);
    const bestPatch = {
      is_recommended: true,
      recommended_by_ai: true,
      crowd_level: cat.crowd_level,
      risk: cat.risk,
      status: cat.status === 'CLOSED' ? best.status : cat.status,
    };
    const othersIds = cache.filter((r) => r.id !== best.id).map((r) => r.id);
    // Update others to not recommended, and best to recommended
    await Promise.all([
      othersIds.length
        ? supabase.from('routes').update({ is_recommended: false, recommended_by_ai: false }).in('id', othersIds)
        : Promise.resolve({ data: null }),
      supabase.from('routes').update(bestPatch).eq('id', best.id).select('*').single(),
    ]);
    const results = await supabase.from('routes').select('*').order('created_at', { ascending: false });
    if (!results.error) { cache = results.data || []; notify(); }
    return cache;
  },
  subscribe: (fn) => {
    subscribers.add(fn);
    fn(cache);
    ensure();
    return () => subscribers.delete(fn);
  },
  subscribeRoutes: (fn) => {
    subscribers.add(fn);
    fn(cache);
    ensure();
    return () => subscribers.delete(fn);
  },
  applyCrowdRiskToMain: async (factor) => {
    await ensure();
    const main = cache.find((r) => r.id === 'route-main' || r.name?.toLowerCase().includes('main'));
    if (!main) return;
    const newCrowd = Math.min(100, Math.round((Number(main.crowd_score) || 30) * factor));
    const newRisk = Math.min(100, Math.round((Number(main.risk_score) || 20) * factor));
    const cat = categorizeFromScore({ crowd_score: newCrowd, risk_score: newRisk });
    const { data, error } = await supabase
      .from('routes')
      .update({ crowd_score: newCrowd, risk_score: newRisk, ...cat })
      .eq('id', main.id)
      .select('*')
      .single();
    if (!error && data) { cache = cache.map((r) => (r.id === main.id ? data : r)); notify(); }
  },
  setRecommendation: async (routeId, reason, riskAtFrontKm = 1.0) => {
    await ensure();
    const target = cache.find((r) => r.id === routeId || r.name?.toLowerCase().includes(routeId));
    if (!target) return null;
    const patch = {
      is_recommended: true,
      recommended_by_ai: true,
      risk_score: Math.min(100, Math.round(riskAtFrontKm * 50)),
    };
    const othersIds = cache.filter((r) => r.id !== target.id).map((r) => r.id);
    await Promise.all([
      othersIds.length
        ? supabase.from('routes').update({ is_recommended: false, recommended_by_ai: false }).in('id', othersIds)
        : Promise.resolve({ data: null }),
      supabase.from('routes').update(patch).eq('id', target.id),
    ]);
    const results = await supabase.from('routes').select('*').order('created_at', { ascending: false });
    if (!results.error) { cache = results.data || []; notify(); }
    return cache.find((r) => r.id === target.id) || null;
  },
  blockRoute: async (routeId, reason) => {
    await ensure();
    const target = cache.find((r) => r.id === routeId || r.name?.toLowerCase().includes(routeId));
    if (!target) return null;
    const { data, error } = await supabase
      .from('routes')
      .update({ status: 'BLOCKED' })
      .eq('id', target.id)
      .select('*')
      .single();
    if (!error && data) { cache = cache.map((r) => (r.id === target.id ? data : r)); notify(); }
    return data || null;
  },
  create: async (route) => {
    const remap = {
      sourceLatitude: 'source_latitude',
      sourceLongitude: 'source_longitude',
      destinationLatitude: 'destination_latitude',
      destinationLongitude: 'destination_longitude',
      distanceKm: 'distance_km',
      estimatedMinutes: 'estimated_minutes',
      crowdScore: 'crowd_score',
      riskScore: 'risk_score',
      routeGeometry: 'route_geometry',
      isRecommended: 'is_recommended',
      recommendedByAi: 'recommended_by_ai',
      fromText: 'from_text',
      toText: 'to_text',
    };
    const payload = {};
    for (const [k, v] of Object.entries(route || {})) {
      payload[remap[k] || k] = v;
    }
    const { data, error } = await supabase.from('routes').insert(payload).select('*').single();
    if (error) { console.error('[routeService] create error:', error); return null; }
    cache = [data, ...cache];
    notify();
    return data;
  },
  update: async (id, patch) => {
    const remap = {
      sourceLatitude: 'source_latitude',
      sourceLongitude: 'source_longitude',
      destinationLatitude: 'destination_latitude',
      destinationLongitude: 'destination_longitude',
      distanceKm: 'distance_km',
      estimatedMinutes: 'estimated_minutes',
      crowdScore: 'crowd_score',
      riskScore: 'risk_score',
      routeGeometry: 'route_geometry',
      isRecommended: 'is_recommended',
      recommendedByAi: 'recommended_by_ai',
      fromText: 'from_text',
      toText: 'to_text',
    };
    const dbPatch = {};
    for (const [k, v] of Object.entries(patch || {})) {
      dbPatch[remap[k] || k] = v;
    }
    const { data, error } = await supabase.from('routes').update(dbPatch).eq('id', id).select('*').single();
    if (error) { console.error('[routeService] update error:', error); return null; }
    cache = cache.map((t) => (t.id === id ? data : t));
    notify();
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.from('routes').delete().eq('id', id);
    if (error) { console.error('[routeService] delete error:', error); return false; }
    cache = cache.filter((t) => t.id !== id);
    notify();
    return true;
  },
};
