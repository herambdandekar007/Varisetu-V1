import { supabase } from './supabase.js';

const listingSubscribers = new Set();
let listingCache = [];
let listingLoaded = false;
let listingChannel = null;

function notifyListings() {
  for (const fn of listingSubscribers) {
    try { fn(listingCache); } catch (_e) { /* subscriber must handle */ }
  }
}

async function loadListings() {
  const { data, error } = await supabase
    .from('stay_listings')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('[stayService] loadListings error:', error); return; }
  listingCache = data || [];
  listingLoaded = true;
  notifyListings();
}

function ensureListingRealtime() {
  if (listingChannel) return;
  try {
    listingChannel = supabase
      .channel('realtime:public:stay_listings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stay_listings' }, (payload) => {
        if (payload.eventType === 'INSERT') listingCache = [...listingCache.filter((s) => s.id !== payload.new.id), payload.new];
        else if (payload.eventType === 'UPDATE') listingCache = listingCache.map((s) => (s.id === payload.new.id ? payload.new : s));
        else if (payload.eventType === 'DELETE') listingCache = listingCache.filter((s) => s.id !== payload.old.id);
        notifyListings();
      })
      .subscribe();
  } catch (err) { console.error('[stayService] listing realtime error:', err); }
}

async function ensureListings() {
  if (!listingLoaded) await loadListings();
  ensureListingRealtime();
}

export const stayService = {
  list: async () => { await ensureListings(); return listingCache; },
  listOpen: async () => {
    await ensureListings();
    return listingCache.filter((s) => s.status !== 'CLOSED');
  },
  getById: async (id) => {
    await ensureListings();
    return listingCache.find((s) => s.id === id) || null;
  },
  subscribe: (fn) => {
    listingSubscribers.add(fn);
    fn(listingCache);
    ensureListings();
    return () => listingSubscribers.delete(fn);
  },

  updateListing: async (id, patch) => {
    const remap = {
      zoneId: 'zone_id', zoneName: 'zone_name', isDemo: 'is_demo',
      lastUpdated: 'last_updated', updatedAt: 'updated_at',
    };
    const payload = {};
    for (const [k, v] of Object.entries(patch || {})) {
      payload[remap[k] || k] = v;
    }
    const { data, error } = await supabase.from('stay_listings').update(payload).eq('id', id).select('*').single();
    if (error) { console.error('[stayService] updateListing error:', error); return null; }
    listingCache = listingCache.map((s) => (s.id === id ? data : s));
    notifyListings();
    return data;
  },

  // Atomically book (decrements listing availability server-side).
  book: async ({ listingId, partySize = 1, simUserId = null, source = 'MANUAL', isTestData = false }) => {
    const { data, error } = await supabase.rpc('book_stay', {
      p_listing_id: listingId,
      p_party_size: partySize,
      p_sim_user_id: simUserId,
      p_source: source,
      p_is_test_data: isTestData,
    });
    if (error) { console.error('[stayService] book error:', error); return { success: false, error: error.message }; }
    return { success: true, data };
  },

  summary: async () => {
    await ensureListings();
    const total = listingCache.length;
    const open = listingCache.filter((s) => s.status === 'OPEN').length;
    const capacity = listingCache.reduce((s, r) => s + (r.capacity || 0), 0);
    const available = listingCache.reduce((s, r) => s + (r.available || 0), 0);
    const pct = capacity > 0 ? Math.round((available / capacity) * 100) : 0;
    return { total, open, capacity, available, pct };
  },
};
