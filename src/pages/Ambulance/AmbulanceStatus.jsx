import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import {
  TruckIcon,
  MapPinIcon,
  ArrowDownTrayIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import { ambulanceService } from '../../services/ambulanceService';
import { cn } from '../../utils/format';

const STATUS_META = {
  AVAILABLE: { label: 'Available', tone: 'green', dot: '🟢', order: 0 },
  ON_DUTY: { label: 'On Duty', tone: 'orange', dot: '🟡', order: 1 },
  EMERGENCY: { label: 'Emergency', tone: 'red', dot: '🔴', order: 2 },
  OFFLINE: { label: 'Offline', tone: 'slate', dot: '⚫', order: 3 },
};

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'EMERGENCY', label: 'Emergency' },
  { id: 'AVAILABLE', label: 'Available' },
  { id: 'ON_DUTY', label: 'On Duty' },
  { id: 'OFFLINE', label: 'Offline' },
];

const TYPE_LABEL = {
  BLS: 'BLS',
  ALS: 'ALS',
  Van: 'Van',
  Oxygen: 'Oxygen',
  Other: 'Ambulance',
};

function trailDistanceKm(trail) {
  if (!Array.isArray(trail) || trail.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1];
    const b = trail[i];
    if (a?.lat == null || b?.lat == null) continue;
    total += ambulanceService.distanceKm(Number(a.lat), Number(a.lng), Number(b.lat), Number(b.lng));
  }
  return Math.round(total * 10) / 10;
}

export default function AmbulanceStatus() {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    const unsub = ambulanceService.subscribe((list) => {
      setAmbulances(Array.isArray(list) ? list : []);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Show ALL ambulances (public view), sorted by status priority then recency.
  const sorted = useMemo(
    () =>
      [...ambulances].sort((a, b) => {
        const d = (STATUS_META[a?.status]?.order ?? 99) - (STATUS_META[b?.status]?.order ?? 99);
        if (d !== 0) return d;
        return new Date(b?.updated_at || 0) - new Date(a?.updated_at || 0);
      }),
    [ambulances],
  );

  const emergencyCount = ambulances.filter((a) => a.status === 'EMERGENCY').length;

  const filtered = useMemo(
    () => (filter === 'ALL' ? sorted : sorted.filter((a) => a.status === filter)),
    [sorted, filter],
  );

  const summary = useMemo(
    () => ({
      total: ambulances.length,
      emergency: emergencyCount,
      available: ambulances.filter((a) => a.status === 'AVAILABLE').length,
      onDuty: ambulances.filter((a) => a.status === 'ON_DUTY').length,
      offline: ambulances.filter((a) => a.status === 'OFFLINE').length,
    }),
    [ambulances, emergencyCount],
  );

  return (
    <>
      <PageHeader
        eyebrow="Emergency Transport"
        title="Ambulance Status"
        description="Live status, location and routing of all registered emergency ambulances."
      />

      {emergencyCount > 0 && (
        <div className="mb-6 animate-pulse rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-bold text-red-700">
            🚨 {emergencyCount} ambulance{emergencyCount > 1 ? 's' : ''} in active emergency
          </p>
          <p className="mt-1 text-xs text-red-500">Please give way and clear the path.</p>
        </div>
      )}

      {/* Status filter */}
      {!loading && (
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs font-bold transition',
                  active
                    ? 'bg-saffron text-white shadow-[0_2px_10px_rgba(249,115,22,.3)]'
                    : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50',
                )}
              >
                {f.label}
                {f.id !== 'ALL' && (
                  <span className={cn('ml-1.5 tabular-nums', active ? 'text-white/80' : 'text-slate-400')}>
                    {summary[f.id.toLowerCase()] ?? 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-saffron border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Loading ambulance status...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <TruckIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">No ambulances in this status</p>
          <p className="mt-1 text-sm text-slate-400">
            {filter === 'ALL'
              ? 'No approved ambulances registered yet.'
              : `There are no ${STATUS_META[filter]?.label.toLowerCase() || ''} ambulances right now.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => {
            const meta = STATUS_META[a.status] || STATUS_META.OFFLINE;
            const loc = a.current_location || {};
            const hasLoc = loc.lat != null;
            const travelKm = trailDistanceKm(a.route_trail);
            return (
              <div
                key={a.id}
                className={cn(
                  'surface flex flex-col gap-4 p-5',
                  a.status === 'EMERGENCY' && 'border-red-200 ring-1 ring-red-100',
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-11 w-11 place-items-center rounded-xl text-lg"
                      style={{ backgroundColor: `${a.color || '#D32F2F'}22`, color: a.color || '#D32F2F' }}
                    >
                      🚑
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">{a.ambulance_id}</p>
                      <p className="text-[11px] text-slate-400 capitalize">
                        {a.color || 'white'} ambulance
                        {a.ambulance_type && <span> · {TYPE_LABEL[a.ambulance_type] || a.ambulance_type}</span>}
                      </p>
                    </div>
                  </div>
                  <Badge tone={meta.tone} dot>
                    {meta.label}
                  </Badge>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                  <MapPinIcon className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-600">
                    {hasLoc
                      ? `${Number(loc.lat).toFixed(4)}, ${Number(loc.lng).toFixed(4)}`
                      : 'Location pending'}
                  </span>
                </div>

                {/* Routing details */}
                {a.status === 'EMERGENCY' && a.destination_hospital?.name && (
                  <div className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5 text-xs text-red-700">
                    <p className="font-bold">Destination</p>
                    <p className="mt-0.5">{a.destination_hospital.name}</p>
                    {a.etas?.distanceKm != null && (
                      <p className="mt-1 text-red-500">
                        {a.etas.distanceKm} km away
                        {a.etas.durationMin != null ? ` · ~${a.etas.durationMin} min` : ''}
                      </p>
                    )}
                  </div>
                )}

                {/* Route trail + distance */}
                {Array.isArray(a.route_trail) && a.route_trail.length > 0 && (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                    <MapIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-600">
                      Travel path {a.route_trail.length} pts
                      {travelKm > 0 ? ` · ${travelKm} km` : ''}
                    </span>
                  </div>
                )}

                {/* Emergency started */}
                {a.status === 'EMERGENCY' && a.emergency_started_at && (
                  <div className="text-[11px] text-red-500">
                    Emergency started {new Date(a.emergency_started_at).toLocaleTimeString()}
                  </div>
                )}

                <div className="mt-auto pt-1 text-center">
                  <span className="text-[11px] text-slate-400">
                    <ArrowDownTrayIcon className="mr-1 inline h-3 w-3" />
                    Live every few seconds
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
