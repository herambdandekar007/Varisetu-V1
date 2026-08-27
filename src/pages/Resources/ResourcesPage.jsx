import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { ArrowPathIcon, ChartPieIcon, ExclamationTriangleIcon, MapPinIcon, TruckIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SectionTitle from '../../components/common/SectionTitle';
import MetricCard from '../../components/cards/MetricCard';
import RouteMap from '../../components/maps/RouteMap';
import ResourceUsageChart from '../../components/charts/ResourceUsageChart';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/format';

const TYPE_FILTERS = ['All', 'WATER', 'FOOD', 'MEDICAL', 'TOILET', 'CAMP', 'REST'];

const TYPE_COLORS = {
  WATER: 'bg-blue-100 text-blue-700',
  FOOD: 'bg-amber-100 text-amber-700',
  MEDICAL: 'bg-red-100 text-red-700',
  TOILET: 'bg-violet-100 text-violet-700',
  CAMP: 'bg-emerald-100 text-emerald-700',
  REST: 'bg-emerald-100 text-emerald-700',
  AMBULANCE: 'bg-red-100 text-red-700',
  MEDICINE: 'bg-pink-100 text-pink-700',
  DOCTOR: 'bg-red-100 text-red-700',
  BARRICADE: 'bg-slate-100 text-slate-700',
};

const TYPE_ICONS = {
  WATER: '💧',
  FOOD: '🍲',
  MEDICAL: '🏥',
  TOILET: '🚻',
  CAMP: '⛺',
  REST: '🛏️',
  AMBULANCE: '🚑',
  MEDICINE: '💊',
  DOCTOR: '👨‍⚕️',
  BARRICADE: '🚧',
};

export default function ResourcesPage() {
  const { t } = useTranslation();
  const { camps, crowdCells } = useApp();
  const [selectedType, setSelectedType] = useState('All');
  const [syncing, setSyncing] = useState(false);

  const resources = useMemo(() => {
    if (!Array.isArray(camps)) return [];
    return selectedType === 'All' ? camps : camps.filter((c) => c.type === selectedType);
  }, [camps, selectedType]);

  const stats = useMemo(() => {
    const all = Array.isArray(camps) ? camps : [];
    const total = all.length;
    const open = all.filter((r) => r.status === 'OPEN' || r.status === 'SERVING').length;
    const lowStock = all.filter((r) => r.status === 'LOW_STOCK').length;
    const closed = all.filter((r) => r.status === 'CLOSED').length;
    const capacitySum = all.reduce((s, r) => s + (r.capacity || 0), 0);
    const availableSum = all.reduce((s, r) => s + (r.available || 0), 0);
    const pct = capacitySum > 0 ? Math.round((availableSum / capacitySum) * 100) : 0;

    const byType = {};
    all.forEach((r) => {
      if (!byType[r.type]) byType[r.type] = { total: 0, available: 0, capacity: 0 };
      byType[r.type].total++;
      byType[r.type].available += r.available || 0;
      byType[r.type].capacity += r.capacity || 0;
    });

    return { total, open, lowStock, closed, pct, byType };
  }, [camps]);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1500);
  };

  return (
    <>
      <PageHeader
        eyebrow={t('resources.eyebrow')}
        title={t('resources.title')}
        description={t('resources.description')}
        actions={
          <Button icon={ArrowPathIcon} onClick={handleSync} loading={syncing}>
            {t('resources.syncInventories')}
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ChartPieIcon} label={t('resources.overallAvailability')} value={`${stats.pct}%`} helper={`Across ${stats.total} active points`} trend={{ label: stats.pct > 70 ? 'Healthy' : 'Needs attention', direction: stats.pct > 70 ? 'up' : 'alert' }} tone={stats.pct > 70 ? 'green' : 'orange'} />
        <MetricCard icon={MapPinIcon} label={t('resources.activeCamps')} value={String(stats.open)} helper={`${stats.total} total registered`} trend={{ label: `${stats.closed} closed`, direction: 'down' }} tone="blue" />
        <MetricCard icon={TruckIcon} label={t('resources.supplyVehicles')} value={String(crowdCells?.length || 0)} helper="Zones monitored" trend={{ label: 'Live tracking', direction: 'up' }} tone="blue" />
        <MetricCard icon={ExclamationTriangleIcon} label={t('resources.shortageWatches')} value={String(stats.lowStock)} helper={stats.lowStock > 0 ? 'Requires resupply' : 'All stocked'} trend={{ label: stats.lowStock > 0 ? 'Review' : 'All clear', direction: stats.lowStock > 0 ? 'alert' : 'up' }} tone={stats.lowStock > 0 ? 'red' : 'green'} />
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[.9fr_1.1fr]">
        <article className="surface p-5">
          <SectionTitle title={t('resources.resourceReadiness')} detail="Availability across the corridor" action={<Badge tone={stats.pct > 70 ? 'green' : 'orange'} dot>{stats.pct > 70 ? t('common.healthy') : 'Attention'}</Badge>} />
          <div className="relative h-[280px]">
            <ResourceUsageChart height={280} />
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-4xl font-bold text-ink">{stats.pct}%</p>
                <p className="label mt-1">{t('resources.overallAvailability')}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4">
            {Object.entries(stats.byType).slice(0, 4).map(([type, data]) => {
              const typePct = data.capacity > 0 ? Math.round((data.available / data.capacity) * 100) : 0;
              return (
                <div key={type}>
                  <p className={cn('h-2 w-2 rounded-full', type === 'WATER' ? 'bg-forest' : type === 'FOOD' ? 'bg-saffron' : type === 'MEDICAL' ? 'bg-blue-500' : 'bg-violet-500')} />
                  <p className="mt-2 text-xs font-bold">{type.charAt(0) + type.slice(1).toLowerCase()}</p>
                  <p className="text-xs text-slate-400">{typePct}% stocked</p>
                </div>
              );
            })}
          </div>
        </article>

        <article className="surface p-5">
          <SectionTitle title="Resource Inventory" detail={`Showing ${resources.length} ${selectedType === 'All' ? 'total' : selectedType.toLowerCase()} resources`} />
          <div className="mt-3 flex flex-wrap gap-2">
            {TYPE_FILTERS.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  'whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition',
                  selectedType === type ? 'bg-ink text-white' : 'bg-slate-100 text-slate-500 hover:text-ink',
                )}
              >
                {type === 'All' ? 'All' : `${TYPE_ICONS[type] || ''} ${type.charAt(0) + type.slice(1).toLowerCase()}`}
              </button>
            ))}
          </div>
          <div className="mt-4 max-h-[440px] space-y-2 overflow-y-auto">
            {resources.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <MapPinIcon className="h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">No resources found</p>
                <p className="mt-1 text-xs text-slate-400">Try a different filter or sync inventories.</p>
              </div>
            ) : (
              resources.map((r) => {
                const capPct = r.capacity > 0 ? Math.round(((r.available || 0) / r.capacity) * 100) : 0;
                const statusColor = r.status === 'OPEN' || r.status === 'SERVING' ? 'green' : r.status === 'LOW_STOCK' ? 'orange' : 'red';
                return (
                  <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition hover:shadow-sm">
                    <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm', TYPE_COLORS[r.type] || 'bg-slate-100 text-slate-600')}>
                      {TYPE_ICONS[r.type] || '📍'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold text-ink">{r.name}</p>
                        <Badge tone={statusColor}>{(r.status || 'OPEN').replace('_', ' ')}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{r.zone_name || 'Corridor'} · {r.type}</p>
                      {r.capacity > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={cn('h-full rounded-full transition-all', capPct > 60 ? 'bg-forest' : capPct > 30 ? 'bg-saffron' : 'bg-red-500')}
                              style={{ width: `${Math.min(100, capPct)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{r.available || 0}/{r.capacity}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>
    </>
  );
}
