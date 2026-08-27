import { supabase } from './supabase.js';

const subscribers = new Set();
let cells = [];
let latestByCell = new Map(); // cell_id -> newest cell_counts row
let historyByCell = new Map(); // cell_id -> [{t, total}] last ~45 min
let loaded = false;
let realtimeChannel = null;
let pollTimer = null;

function notify() {
  for (const fn of subscribers) {
    try { fn(cells); } catch (_e) { /* subscriber must handle */ }
  }
}

async function load() {
  try {
    const [gridRes, countsRes] = await Promise.all([
      supabase.from('grid_cells').select('id, cell_label, zone_id, center_lat, center_lng'),
      supabase
        .from('cell_counts')
        .select('id, cell_id, count, test_count, computed_at')
        .order('computed_at', { ascending: false })
        .limit(500),
    ]);
    if (gridRes.error) throw gridRes.error;
    if (countsRes.error) throw countsRes.error;

    const grid = gridRes.data || [];
    latestByCell = new Map();
    historyByCell = new Map();
    for (const cc of countsRes.data || []) {
      historyByCell.set(cc.cell_id, historyByCell.get(cc.cell_id) || []);
      const hist = historyByCell.get(cc.cell_id);
      if (hist.length < 90) hist.push({ t: cc.computed_at, total: (Number(cc.count) || 0) + (Number(cc.test_count) || 0) });
    }
    for (const hist of historyByCell.values()) {
      hist.sort((a, b) => new Date(a.t) - new Date(b.t));
    }
    for (const cc of countsRes.data || []) {
      if (!latestByCell.has(cc.cell_id)) latestByCell.set(cc.cell_id, cc);
    }

    cells = grid.map((g) => {
      const latest = latestByCell.get(g.id);
      const hist = historyByCell.get(g.id) || [];
      return {
        cellId: g.id,
        cellLabel: g.cell_label,
        zoneId: g.zone_id,
        centerLat: Number(g.center_lat),
        centerLng: Number(g.center_lng),
        count: Number(latest?.count || 0),
        testCount: Number(latest?.test_count || 0),
        total: Number(latest?.count || 0) + Number(latest?.test_count || 0),
        computedAt: latest?.computed_at || null,
        history: hist.slice(-45),
      };
    });
    loaded = true;
    notify();
  } catch (err) {
    console.error('[cellCountService] load error:', err);
  }
}

function ensureRealtime() {
  if (realtimeChannel) return;
  try {
    realtimeChannel = supabase
      .channel('realtime:public:cell_counts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cell_counts' }, (payload) => {
        const row = payload.new;
        latestByCell.set(row.cell_id, row);
        historyByCell.set(row.cell_id, [...(historyByCell.get(row.cell_id) || []), { t: row.computed_at, total: (Number(row.count) || 0) + (Number(row.test_count) || 0) }].slice(-90));
        const cell = cells.find((c) => c.cellId === row.cell_id);
        if (cell) {
          cell.count = Number(row.count) || 0;
          cell.testCount = Number(row.test_count) || 0;
          cell.total = cell.count + cell.testCount;
          cell.computedAt = row.computed_at;
        }
        notify();
      })
      .subscribe();
  } catch (err) {
    console.error('[cellCountService] realtime error:', err);
  }
}

// Realtime can lag in some environments — 60s poll as a safety net.
function ensurePolling() {
  if (pollTimer) return;
  pollTimer = window.setInterval(async () => {
    // Refresh without clearing realtime cache assumptions
    try {
      const { data } = await supabase
        .from('cell_counts')
        .select('id, cell_id, count, test_count, computed_at')
        .order('computed_at', { ascending: false })
        .limit(120);
      if (!data) return;
      latestByCell = new Map();
      for (const cc of data) {
        if (!latestByCell.has(cc.cell_id)) latestByCell.set(cc.cell_id, cc);
      }
      for (const cell of cells) {
        const latest = latestByCell.get(cell.cellId);
        if (latest) {
          cell.count = Number(latest.count) || 0;
          cell.testCount = Number(latest.test_count) || 0;
          cell.total = cell.count + cell.testCount;
          cell.computedAt = latest.computed_at;
        }
      }
      notify();
    } catch (err) {
      console.error('[cellCountService] poll error:', err);
    }
  }, 60000);
}

async function ensure() {
  if (!loaded) await load();
  ensureRealtime();
  ensurePolling();
}

export const cellCountService = {
  list: async () => { await ensure(); return cells; },
  getByCellLabel: async (label) => {
    await ensure();
    return cells.find((c) => c.cellLabel?.toLowerCase() === String(label).toLowerCase()) || null;
  },
  getByZoneId: async (zoneId) => {
    await ensure();
    return cells.find((c) => c.zoneId === zoneId) || null;
  },
  // Trend for the display string: uses real cell_counts history
  getCellTrend: (cell, windowMinutes = 30) => {
    if (!cell || !cell.history || cell.history.length < 2) return { ratePerMin: 0, samples: 0 };
    const now = Date.now();
    const windowStart = now - windowMinutes * 60000;
    const filtered = cell.history.filter((h) => new Date(h.t).getTime() >= windowStart);
    if (filtered.length < 2) return { ratePerMin: 0, samples: filtered.length };
    const first = filtered[0];
    const last = filtered[filtered.length - 1];
    const minutes = Math.max(1, (new Date(last.t) - new Date(first.t)) / 60000);
    return {
      ratePerMin: ((last.total - first.total) / minutes) || 0,
      samples: filtered.length,
    };
  },
  subscribe: (fn) => {
    subscribers.add(fn);
    fn(cells);
    ensure();
    return () => subscribers.delete(fn);
  },
};