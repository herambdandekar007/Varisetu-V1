import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ArrowRightIcon, ArrowTrendingDownIcon, BoltIcon, CheckCircleIcon, ClockIcon, MapPinIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import RouteMap from '../../components/maps/RouteMap';
import Timeline from '../../components/common/Timeline';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/format';

const DEFAULT_STOPS = [
  { name: 'Alandi Start', time: '08:00', status: 'passed' },
  { name: 'Loni Kalbhor', time: '09:30', status: 'passed' },
  { name: 'Canal Junction', time: '10:45', status: 'current' },
  { name: 'Yawat Halt', time: '13:15', status: 'next' },
  { name: 'Saswad Camp', time: '15:30', status: 'future' },
];

export default function NavigationPage() {
  const { t } = useTranslation();
  const { activeDemo, simulation, routes, routeRecommendation, aiRouteRec, weather, aiPressure, locationPermission } = useApp();
  const [selectedRoute, setSelectedRoute] = useState('recommended');
  const isSimRunning = activeDemo === 'crowd-simulation';
  const risk = aiPressure?.riskScore ?? simulation.riskScore;

  const rec = aiRouteRec || null;
  const mainRouteData = routes?.find((r) => r.id === 'route-main');
  const canalRouteData = routes?.find((r) => r.id === 'route-canal');

  const recMain = rec?.allRoutes?.find((r) => r.id === 'route-main');
  const recCanal = rec?.allRoutes?.find((r) => r.id === 'route-canal');
  const recommendedId = rec?.recommended?.id || (isSimRunning && risk >= 65 ? 'route-canal' : 'route-canal');

  const usualRisk = recMain?.computedRisk || mainRouteData?.risk || 'MEDIUM';
  const canalRisk = recCanal?.computedRisk || canalRouteData?.risk || 'LOW';

  const riskBadge = (r) => {
    if (r === 'CRITICAL' || r === 'HIGH') return { label: 'High risk', tone: 'red' };
    if (r === 'MEDIUM') return { label: 'Moderate risk', tone: 'orange' };
    return { label: 'Low risk', tone: 'green' };
  };

  const canalBadge = riskBadge(canalRisk);
  const usualBadge = riskBadge(usualRisk);

  const canalDescription = rec?.reason || (isSimRunning && risk >= 65
    ? 'Demo: Recommended now. Avoids the active crowd surge and keeps water support every 1.5 km.'
    : 'Avoids the Loni Market crossing and has water support every 1.5 km.');
  const usualDescription = isSimRunning && risk >= 85
    ? 'Demo: Severe crowd surge at Loni Market. Use the canal-side route instead.'
    : isSimRunning && risk >= 65
      ? 'Demo: High crowd at Loni Market. Canal-side route is safer.'
      : 'Shorter distance but congestion expected around the market crossing.';

  const routeOptions = [
    { id: 'recommended', title: 'Canal-side safer route', time: rec?.recommended?.eta || '2 hr 18 min', distance: rec?.recommended?.distance || '8.4 km', risk: canalBadge.label, description: canalDescription, tone: canalBadge.tone },
    { id: 'usual', title: 'Main procession route', time: recMain?.eta || '2 hr 29 min', distance: recMain?.distance || '7.9 km', risk: usualBadge.label, description: usualDescription, tone: usualBadge.tone },
  ];
  const activeRoute = routeOptions.find((route) => route.id === selectedRoute);

  const routeStopsData = useMemo(() => {
    if (rec?.recommended?.stops?.length) {
      return rec.recommended.stops.map((s, i) => ({
        name: s.name,
        time: s.time,
        status: i < 2 ? 'passed' : i === 2 ? 'current' : i === 3 ? 'next' : 'future',
      }));
    }
    if (routes?.length) {
      const main = routes.find((r) => r.is_recommended || r.type === 'PRIMARY') || routes[0];
      if (main?.highlights?.length) {
        return main.highlights.map((h, i) => ({
          name: h,
          time: i === 0 ? '08:00' : i === 1 ? '09:30' : i === 2 ? '10:45' : i === 3 ? '13:15' : '15:30',
          status: i < 2 ? 'passed' : i === 2 ? 'current' : i === 3 ? 'next' : 'future',
        }));
      }
    }
    return DEFAULT_STOPS;
  }, [routes, rec]);

  const summaryRisk = rec?.recommended?.computedRisk || (isSimRunning ? simulation.routeRisk : t('common.low'));
  const summaryRiskColorClass = summaryRisk === 'CRITICAL'
    ? 'text-red-600'
    : summaryRisk === 'HIGH'
      ? 'text-red-600'
      : summaryRisk === 'MEDIUM'
        ? 'text-amber-600'
        : 'text-forest';
  const summaryHeaderTitle = rec?.recommended?.id === 'route-main' ? 'Main procession route' : 'Canal-side safer route';

  return (
    <>
      <PageHeader
        eyebrow={t('navigation.eyebrow')}
        title={t('navigation.title')}
        description={isSimRunning ? 'Demo · Simulated live navigation guidance' : rec ? 'Dynamic route guidance based on live crowd, weather, and incident data' : t('navigation.description')}
        actions={
          <Button variant="outline" icon={SpeakerWaveIcon} onClick={() => toast.success('Voice guidance is enabled for your route.')}>
            {t('navigation.voiceGuidance')}
          </Button>
        }
      />

      <section className="grid gap-6 2xl:grid-cols-[1.35fr_.65fr]">
        <article className="surface overflow-hidden p-4 sm:p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-base font-bold text-ink">Alandi Start <ArrowRightIcon className="mx-1 inline h-4 w-4 text-slate-400" /> Saswad Camp</p>
              <p className="mt-1 text-xs text-slate-500">
                {isSimRunning ? 'Demo: Simulated · Live Loni Kalbhor · KM 11.2' : 'Live: Loni Kalbhor · KM 11.2'}
              </p>
            </div>
            <Badge tone={locationPermission === 'granted' ? 'green' : locationPermission === 'denied' ? 'red' : 'orange'} dot>{locationPermission === 'granted' ? 'GPS connected' : locationPermission === 'denied' ? 'GPS unavailable' : 'Connecting GPS...'}</Badge>
          </div>
          <div className="relative h-[480px]">
            <RouteMap />
            <div className="absolute left-4 top-4 z-[401] rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
              <p className="label">{t('navigation.activeGuidance')}</p>
              <p className="mt-1 text-sm font-bold text-ink">Continue for 180 m</p>
              <p className="mt-1 text-xs text-slate-500">towards water point W-14</p>
              {isSimRunning && (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-600">Demo Simulated</p>
              )}
            </div>
          </div>
        </article>

        <aside className="surface p-5">
          <p className="eyebrow">{t('navigation.recommendedRoute')}</p>
          <h2 className="text-xl font-bold text-ink">{summaryHeaderTitle}</h2>
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-emerald-50 p-4 text-center">
            <div>
              <p className="text-lg font-bold text-forest">{rec?.recommended?.distance || '8.4 km'}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700/70">{t('navigation.distance')}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-forest">{rec?.recommended?.eta || '2h 18m'}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700/70">{t('navigation.eta')}</p>
            </div>
            <div>
              <p className={cn('text-lg font-bold', summaryRiskColorClass)}>{summaryRisk}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700/70">{t('navigation.crowdRisk')}</p>
            </div>
          </div>
          <div className="mt-4">
            <Timeline
              items={routeStopsData.map((stop) => ({
                name: stop.name,
                time: stop.time,
                status: stop.status === 'passed' ? 'Completed' : stop.status === 'current' ? 'You are here' : stop.status === 'next' ? 'Meal, water & rest' : 'Overnight halt',
                tone: stop.status === 'current' ? 'bg-forest' : stop.status === 'next' ? 'bg-saffron' : 'bg-slate-300',
              }))}
            />
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <article className="surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">{t('navigation.recommendedRoute')}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isSimRunning ? 'Demo: Guidance is adapting to simulated crowd levels.' : 'We will keep monitoring your choice.'}
              </p>
            </div>
            <BoltIcon className="h-6 w-6 text-saffron" aria-hidden="true" />
          </div>
          <div className="mt-5 space-y-3">
            {routeOptions.map((route) => (
              <button
                key={route.id}
                onClick={() => setSelectedRoute(route.id)}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left transition',
                  selectedRoute === route.id
                    ? 'border-forest bg-emerald-50 ring-2 ring-emerald-100'
                    : 'border-slate-100 hover:border-slate-300',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink">{route.title}</p>
                      <Badge tone={route.tone}>{route.risk}</Badge>
                    </div>
                    <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">{route.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink">{route.time}</p>
                    <p className="mt-1 text-xs text-slate-400">{route.distance}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Button
            onClick={() => toast.success(`${activeRoute.title} is now your active route.`)}
            className="mt-5 w-full"
            icon={CheckCircleIcon}
          >
            Use this route
          </Button>
        </article>

        <article className="surface p-6">
          <h2 className="text-lg font-bold text-ink">Why this route is safer</h2>
          <div className="mt-5 space-y-4">
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-forest">
                <ArrowTrendingDownIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">{rec?.crowdReduction ? `${rec.crowdReduction}% less crowd pressure` : isSimRunning && risk >= 65 ? `${Math.min(62, 40 + Math.round(risk / 4))}% less crowd pressure` : '43% less crowd pressure'}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">The diversion stays below capacity during the next predicted peak.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <MapPinIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Support stays close</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Two water points, one rest shelter and a medical camp line the route.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-saffron-50 text-saffron">
                <ClockIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  {rec?.timeSaved ? `${rec.timeSaved} minutes saved` : isSimRunning && risk >= 85 ? '18 minutes saved' : '11 minutes saved'}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Avoiding the procession crossing balances the longer distance.</p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
