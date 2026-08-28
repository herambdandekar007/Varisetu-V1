import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { AdjustmentsHorizontalIcon, ArrowPathIcon, BoltIcon, FunnelIcon, MapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SectionTitle from '../../components/common/SectionTitle';
import RouteMap from '../../components/maps/RouteMap';
import CrowdTrendChart from '../../components/charts/CrowdTrendChart';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/format';

const FILTER_MAP = {
  'All density': null,
  'High risk': (z) => z.risk > 70,
  'Pilgrim flow': (z) => z.people > 500,
  'Resources': (z) => /resource|camp|water|food|medical/i.test(z.name + ' ' + (z.detail || '')),
  'Emergency': (z) => /emergency|sos|alert|incident/i.test(z.name + ' ' + (z.detail || '')),
};
const filters = Object.keys(FILTER_MAP);

export default function CrowdPage() {
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState('All density');
  const { zones, simulation, activeDemo, toggleCrowdSimulation } = useApp();

  const filteredZones = (() => {
    const filterFn = FILTER_MAP[selectedFilter];
    if (!filterFn) return zones;
    return zones.filter(filterFn);
  })();

  const predictedValue = activeDemo === 'crowd-simulation'
    ? `${(simulation.predictedCrowdCount / 1000).toFixed(0)}k`
    : '84k';
  const confidencePct = activeDemo === 'crowd-simulation'
    ? Math.min(96, 70 + Math.round(simulation.riskScore / 8))
    : 78;
  const predictedSubtitle = activeDemo === 'crowd-simulation'
    ? 'Demo simulated peak · updating live'
    : 'Predicted peak at 10:40 AM';

  const handleRefresh = () => {
    if (activeDemo !== 'crowd-simulation') {
      toggleCrowdSimulation();
      toast.success('Demo live simulation started. Crowd data will update every few seconds.');
    } else {
      toast('Live simulation is already running. Data updates periodically.');
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={t('crowd.eyebrow')}
        title={t('crowd.title')}
        description={activeDemo === 'crowd-simulation' ? 'Demo · Simulated live crowd data · Updates every few seconds' : t('crowd.description')}
        actions={
          <>
            <Button variant="outline" icon={FunnelIcon}>{t('crowd.exportBriefing')}</Button>
            <Button icon={ArrowPathIcon} onClick={handleRefresh}>
              {activeDemo === 'crowd-simulation' ? 'Demo Live' : t('crowd.refresh')}
            </Button>
          </>
        }
      />

      <section className="grid gap-6 2xl:grid-cols-[1.42fr_.58fr]">
        <article className="surface overflow-hidden p-4 sm:p-5">
          <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <SectionTitle
              title={t('crowd.liveHeatmap')}
              detail={activeDemo === 'crowd-simulation' ? 'Demo simulated · updating live' : 'Updated 42 seconds ago'}
            />
            <div className="flex gap-2 overflow-auto pb-1 lg:pb-0">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={cn(
                    'whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition min-h-[44px]',
                    selectedFilter === filter ? 'bg-ink text-white' : 'bg-slate-100 text-slate-500 hover:text-ink',
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="relative h-[500px] overflow-hidden rounded-2xl">
            <RouteMap mode="crowd" />
          </div>
        </article>

        <aside className="surface p-5">
          <SectionTitle
            title={t('common.live')}
            detail={activeDemo === 'crowd-simulation' ? 'Demo · Simulated zone risk' : t('crowd.zoneRisk')}
          />
          <div className="mt-4 space-y-3">
            {filteredZones.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No zones match this filter.</p>
            ) : filteredZones.map((zone) => (
              <div key={zone.name} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: zone.color }} aria-hidden="true" />
                    <p className="text-sm font-bold text-ink">{zone.name}</p>
                  </div>
                  <Badge tone={zone.risk > 70 ? 'red' : zone.risk > 50 ? 'orange' : 'green'}>{zone.density}</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">{zone.detail}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">{zone.people} pilgrims</span>
                  <span className="text-slate-600">Risk: {zone.risk}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-ink p-5 text-white">
            <div className="flex items-center gap-2">
              <BoltIcon className="h-5 w-5 text-saffron" aria-hidden="true" />
              <p className="text-sm font-bold">{t('crowd.aiForecast')}</p>
              {activeDemo === 'crowd-simulation' && (
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-amber-300/80">Demo Live</span>
              )}
            </div>
            <p className="mt-3 text-3xl font-bold">{predictedValue}</p>
            <p className="mt-1 text-xs text-emerald-50/70">{predictedSubtitle}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-saffron transition-all duration-700" style={{ width: `${confidencePct}%` }} />
            </div>
            <p className="mt-2 text-xs font-bold text-saffron-200">{confidencePct}% confidence</p>
          </div>
        </aside>
      </section>
    </>
  );
}
