import { supabase } from './supabase.js';
import { routeCoordinates, mapPoints } from '../data/mockData.js';
import { crowdService } from './crowdService.js';

const toRad = (d) => (d * Math.PI) / 180;

export function distanceKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lat2 == null) return 0;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return c;
}

// Pilgrim location state — starts as null until permission resolved
let pilgrimState = {
  latitude: 18.486,
  longitude: 74.089,
  accuracyMeters: null,
  lastUpdated: null,
  zoneId: 'zone-24',
  zoneName: 'Loni Kalbhor',
  headingDeg: null,
  source: 'unknown', // 'gps' | 'simulated' | 'unknown'
};

let permissionState = 'prompt'; // 'granted' | 'denied' | 'prompt' | 'unavailable'
let watchId = null;
let permissionRequested = false;

// Auth-bound user id (set from AuthContext so GPS fixes can persist as pings)
let currentUserId = null;
let lastPersistedAt = 0;
const PING_THROTTLE_MS = 20000; // persist at most once every 20s per user

const pilgrimSubscribers = new Set();
const permissionSubscribers = new Set();

function notifyPilgrim() {
  for (const fn of pilgrimSubscribers) {
    try { fn(pilgrimState); } catch (_e) {}
  }
}

function notifyPermission() {
  for (const fn of permissionSubscribers) {
    try { fn(permissionState); } catch (_e) {}
  }
}

async function findNearestZone(lat, lng) {
  try {
    const zones = await crowdService.list();
    let nearest = null;
    let nearestDist = Infinity;
    for (const z of zones) {
      if (z.center_latitude == null) continue;
      const d = distanceKm(lat, lng, z.center_latitude, z.center_longitude);
      if (d < nearestDist) { nearestDist = d; nearest = z; }
    }
    return nearest;
  } catch {
    return null;
  }
}

// Persist one ping row to location_pings. Throttled per user.
// Synthetic (is_test_data) pings are not throttled — callers control their own rate.
async function persistPing({ latitude, longitude, accuracy, heading, isTestData = false, force = false }) {
  if (!currentUserId && !isTestData) return;
  const now = Date.now();
  if (!isTestData && !force && now - lastPersistedAt < PING_THROTTLE_MS) return;
  lastPersistedAt = now;
  try {
    await supabase.from('location_pings').insert({
      user_id: isTestData ? null : currentUserId,
      sim_user_id: isTestData ? `gps-demo-${now}` : null,
      latitude,
      longitude,
      accuracy: accuracy ?? null,
      heading_deg: heading ?? null,
      recorded_at: new Date().toISOString(),
      is_test_data: isTestData,
    });
  } catch (err) {
    console.warn('[locationService] persist ping error:', err);
  }
}

async function handleGeolocationPosition(position) {
  const { latitude, longitude, accuracy } = position.coords;
  const nearest = await findNearestZone(latitude, longitude);

  permissionState = 'granted';
  notifyPermission();

  pilgrimState = {
    latitude,
    longitude,
    accuracyMeters: accuracy,
    lastUpdated: new Date().toISOString(),
    zoneId: nearest?.id || pilgrimState.zoneId || 'zone-24',
    zoneName: nearest?.name || pilgrimState.zoneName || 'Loni Kalbhor',
    headingDeg: position.coords.heading || pilgrimState.headingDeg || 0,
    source: 'gps',
  };
  notifyPilgrim();

  await persistPing({
    latitude,
    longitude,
    accuracy,
    heading: position.coords.heading,
  });
}

function handleGeolocationError(error) {
  console.warn('[locationService] geolocation error:', error.message);
  if (error.code === error.PERMISSION_DENIED) {
    permissionState = 'denied';
  } else if (error.code === error.POSITION_UNAVAILABLE) {
    permissionState = 'unavailable';
  } else {
    permissionState = 'unavailable';
  }
  notifyPermission();
}

export const locationService = {
  getPilgrimLocation: () => pilgrimState,
  getPermissionState: () => permissionState,

  subscribePilgrimLocation: (fn) => {
    pilgrimSubscribers.add(fn);
    fn(pilgrimState);
    return () => pilgrimSubscribers.delete(fn);
  },

  subscribePermission: (fn) => {
    permissionSubscribers.add(fn);
    fn(permissionState);
    return () => permissionSubscribers.delete(fn);
  },

  // Request browser geolocation permission on app load
  requestPermission: () => {
    if (permissionRequested) return;
    permissionRequested = true;

    if (!navigator.geolocation) {
      permissionState = 'unavailable';
      notifyPermission();
      return;
    }

    // Try the Permissions API first to check existing state
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        permissionState = result.state;
        notifyPermission();

        // Always start watching — 'prompt' triggers browser dialog, 'granted' starts tracking
        locationService.startWatching();

        result.addEventListener('change', () => {
          permissionState = result.state;
          notifyPermission();
          if (result.state === 'granted') {
            locationService.startWatching();
          } else {
            locationService.stopWatching();
          }
        });
      }).catch(() => {
        // permissions API not fully supported, just call watchPosition which triggers the prompt
        locationService.startWatching();
      });
    } else {
      // No permissions API — watchPosition will trigger the browser prompt directly
      locationService.startWatching();
    }
  },

  // Start watching position — calling this triggers the browser permission prompt
  startWatching: () => {
    if (watchId !== null) return;

    try {
      watchId = navigator.geolocation.watchPosition(
        handleGeolocationPosition,
        handleGeolocationError,
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 },
      );
      // Don't assume granted here — wait for actual position or error callback
    } catch (err) {
      console.error('[locationService] watchPosition error:', err);
      permissionState = 'unavailable';
      notifyPermission();
    }
  },

  // Stop watching
  stopWatching: () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  },

  // Manual set (for dev mode / fallback)
  setPilgrimLocation: async (latitude, longitude, accuracyMeters = 10, userId = null) => {
    const nearest = await findNearestZone(latitude, longitude);
    pilgrimState = {
      latitude, longitude,
      accuracyMeters,
      lastUpdated: new Date().toISOString(),
      zoneId: nearest?.id || 'zone-24',
      zoneName: nearest?.name || 'Loni Kalbhor',
      headingDeg: 112,
      source: userId ? 'gps' : 'simulated',
    };
    notifyPilgrim();

    await persistPing({ latitude, longitude, accuracy: accuracyMeters, heading: 112, force: false });
    return pilgrimState;
  },

  // Clear simulated location and resume GPS tracking
  clearSimulatedLocation: () => {
    if (pilgrimState.source !== 'simulated') return;
    pilgrimState = { ...pilgrimState, source: 'unknown' };
    notifyPilgrim();
    locationService.startWatching();
  },

  // Bind the current authenticated user so GPS fixes persist as pings
  bindUser: (userId) => {
    currentUserId = userId || null;
  },

  getCurrentUserId: () => currentUserId,

  persistPing,

  getRoutePath: () => routeCoordinates,
  getNearbyPOIs: (type) => {
    if (!type) return mapPoints;
    return mapPoints.filter((p) => p.type === type);
  },
  distanceKm,
};
