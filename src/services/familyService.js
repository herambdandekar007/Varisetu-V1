import { supabase } from './supabase.js';

// Simple service to fetch family location data.
// It expects a table `family_pings` with columns:
//  - user_id
//  - linked_to   (pilot or pilgrim id)
//  - name
//  - latitude
//  - longitude
//  - last_updated
//  - status
// The service returns an array of objects suitable for MapMarkers.

export const familyService = {
  fetchForPilgrim: async (pilgrimId) => {
    if (!pilgrimId) return [];
    try {
      const { data, error } = await supabase
        .from('family_pings')
        .select('user_id, name, latitude, longitude')
        .eq('linked_to', pilgrimId);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[familyService] error:', err);
      return [];
    }
  },
};
