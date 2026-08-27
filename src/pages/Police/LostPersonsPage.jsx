import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { UserIcon, MapPinIcon, PhoneIcon, EyeIcon, CameraIcon } from '@heroicons/react/24/outline';

const statusBadge = { OPEN: 'red', ACKNOWLEDGED: 'orange', IN_PROGRESS: 'blue', RESPONDING: 'blue', RESOLVED: 'green', CLOSED: 'green' };

export default function LostPersonsPage() {
  const { t } = useTranslation();
  const { incidents, lostFoundService, sightings } = useApp();

  const [lostPeople, setLostPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [lost, found] = await Promise.all([
        lostFoundService?.listLost() || [],
        lostFoundService?.listFound() || [],
      ]);
      if (!cancelled) {
        setLostPeople([...lost, ...found]);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [lostFoundService, sightings]);

  const sightingCounts = useMemo(() => {
    const counts = {};
    for (const s of sightings || []) {
      counts[s.incident_id] = (counts[s.incident_id] || 0) + 1;
    }
    return counts;
  }, [sightings]);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <>
      <PageHeader
        eyebrow={t('police.title', 'Security Console')}
        title={t('police.lostPersons', 'Lost Person Alerts')}
        description={t('police.lostPersonsDesc', 'Reports of missing pilgrims on the route.')}
      />

      {loading ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-saffron border-t-transparent" />
          <p className="mt-3 text-sm font-bold text-slate-500">Loading reports...</p>
        </div>
      ) : lostPeople.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <UserIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('police.noMissingPersons', 'No missing person reports')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('police.noMissingPersonsDesc', 'There are currently no active missing person alerts.')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lostPeople.map((p) => {
            const count = sightingCounts[p.id] || 0;
            const isResolved = p.status === 'RESOLVED';
            return (
              <div key={p.id} className="surface overflow-hidden transition-all duration-200 hover:shadow-card-hover">
                {/* Photo or initials */}
                {p.photo_url ? (
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <img src={p.photo_url} alt={p.pilgrim_name || 'Missing person'} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-base font-bold text-white drop-shadow">{p.pilgrim_name || 'Unknown'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {p.person_age && <span className="text-xs text-white/90">Age ~{p.person_age}</span>}
                        {p.person_gender && <span className="text-xs text-white/90">{p.person_gender}</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 border-b border-slate-100 p-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-50 text-lg font-bold text-amber-600">
                      {(p.pilgrim_name || '??').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{p.pilgrim_name || p.title}</p>
                      <p className="text-xs text-slate-400">
                        {p.zone_name || t('police.unknownZone', 'Unknown zone')}
                        {p.created_at && <> &middot; {formatTimeAgo(p.created_at)}</>}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Details */}
                  {p.clothing_description && (
                    <div className="rounded-xl bg-saffron-50 px-3 py-2">
                      <p className="text-xs font-bold text-saffron-700">Clothing</p>
                      <p className="mt-0.5 text-xs text-slate-700">{p.clothing_description}</p>
                    </div>
                  )}

                  {/* Location */}
                  {(p.last_seen_location || p.found_location) && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                      {isResolved ? `Found: ${p.found_location}` : `Last seen: ${p.last_seen_location}`}
                    </p>
                  )}

                  {/* Phone */}
                  {p.contact_phone && (
                    <a href={`tel:${p.contact_phone}`} className="flex items-center gap-1.5 text-xs font-bold text-saffron hover:underline">
                      <PhoneIcon className="h-3.5 w-3.5" /> {p.contact_phone}
                    </a>
                  )}

                  {/* Sighting count */}
                  {count > 0 && (
                    <div className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                      <EyeIcon className="h-3.5 w-3.5" />
                      {count} {count === 1 ? 'sighting' : 'sightings'}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <Badge tone={statusBadge[p.status] || 'slate'}>{(p.status || 'OPEN').replace('_', ' ')}</Badge>
                    {isResolved && <Badge tone="green">Reunited</Badge>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
