import { supabase } from './supabase.js';

/**
 * Route Advisor Service
 * Calls the Supabase Edge Function `route-advisor` which:
 * - Geocodes arbitrary locations via Nominatim
 * - Computes walking routes via OSRM
 * - Optionally runs LLM analysis via OpenRouter
 *
 * All external API keys live server-side in Edge Function secrets only.
 */

const FUNCTION_NAME = 'route-advisor';

export const routeAdvisorService = {
  /**
   * Get a route between two arbitrary [lat, lng] points.
   * @param {[number, number]} origin - [lat, lng]
   * @param {[number, number]} destination - [lat, lng]
   * @param {object} opts - Optional: originName, destinationName
   * @returns {Promise<object>} Route summary with geometry, steps, distances, optional AI analysis
   */
  getRoute: async (origin, destination, opts = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: {
          origin,
          destination,
          originName: opts.originName || null,
          destinationName: opts.destinationName || null,
        },
      });
      if (error) {
        console.error('[routeAdvisorService] Edge Function error:', error);
        return { error: error.message, steps: [], distanceKm: null, durationMin: null };
      }
      return data || { error: 'No data returned', steps: [] };
    } catch (err) {
      console.error('[routeAdvisorService] invoke failed:', err);
      return { error: err.message, steps: [], distanceKm: null, durationMin: null };
    }
  },

  /**
   * Geocode an address string to [lat, lng] via Nominatim.
   * Client-side fallback if Edge Function is unavailable.
   */
  geocode: async (query) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
        { headers: { 'User-Agent': 'VariSetu/1.0 (pilgrim-routing)' } },
      );
      const data = await res.json();
      return data.map((r) => ({
        name: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        type: r.type,
        importance: r.importance,
      }));
    } catch (err) {
      console.error('[routeAdvisorService] geocode error:', err);
      return [];
    }
  },

  /**
   * Reverse geocode [lat, lng] to an address string.
   */
  reverseGeocode: async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14`,
        { headers: { 'User-Agent': 'VariSetu/1.0 (pilgrim-routing)' } },
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  },

  /**
   * Quick OSRM route between two points (client-side, no Edge Function needed).
   */
  quickRoute: async (origin, destination) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.routes?.[0]) return { error: 'No route found', steps: [] };
      const route = data.routes[0];
      return {
        distanceKm: Math.round((route.distance / 1000) * 10) / 10,
        durationMin: Math.round(route.duration / 60),
        geometry: route.geometry,
        steps: route.legs?.[0]?.steps?.map((s) => ({
          instruction: s.maneuver?.type === 'arrive' ? 'Arrive at destination'
            : s.maneuver?.type === 'depart' ? `Head ${s.maneuver.modifier || ''}`
            : `${s.maneuver?.type || ''} ${s.maneuver?.modifier || ''}`.trim(),
          distance: Math.round(s.distance / 10) * 10,
          duration: Math.round(s.duration / 60),
        })) || [],
      };
    } catch (err) {
      return { error: err.message, steps: [] };
    }
  },
};
