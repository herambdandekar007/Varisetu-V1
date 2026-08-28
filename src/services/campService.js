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
  const { data, error } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
  if (error) { console.error('[campService] load error:', error); return; }
  cache = data || [];
  loaded = true;
  notify();
}

async function ensure() { if (!loaded) await load(); }

const toRad = (d) => (d * Math.PI) / 180;
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const TYPE_ALIASES = {
  MEDICAL: ['MEDICAL'],
  WATER: ['WATER'],
  FOOD: ['FOOD'],
  TOILET: ['TOILET'],
  CAMP: ['REST', 'CAMP'],
  AMBULANCE: ['AMBULANCE'],
  REST: ['REST'],
};

// ---- camp_inventory support (per-camp stock line items) ----
const inventorySubscribers = new Set();
let inventoryCache = [];
let inventoryLoaded = false;
let inventoryChannel = null;

function notifyInventory() {
  for (const fn of inventorySubscribers) {
    try { fn(inventoryCache); } catch (_e) { /* subscriber must handle */ }
  }
}

async function loadInventory() {
  const { data, error } = await supabase.from('camp_inventory').select('*').order('noted_at', { ascending: false });
  if (error) { console.error('[campService] inventory load error:', error); return; }
  inventoryCache = data || [];
  inventoryLoaded = true;
  notifyInventory();
}

function ensureInventoryRealtime() {
  if (inventoryChannel) return;
  try {
    inventoryChannel = supabase
      .channel('realtime:public:camp_inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camp_inventory' }, (payload) => {
        if (payload.eventType === 'INSERT') inventoryCache = [payload.new, ...inventoryCache];
        else if (payload.eventType === 'UPDATE') inventoryCache = inventoryCache.map((t) => (t.id === payload.new.id ? payload.new : t));
        else if (payload.eventType === 'DELETE') inventoryCache = inventoryCache.filter((t) => t.id !== payload.old.id);
        notifyInventory();
      })
      .subscribe();
  } catch (err) { console.error('[campService] inventory realtime error:', err); }
}

async function ensureInventory() { if (!inventoryLoaded) await loadInventory(); ensureInventoryRealtime(); }

export const campService = {
  list: async () => { await ensure(); return cache; },
  listByCategory: async (category) => {
    await ensure();
    const types = TYPE_ALIASES[category] || [category];
    return cache.filter((c) => types.includes(c.type));
  },
  listByZone: async (zoneId) => { await ensure(); return cache.filter((c) => c.zone_id === zoneId); },
  listNearby: async (latitude, longitude, radiusKm = 2.0) => {
    await ensure();
    return cache.filter((c) => {
      if (c.latitude == null || c.longitude == null) return false;
      return distanceKm(latitude, longitude, c.latitude, c.longitude) <= radiusKm;
    });
  },
  getById: async (id) => { await ensure(); return cache.find((c) => c.id === id) || null; },
  subscribe: (fn) => {
    subscribers.add(fn);
    fn(cache);
    ensure();
    return () => subscribers.delete(fn);
  },
  update: async (id, patch) => {
    const remap = {
      lastUpdated: 'last_updated',
      zoneId: 'zone_id',
      zoneName: 'zone_name',
      bedsTotal: 'beds_total',
      bedsAvailable: 'beds_available',
      stockLiters: 'stock_liters',
      stockPct: 'stock_pct',
      waitingCount: 'waiting_count',
      mealsRemaining: 'meals_remaining',
      ambulanceAvailable: 'ambulance_available',
    };
    const dbPatch = {};
    for (const [k, v] of Object.entries(patch || {})) {
      dbPatch[remap[k] || k] = v;
    }
    dbPatch.last_updated = new Date().toISOString();
    const { data, error } = await supabase.from('resources').update(dbPatch).eq('id', id).select('*').single();
    if (error) { console.error('[campService] update error:', error); return null; }
    cache = cache.map((t) => (t.id === id ? data : t));
    notify();
    return data;
  },
  create: async (resource) => {
    const remap = {
      lastUpdated: 'last_updated',
      zoneId: 'zone_id',
      zoneName: 'zone_name',
      bedsTotal: 'beds_total',
      bedsAvailable: 'beds_available',
      stockLiters: 'stock_liters',
      stockPct: 'stock_pct',
      waitingCount: 'waiting_count',
      mealsRemaining: 'meals_remaining',
      ambulanceAvailable: 'ambulance_available',
    };
    const payload = {};
    for (const [k, v] of Object.entries(resource || {})) {
      payload[remap[k] || k] = v;
    }
    payload.last_updated = new Date().toISOString();
    const { data, error } = await supabase.from('resources').insert(payload).select('*').single();
    if (error) { console.error('[campService] create error:', error); return null; }
    cache = [data, ...cache];
    notify();
    return data;
  },
  // ---- camp_inventory ----
  getInventory: async () => { await ensureInventory(); return inventoryCache; },
  listInventory: async (resourceId) => {
    await ensureInventory();
    return inventoryCache.filter((i) => i.resource_id === resourceId);
  },
  inventoryFlags: async () => {
    await ensureInventory();
    return inventoryCache.filter((i) => i.status !== 'OK');
  },
  subscribeInventory: (fn) => {
    inventorySubscribers.add(fn);
    fn(inventoryCache);
    ensureInventory();
    return () => inventorySubscribers.delete(fn);
  },
  createInventoryItem: async (item) => {
    const remap = {
      resourceId: 'resource_id', zoneId: 'zone_id', zoneName: 'zone_name',
      itemName: 'item_name', notedAt: 'noted_at', updatedBy: 'updated_by', isDemo: 'is_demo',
    };
    const payload = {};
    for (const [k, v] of Object.entries(item || {})) {
      payload[remap[k] || k] = v;
    }
    // Ensure noted_at is set
    if (!payload.noted_at) {
      payload.noted_at = new Date().toISOString();
    }
    const { data, error } = await supabase.from('camp_inventory').insert(payload).select('*').single();
    if (error) {
      console.error('[campService] create inventory error:', error);
      console.error('[campService] payload was:', payload);
      return null;
    }
    inventoryCache = [data, ...inventoryCache];
    notifyInventory();
    return data;
  },
  updateInventoryItem: async (id, patch) => {
    const remap = {
      resourceId: 'resource_id', zoneId: 'zone_id', zoneName: 'zone_name',
      itemName: 'item_name', notedAt: 'noted_at', updatedBy: 'updated_by', isDemo: 'is_demo',
    };
    const dbPatch = {};
    for (const [k, v] of Object.entries(patch || {})) {
      dbPatch[remap[k] || k] = v;
    }
    const { data, error } = await supabase.from('camp_inventory').update(dbPatch).eq('id', id).select('*').single();
    if (error) {
      console.error('[campService] update inventory error:', error);
      console.error('[campService] patch was:', dbPatch);
      return null;
    }
    inventoryCache = inventoryCache.map((t) => (t.id === id ? data : t));
    notifyInventory();
    return data;
  },
  deleteInventoryItem: async (id) => {
    const { error } = await supabase.from('camp_inventory').delete().eq('id', id);
    if (error) { console.error('[campService] delete inventory error:', error); return false; }
    inventoryCache = inventoryCache.filter((t) => t.id !== id);
    notifyInventory();
    return true;
  },
  distanceKm,
};

export const resourceService = campService;
