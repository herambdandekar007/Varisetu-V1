import { supabase } from './supabase.js';
import { locationService } from './locationService.js';
import { weatherService } from './weatherService.js';

const SESSION_KEY = 'varisetu.health.session';
const SNAPSHOT_MIN_INTERVAL_MS = 600000; // persist at most once per 10 min
const SNAPSHOT_MIN_DISTANCE_M = 1500;    // or after 1.5km of GPS movement

const subscribers = new Set();
let cache = [];
let loaded = false;
let realtimeChannel = null;

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || {};
  } catch {
    return {};
  }
}

function writeSession(sess) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  } catch {
    /* storage unavailable */
  }
}

function notify() {
  for (const fn of subscribers) {
    try { fn(cache); } catch (_e) { /* subscriber must handle */ }
  }
}

async function loadLatest() {
  try {
    const { data, error } = await supabase
      .from('pilgrim_health_snapshots')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    cache = data || [];
    loaded = true;
    notify();
  } catch (err) {
    console.error('[healthService] load error:', err);
  }
}

function ensureRealtime() {
  if (realtimeChannel) return;
  try {
    realtimeChannel = supabase
      .channel('realtime:public:pilgrim_health_snapshots')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pilgrim_health_snapshots' }, (payload) => {
        cache = [payload.new, ...cache].slice(0, 20);
        notify();
      })
      .subscribe();
  } catch (err) {
    console.error('[healthService] realtime error:', err);
  }
}

async function ensure() {
  if (!loaded) await loadLatest();
  ensureRealtime();
}

// Register progress tracking once so GPS fixes accrue into the session.
let trackingStarted = false;
function startTracking() {
  if (trackingStarted) return;
  trackingStarted = true;
  if (typeof window === 'undefined') return;

  const sess = readSession();
  if (!sess.startedAt) {
    sess.startedAt = new Date().toISOString();
    writeSession(sess);
  }

  locationService.subscribePilgrimLocation((loc) => {
    if (!loc || loc.latitude == null || loc.longitude == null) return;
    const now = Date.now();
    const s = readSession();

    // First fix after app load: just remember the position.
    if (s.lastLat != null && s.lastLng != null && s.lastTs) {
      const dtMin = (now - s.lastTs) / 60000;
      if (dtMin > 0.25 && dtMin < 30) { // ignore jumps/duplicates
        const R = 6371000;
        const dLat = ((loc.latitude - s.lastLat) * Math.PI) / 180;
        const dLng = ((loc.longitude - s.lastLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((s.lastLat * Math.PI) / 180) * Math.cos((loc.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const dM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (dM > 3 && dM < 400) { // plausible walking step between fixes
          s.distanceM = (s.distanceM || 0) + dM;
          s.minutes = (s.minutes || 0) + dtMin;
        }
      }
    }
    s.lastLat = loc.latitude;
    s.lastLng = loc.longitude;
    s.lastTs = now;
    writeSession(s);

    // Persist a health snapshot occasionally (10 min OR ~1.5km of new walking)
    if (!s.lastAutoSnapshotAt || now - s.lastAutoSnapshotAt >= SNAPSHOT_MIN_INTERVAL_MS) {
      if ((s.distanceM || 0) - (s.snapshotDistanceBase || 0) >= SNAPSHOT_MIN_DISTANCE_M) {
        s.lastAutoSnapshotAt = now;
        s.snapshotDistanceBase = s.distanceM;
        writeSession(s);
        saveSnapshot({
          distanceM: s.distanceM,
          minutes: s.minutes,
          restedMinutes: s.restedMinutes || 0,
          zoneId: loc.zoneId,
          zoneName: loc.zoneName,
          latitude: loc.latitude,
          longitude: loc.longitude,
          isTestData: false,
        });
      }
    }
  });
}

// Score via the server-side rule engine (source of truth).
async function score({ distanceM, minutes, heartRate, ambientC, restedMinutes }) {
  const { data, error } = await supabase.rpc('score_pilgrim_health', {
    p_distance_m: distanceM || 0,
    p_minutes: minutes || 0,
    p_heart_rate: heartRate ?? null,
    p_ambient_c: ambientC ?? null,
    p_rested_minutes: restedMinutes || 0,
  });
  if (error) throw error;
  return data || {};
}

async function saveSnapshot({
  distanceM, minutes, heartRate, ambientC, restedMinutes,
  zoneId, zoneName, latitude, longitude, isTestData = false,
}) {
  const weather = weatherService.get();
  const temp = ambientC ?? weather?.temperature ?? null;
  const scored = await score({ distanceM, minutes, heartRate, ambientC: temp, restedMinutes });

  const { data, error } = await supabase
    .from('pilgrim_health_snapshots')
    .insert({
      user_id: isTestData ? null : locationService.getCurrentUserId(),
      sim_user_id: isTestData ? `health-demo-${Date.now()}` : null,
      zone_id: zoneId || null,
      zone_name: zoneName || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      walking_distance_m: distanceM || 0,
      walking_minutes: minutes || 0,
      heart_rate: heartRate ?? null,
      ambient_temp_c: temp,
      rested_minutes: restedMinutes || 0,
      risk_score: scored.risk_score ?? 0,
      risk_level: scored.risk_level || 'LOW',
      fatigue_level: scored.fatigue_level ?? 0,
      hydration_level: scored.hydration_level ?? 0,
      heat_stress: scored.heat_stress || 'LOW',
      advice: scored.advice || [],
      is_test_data: isTestData,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[healthService] saveSnapshot error:', error);
    return null;
  }
  cache = [data, ...cache].slice(0, 20);
  notify();
  return data;
}

export const healthService = {
  // Session activity (distance walked this session)
  getSession: () => readSession(),
  startTracking,
  score,
  saveSnapshot,
  getLatest: async () => { await ensure(); return cache[0] || null; },
  getHistory: async () => { await ensure(); return cache; },
  getCorridorHealth: async () => {
    const { data, error } = await supabase.rpc('health_corridor_snapshot');
    if (error) {
      console.error('[healthService] corridor error:', error);
      return [];
    }
    return data || [];
  },
  subscribe: (fn) => {
    subscribers.add(fn);
    fn(cache);
    ensure();
    return () => subscribers.delete(fn);
  },
};