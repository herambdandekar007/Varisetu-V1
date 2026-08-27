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
  const { data, error } = await supabase.from('crowd_zones').select('*').order('name', { ascending: true });
  if (error) { console.error('[crowdService] load error:', error); return; }
  cache = data || [];
  loaded = true;
  notify();
}

function ensureRealtime() {
  if (realtimeChannel) return;
  try {
    realtimeChannel = supabase
      .channel('realtime:public:crowd_zones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crowd_zones' }, (payload) => {
        if (payload.eventType === 'INSERT') cache = [payload.new, ...cache];
        else if (payload.eventType === 'UPDATE') cache = cache.map((t) => (t.id === payload.new.id ? payload.new : t));
        else if (payload.eventType === 'DELETE') cache = cache.filter((t) => t.id !== payload.old.id);
        notify();
      })
      .subscribe();
  } catch (err) { console.error('[crowdService] realtime error:', err); }
}

async function ensure() { if (!loaded) await load(); ensureRealtime(); }

function densityFromCount(count, capacity) {
  if (!capacity) return count > 15000 ? 'CRITICAL' : count > 10000 ? 'HIGH' : count > 6000 ? 'MEDIUM' : 'LOW';
  const ratio = count / capacity;
  if (ratio >= 1.4) return 'CRITICAL';
  if (ratio >= 1.0) return 'HIGH';
  if (ratio >= 0.65) return 'MEDIUM';
  return 'LOW';
}

function riskFromCount(count, capacity, growth, highRiskReasons = []) {
  if (!capacity) capacity = 10000;
  const ratio = count / capacity;
  let score = Math.min(100, Math.round(
    ratio * 52 + (growth || 0) * 1.1 + highRiskReasons.length * 4
  ));
  return score;
}

function forecastPeople(people, growth, horizonMin) {
  if (!growth) return people;
  return Math.round(people * (1 + (growth / 100) * (horizonMin / 60)));
}

