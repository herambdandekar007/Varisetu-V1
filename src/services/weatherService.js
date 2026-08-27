const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const subscribers = new Set();
let cache = null;
let cacheTimestamp = 0;
let lastFetchLat = null;
let lastFetchLng = null;
let fetchPromise = null;

// WMO Weather interpretation codes → human-readable
const WMO_CODES = {
  0: { label: 'Clear sky', icon: '☀️', condition: 'Sunny' },
  1: { label: 'Mainly clear', icon: '🌤️', condition: 'Mostly Clear' },
  2: { label: 'Partly cloudy', icon: '⛅', condition: 'Partly Cloudy' },
  3: { label: 'Overcast', icon: '☁️', condition: 'Cloudy' },
  45: { label: 'Fog', icon: '🌫️', condition: 'Foggy' },
  48: { label: 'Depositing rime fog', icon: '🌫️', condition: 'Foggy' },
  51: { label: 'Light drizzle', icon: '🌦️', condition: 'Light Drizzle' },
  53: { label: 'Moderate drizzle', icon: '🌦️', condition: 'Drizzle' },
  55: { label: 'Dense drizzle', icon: '🌧️', condition: 'Heavy Drizzle' },
  56: { label: 'Light freezing drizzle', icon: '🌧️', condition: 'Freezing Drizzle' },
  57: { label: 'Dense freezing drizzle', icon: '🌧️', condition: 'Heavy Freezing Drizzle' },
  61: { label: 'Slight rain', icon: '🌦️', condition: 'Light Rain' },
  63: { label: 'Moderate rain', icon: '🌧️', condition: 'Rain' },
  65: { label: 'Heavy rain', icon: '🌧️', condition: 'Heavy Rain' },
  66: { label: 'Light freezing rain', icon: '🌧️', condition: 'Freezing Rain' },
  67: { label: 'Heavy freezing rain', icon: '🌧️', condition: 'Heavy Freezing Rain' },
  71: { label: 'Slight snowfall', icon: '🌨️', condition: 'Light Snow' },
  73: { label: 'Moderate snowfall', icon: '🌨️', condition: 'Snow' },
  75: { label: 'Heavy snowfall', icon: '❄️', condition: 'Heavy Snow' },
  77: { label: 'Snow grains', icon: '❄️', condition: 'Snow Grains' },
  80: { label: 'Slight rain showers', icon: '🌦️', condition: 'Light Showers' },
  81: { label: 'Moderate rain showers', icon: '🌧️', condition: 'Showers' },
  82: { label: 'Violent rain showers', icon: '⛈️', condition: 'Heavy Showers' },
  85: { label: 'Slight snow showers', icon: '🌨️', condition: 'Light Snow Showers' },
  86: { label: 'Heavy snow showers', icon: '❄️', condition: 'Heavy Snow Showers' },
  95: { label: 'Thunderstorm', icon: '⛈️', condition: 'Thunderstorm' },
  96: { label: 'Thunderstorm with slight hail', icon: '⛈️', condition: 'Thunderstorm + Hail' },
  99: { label: 'Thunderstorm with heavy hail', icon: '⛈️', condition: 'Severe Thunderstorm' },
};

function decodeWeatherCode(code) {
  return WMO_CODES[code] || { label: 'Unknown', icon: '🌡️', condition: 'Unknown' };
}

function notify() {
  for (const fn of subscribers) {
    try { fn(cache); } catch (_e) {}
  }
}

function isCacheValid(lat, lng) {
  if (!cache) return false;
  if (Date.now() - cacheTimestamp > CACHE_TTL_MS) return false;
  if (lastFetchLat !== null && (Math.abs(lastFetchLat - lat) > 0.01 || Math.abs(lastFetchLng - lng) > 0.01)) return false;
  return true;
}

export const weatherService = {
  fetch: async (lat, lng) => {
    if (lat == null || lng == null) return null;
    if (isCacheValid(lat, lng)) return cache;

    // Deduplicate concurrent fetches
    if (fetchPromise) return fetchPromise;

    fetchPromise = (async () => {
      try {
        const url = `${BASE_URL}?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
        const data = await res.json();
        const current = data.current;
        const decoded = decodeWeatherCode(current.weather_code);

        cache = {
          temperature: Math.round(current.temperature_2m),
          feelsLike: Math.round(current.apparent_temperature),
          humidity: current.relative_humidity_2m,
          weatherCode: current.weather_code,
          condition: decoded.condition,
          conditionIcon: decoded.icon,
          conditionLabel: decoded.label,
          windSpeed: Math.round(current.wind_speed_10m),
          uvIndex: Math.round(current.uv_index ?? 0),
          rainChance: current.weather_code >= 51 && current.weather_code <= 99,
          fetchedAt: Date.now(),
        };
        cacheTimestamp = Date.now();
        lastFetchLat = lat;
        lastFetchLng = lng;
        notify();
        return cache;
      } catch (err) {
        console.error('[weatherService] fetch error:', err);
        return cache; // return stale cache if available
      } finally {
        fetchPromise = null;
      }
    })();
    return fetchPromise;
  },

  get: () => cache,

  subscribe: (fn) => {
    subscribers.add(fn);
    fn(cache);
    return () => subscribers.delete(fn);
  },

  getAdvisory: (tempC) => {
    if (tempC >= 42) return { level: 'EXTREME', label: 'Extreme Heat Warning', color: 'red', action: 'Cancel outdoor activities. Open cooling shelters. Distribute water.' };
    if (tempC >= 37) return { level: 'SEVERE', label: 'Severe Heat Advisory', color: 'red', action: 'Limit outdoor movement. Mandatory water breaks every 30 min.' };
    if (tempC >= 33) return { level: 'HIGH', label: 'Heat Advisory', color: 'orange', action: 'Increase water distribution. Medical teams on standby.' };
    if (tempC >= 28) return { level: 'MODERATE', label: 'Moderate', color: 'green', action: 'Normal operations. Monitor crowd hydration.' };
    return { level: 'LOW', label: 'Comfortable', color: 'blue', action: 'Ideal conditions for pilgrimage.' };
  },

  getHeatIndex: (tempC, humidity) => {
    if (tempC < 27) return tempC;
    return Math.round(tempC + 0.05 * humidity);
  },
};
