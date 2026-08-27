import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import SectionTitle from '../../components/common/SectionTitle';
import { MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/format';

const TYPE_LABELS = {
  REST: 'Rest Shelter',
  SEVA_REST: 'Seva Night Rest',
  PAID: 'Paid Lodge',
  DHARMSHALA: 'Dharamshala',
  CAMP_STAY: 'Base Camp Stay',
};

const TYPE_ICONS = { REST: '🛏️', SEVA_REST: '🌙', PAID: '🏨', DHARMSHALA: '🛕', CAMP_STAY: '⛺' };

const amenityIcon = (a) => {
  const map = {
    washroom: '🚻', water: '💧', lighting: '💡', security: '🛡️',
    mat: '🧺', bed: '🛏️', fan: '🌀', 'attached bath': '🚿', toilet: '🚻',
  };
  return map[a] || '•';
};

export default function StayPage() {
  const { t } = useTranslation();
  const { stays, stayService, bookingSucceededId } = useApp();
  const [error, setError] = useState(null);
  const [parties, setParties] = useState({});

  const list = Array.isArray(stays) ? stays : [];

  const summary = useMemo(() => {
    const total = list.length;
    const open = list.filter((s) => s.status === 'OPEN').length;
    const capacity = list.reduce((s, r) => s + (r.capacity || 0), 0);
    const available = list.reduce((s, r) => s + (r.available || 0), 0);
    const pct = capacity > 0 ? Math.round((available / capacity) * 100) : 0;
    return { total, open, capacity, available, pct };
  }, [list]);

  const handleBook = async (listing) => {
    setError(null);
    const partySize = parts(parties, listing.id);
    if (!partySize) { setError('Choose a party size to reserve.'); return; }
    if (partySize > (listing.available || 0)) { setError(`Only ${listing.available} spot${(listing.available || 0) !== 1 ? 's' : ''} left at this stay.`); return; }
    const res = await stayService.book({ listingId: listing.id, partySize, source: 'MANUAL' });
    if (!res.success) { setError(res.error || 'Could not reserve.'); return; }
    setParties((p) => ({ ...p, [listing.id]: undefined }));
  };

  return (
    <>
      <PageHeader
        eyebrow={t('stay.eyebrow', 'Stay Services')}
        title={t('stay.title', 'Places to Rest')}
        description={t('stay.description', 'Open shelters, sevas and lodgings along the route with live availability.')}
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-5">
          <p className="text-2xl font-bold text-ink">{summary.open}<span className="text-base text-slate-400">/{summary.total}</span></p>
          <p className="label mt-1">Stays open now</p>
        </div>
        <div className="surface p-5">
          <p className="text-2xl font-bold text-ink">{summary.available.toLocaleString()}</p>
          <p className="label mt-1">Spots available</p>
        </div>
        <div className="surface p-5">
          <p className="text-2xl font-bold text-ink">{summary.pct}%</p>
          <p className="label mt-1">Overall capacity free</p>
        </div>
      </section>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => {
          const pct = s.capacity > 0 ? Math.round(((s.available || 0) / s.capacity) * 100) : 0;
          return (
            <div key={s.id} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-saffron-50 text-lg">{TYPE_ICONS[s.type]}</span>
                  <div>
                    <p className="text-sm font-bold text-ink">{s.name}</p>
                    <p className="text-[11px] text-slate-400">{TYPE_LABELS[s.type] || s.type}</p>
                  </div>
                </div>
                <Badge tone={s.status === 'OPEN' ? 'green' : s.status === 'FULL' ? 'red' : 'slate'}>{s.status}</Badge>
              </div>

              <p className="mt-3 flex items-center gap-1 text-xs text-slate-400"><MapPinIcon className="h-3.5 w-3.5" />{s.zone_name || 'Route'}</p>

              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={cn('h-full rounded-full', pct > 15 ? 'bg-forest' : pct > 6 ? 'bg-saffron' : 'bg-red-500')} style={{ width: `${Math.max(2, pct)}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{s.available}/{s.capacity} spots free</p>
              </div>

              {Array.isArray(s.amenities) && s.amenities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.amenities.map((a) => (
                    <span key={a} className="rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-600">{amenityIcon(a)} {a}</span>
                  ))}
                </div>
              )}
              {s.notes && <p className="mt-3 text-xs leading-5 text-slate-500">{s.notes}</p>}

              {s.status !== 'CLOSED' && (
                <div className="mt-4 flex items-center gap-2">
                  <select
                    value={parties[s.id] || ''}
                    onChange={(e) => setParties((p) => ({ ...p, [s.id]: Number(e.target.value) }))}
                    className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-saffron-200"
                  >
                    <option value="">Party size</option>
                    {[1, 2, 3, 4].filter((n) => n <= (s.available || 0)).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleBook(s)}
                    className={cn(
                      'inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-white transition',
                      s.status === 'FULL' ? 'cursor-not-allowed bg-slate-300' : 'bg-forest hover:bg-forest/90',
                    )}
                    disabled={s.status === 'FULL'}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    {bookingSucceededId === s.id ? 'Saved' : 'Request'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}

function parts(map, id) {
  const v = map[id];
  return typeof v === 'number' && v > 0 ? v : 0;
}