export const crowdService = {
  list: async () => { await ensure(); return cache; },
  listHotZones: async () => {
    await ensure();
    return cache
      .filter((z) => z.risk_score >= 60)
      .sort((a, b) => b.risk_score - a.risk_score);
  },
  getById: async (id) => { await ensure(); return cache.find((z) => z.id === id) || null; },
  getByName: async (name) => { await ensure(); return cache.find((z) => z.name && z.name.includes(name)) || null; },
  getOverallStats: async () => {
    await ensure();
    const totalPeople = cache.reduce((s, z) => s + (Number(z.people_count) || 0), 0);
    const high = cache.filter((z) => ['HIGH', 'CRITICAL'].includes(z.density)).length;
    const critical = cache.filter((z) => z.density === 'CRITICAL').length;
    const avgRisk = cache.length ? Math.round(cache.reduce((s, z) => s + Number(z.risk_score || 0), 0) / cache.length) : 0;
    return {
      totalZones: cache.length,
      totalPeople,
      highRiskZones: high,
      criticalZones: critical,
      averageRisk: avgRisk,
      trend: (cache.reduce((s, z) => s + (Number(z.growth_rate) || 0), 0) / (cache.length || 1)) || 0,
    };
  },
  getForecast: async (zoneId) => {
    await ensure();
    const z = cache.find((x) => x.id === zoneId);
    if (!z) return null;
    const current = Number(z.people_count) || 0;
    const growth = Number(z.growth_rate) || 0;
    const forecast30m = forecastPeople(current, growth, 30);
    const forecast60m = forecastPeople(current, growth, 60);
    let riskLevel = 'LOW';
    if (z.risk_score >= 80) riskLevel = 'CRITICAL';
    else if (z.risk_score >= 60) riskLevel = 'HIGH';
    else if (z.risk_score >= 35) riskLevel = 'MEDIUM';
    let recommendation = 'Proceed on main route.';
    if (riskLevel === 'CRITICAL') recommendation = 'Take alternate route NOW. Avoid zone completely.';
    else if (riskLevel === 'HIGH') recommendation = 'Prefer alternate route if possible. Watch for updates.';
    else if (riskLevel === 'MEDIUM') recommendation = 'Proceed with caution. Stay on main path.';
    return { current, forecast30m, forecast60m, riskLevel, recommendation };
  },
  subscribe: (fn) => {
    subscribers.add(fn);
    fn(cache);
    ensure();
    return () => subscribers.delete(fn);
  },
  createZone: async (zone) => {
    const payload = {
      name: zone.name,
      center_latitude: zone.centerLatitude ?? zone.center_latitude ?? null,
      center_longitude: zone.centerLongitude ?? zone.center_longitude ?? null,
      people_count: zone.peopleCount ?? zone.people_count ?? 0,
      capacity: zone.capacity ?? null,
      density: zone.density || 'LOW',
      risk_score: zone.riskScore ?? zone.risk_score ?? 0,
      growth_rate: zone.growthRate ?? zone.growth_rate ?? 0,
      bounds: zone.bounds || null,
      forecast_30m: zone.forecast30m ?? zone.forecast_30m ?? null,
      forecast_60m: zone.forecast60m ?? zone.forecast_60m ?? null,
      reasons_high_risk: zone.reasonsHighRisk || zone.reasons_high_risk || [],
    };
    const { data, error } = await supabase.from('crowd_zones').insert(payload).select('*').single();
    if (error) { console.error('[crowdService] createZone error:', error); return null; }
    cache = [...cache, data];
    notify();
    return data;
  },
  update: async (id, patch) => {
    const remap = {
      centerLatitude: 'center_latitude',
      centerLongitude: 'center_longitude',
      peopleCount: 'people_count',
      riskScore: 'risk_score',
      growthRate: 'growth_rate',
      forecast30m: 'forecast_30m',
      forecast60m: 'forecast_60m',
      reasonsHighRisk: 'reasons_high_risk',
    };
    const dbPatch = {};
    for (const [k, v] of Object.entries(patch || {})) {
      dbPatch[remap[k] || k] = v;
    }
    const { data, error } = await supabase.from('crowd_zones').update(dbPatch).eq('id', id).select('*').single();
    if (error) { console.error('[crowdService] update error:', error); return null; }
    cache = cache.map((t) => (t.id === id ? data : t));
    notify();
    return data;
  },
  applySimulationMultiplier: async (multiplier, zoneId = null) => {
    // Simulate crowd by multiplying all zone people counts (or a single zone)
    await ensure();
    const targets = zoneId ? cache.filter((z) => z.id === zoneId || z.name === zoneId) : cache;
    const updates = targets.map(async (z) => {
      const base = Number(z.people_count) || 0;
      const roundPeople = (p) => Math.round(p / 10) * 10;
      const newCount = roundPeople(base * multiplier);
      const newDensity = densityFromCount(newCount, z.capacity);
      const reasons = [...(z.reasons_high_risk || [])];
      if (multiplier >= 1.3) {
        if (!reasons.includes('Simulation spike applied')) reasons.push('Simulation spike applied');
      }
      const newRisk = riskFromCount(newCount, z.capacity, Number(z.growth_rate) || 0, reasons);
      return supabase
        .from('crowd_zones')
        .update({
          people_count: newCount,
          density: newDensity,
          risk_score: newRisk,
          forecast_30m: forecastPeople(newCount, z.growth_rate, 30),
          forecast_60m: forecastPeople(newCount, z.growth_rate, 60),
          reasons_high_risk: reasons,
        })
        .eq('id', z.id)
        .select('*')
        .single();
    });
    const results = await Promise.all(updates);
    const ok = results.filter((r) => !r.error).map((r) => r.data);
    if (ok.length) {
      const byId = new Map(ok.map((r) => [r.id, r]));
      cache = cache.map((z) => (byId.has(z.id) ? byId.get(z.id) : z));
      notify();
    }
    return ok;
  },

  // Inject synthetic pings into a zone's grid cell so the SAME DB aggregation
  // pipeline (aggregate_cell_counts → crowd_zones updates) moves live numbers.
  // Developer Mode uses this instead of locally overriding displayed values.
  burstSimulationPings: async ({ zoneId = null, count = 20, label = 'dev' }) => {
    await ensure();
    const zone = zoneId
      ? cache.find((z) => z.id === zoneId || z.name === zoneId)
      : null;
    if (!zone && zoneId) return { inserted: 0, cell: null };

    // Prefer the zone's grid cell center; fall back to the zone center
    let lat = Number(zone?.center_latitude) || null;
    let lng = Number(zone?.center_longitude) || null;
    let cellId = null;
    if (zone?.id) {
      const { data: cell, error } = await supabase
        .from('grid_cells')
        .select('id, center_lat, center_lng')
        .eq('zone_id', zone.id)
        .limit(1)
        .maybeSingle();
      if (!error && cell) {
        cellId = cell.id;
        if (cell.center_lat != null) lat = Number(cell.center_lat);
        if (cell.center_lng != null) lng = Number(cell.center_lng);
      }
    }
    if (lat == null || lng == null) return { inserted: 0, cell: null };

    const safe = Math.max(1, Math.min(500, Math.round(count) || 0));
    const stamp = Date.now();
    const jitter = () => ({ dLat: (Math.random() - 0.5) * 0.004, dLng: (Math.random() - 0.5) * 0.004 });
    const rows = [];
    for (let i = 0; i < safe; i += 1) {
      const { dLat, dLng } = jitter();
      rows.push({
        user_id: null,
        sim_user_id: `sim-${label}-${stamp}-${i}`,
        latitude: Math.round((lat + dLat) * 1e6) / 1e6,
        longitude: Math.round((lng + dLng) * 1e6) / 1e6,
        accuracy: Math.round(12 + Math.random() * 30),
        heading_deg: Math.round(100 + Math.random() * 20),
        recorded_at: new Date().toISOString(),
        is_test_data: true,
      });
    }

    let inserted = 0;
    // Batch inserts in chunks of 100 to keep the request small
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase.from('location_pings').insert(chunk);
      if (error) {
        console.error('[crowdService] burstSimulationPings error:', error);
        break;
      }
      inserted += chunk.length;
    }
    return { inserted, cell: cellId, lat, lng, zoneId: zone?.id || null };
  },

  // Compatibility: "cells" style for AppContext — camelCase accessors
  getCells: async () => {
    await ensure();
    return cache.map((z) => ({
      id: z.id,
      zoneId: z.id,
      zoneName: z.name,
      name: z.name,
      latitude: z.center_latitude,
      longitude: z.center_longitude,
      centerLatitude: z.center_latitude,
      centerLongitude: z.center_longitude,
      bounds: z.bounds,
      peopleCount: z.people_count,
      pilgrims: z.people_count,
      people: z.people_count,
      capacity: z.capacity,
      density: z.density,
      riskScore: Number(z.risk_score || 0),
      risk:
        z.risk_score >= 80 ? 'CRITICAL' :
        z.risk_score >= 60 ? 'HIGH' :
        z.risk_score >= 35 ? 'MEDIUM' : 'LOW',
      growthPct: Number(z.growth_rate || 0),
      forecast30m: z.forecast_30m,
      forecast60m: z.forecast_60m,
      reasonsHighRisk: z.reasons_high_risk || [],
      updatedAt: z.updated_at,
      _raw: z,
    }));
  },
  getSummary: async () => {
    const stats = await crowdService.getOverallStats();
    return {
      totalZones: stats.totalZones,
      totalPilgrims: stats.totalPeople,
      highRiskZones: stats.highRiskZones,
      criticalZones: stats.criticalZones,
      averageRisk: stats.averageRisk,
      trend: stats.trend,
    };
  },
  getKPIs: async () => {
    const stats = await crowdService.getOverallStats();
    return [
      { label: 'Total Zones', value: stats.totalZones, trend: 'stable' },
      { label: 'Pilgrims Tracked', value: stats.totalPeople.toLocaleString('en-IN'), trend: stats.trend >= 0 ? 'up' : 'down' },
      { label: 'High Risk', value: stats.highRiskZones, trend: stats.highRiskZones > 0 ? 'up' : 'down' },
      { label: 'Avg Risk Score', value: `${stats.averageRisk}%`, trend: stats.averageRisk > 50 ? 'up' : 'down' },
    ];
  },
  subscribeCells: (fn) => crowdService.subscribe(async () => fn(await crowdService.getCells())),
  subscribeTrend: (fn) => {
    crowdService.subscribe(async () => {
      // Build synthetic trend from zone forecast data
      const zones = await crowdService.list();
      const now = new Date();
      const points = [];
      const mins = [-60, -45, -30, -15, 0, 15, 30, 45, 60];
      for (const m of mins) {
        const time = new Date(now.getTime() + m * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const avgPeople = zones.length
          ? Math.round(zones.reduce((s, z) => s + (Number(z.people_count) || 0), 0) / zones.length)
          : 0;
        const base = avgPeople;
        const scale = m < 0 ? 1 + (m / 120) : 1 + (m / 120) * (1 + ((zones[0]?.growth_rate || 0) / 100));
        points.push({
          time,
          pilgrims: Math.max(100, Math.round(base * scale)),
          risk:
            m <= 0
              ? zones.length ? Math.round(zones.reduce((s, z) => s + Number(z.risk_score || 0), 0) / zones.length) : 0
              : 0,
          window: time,
        });
      }
      fn(points);
    });
    // Trigger initial
    crowdService.list();
    return () => {};
  },
};
