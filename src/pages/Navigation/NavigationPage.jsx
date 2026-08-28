import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon, ArrowTrendingDownIcon, BoltIcon, CheckCircleIcon, ClockIcon, MapPinIcon, SpeakerWaveIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import RouteMap from '../../components/maps/RouteMap';
import Timeline from '../../components/common/Timeline';
import { useApp } from '../../context/AppContext';
import { routeAdvisorService } from '../../services/routeAdvisorService';
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
  const { activeDemo, simulation, routes, routeRecommendation, aiRouteRec, weather, aiPressure, locationPermission, pilgrimLocation, liveRoute } = useApp();
  const [selectedRoute, setSelectedRoute] = useState('recommended');
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originResults, setOriginResults] = useState([]);
  const [destResults, setDestResults] = useState([]);
  const [originSelected, setOriginSelected] = useState(null);
  const [destSelected, setDestSelected] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
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

  // Arbitrary location search handlers
  const handleOriginSearch = useCallback(async (q) => {
    setOriginQuery(q);
    if (q.length < 3) { setOriginResults([]); return; }
    const results = await routeAdvisorService.geocode(q);
    setOriginResults(results);
    setShowOriginDropdown(true);
  }, []);

  const handleDestSearch = useCallback(async (q) => {
    setDestQuery(q);
    if (q.length < 3) { setDestResults([]); return; }
    const results = await routeAdvisorService.geocode(q);
    setDestResults(results);
    setShowDestDropdown(true);
  }, []);

  const handleFindRoute = async () => {
    if (!originSelected || !destSelected) {
      toast.error('Select both origin and destination from the suggestions.');
      return;
    }
    setRouteLoading(true);
    setRouteResult(null);
    try {
      const result = await routeAdvisorService.getRoute(
        [originSelected.lat, originSelected.lng],
        [destSelected.lat, destSelected.lng],
        { originName: originSelected.name, destinationName: destSelected.name },
      );
      setRouteResult(result);
      if (result.error) {
        toast.error(`Routing failed: ${result.error}`);
      } else {
        toast.success(`Route found: ${result.distanceKm} km, ~${result.durationMin} min walk`);
      }
    } catch (err) {
      toast.error('Failed to compute route');
    } finally {
      setRouteLoading(false);
    }
  };

  const handleQuickLocate = async () => {
    if (!navigator.geolocation) { toast.error('GPS not available'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const addr = await routeAdvisorService.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setOriginSelected({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: addr });
        setOriginQuery(addr.split(',')[0]);
        toast.success('Current location set as origin');
      },
      () => toast.error('Could not get your location'),
    );
  };
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
                {isSimRunning ? 'Demo: Simulated' : 'Live'}: {pilgrimLocation?.zoneName || 'Starting point'} · {liveRoute ? `${liveRoute.distanceKm} km remaining` : 'Loading route...'}
              </p>
            </div>
            <Badge tone={locationPermission === 'granted' ? 'green' : locationPermission === 'denied' ? 'red' : 'orange'} dot>{locationPermission === 'granted' ? 'GPS connected' : locationPermission === 'denied' ? 'GPS unavailable' : 'Connecting GPS...'}</Badge>
          </div>
          <div className="relative h-[480px]">
            <RouteMap />
          </div>
        </article>

        <aside className="surface p-5">
          <p className="eyebrow">{t('navigation.recommendedRoute')}</p>
          <h2 className="text-xl font-bold text-ink">{summaryHeaderTitle}</h2>
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-emerald-50 p-4 text-center">
            <div>
              <p className="text-lg font-bold text-forest truncate">{liveRoute?.distanceKm ? `${liveRoute.distanceKm} km` : rec?.recommended?.distance || '—'}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700/70">{t('navigation.distance')}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-forest truncate">{liveRoute?.durationMin ? `${liveRoute.durationMin} min` : rec?.recommended?.eta || '—'}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700/70">{t('navigation.eta')}</p>
            </div>
            <div>
              <p className={cn('text-lg font-bold truncate', summaryRiskColorClass)}>{summaryRisk}</p>
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

      {/* AI Route Advisor — arbitrary location search */}
      <section className="mt-6">
        <article className="surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">AI Route Advisor</p>
              <h2 className="text-lg font-bold text-ink">Find route from any location</h2>
              <p className="mt-1 text-sm text-slate-500">Enter any origin and destination. Uses real OpenStreetMap routing data.</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink/5 text-ink">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {/* Origin */}
            <div className="relative">
              <label className="label">Starting point</label>
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pl-9 text-sm text-ink focus:border-forest focus:ring-2 focus:ring-emerald-100 outline-none"
                    placeholder="e.g. Pune Railway Station"
                    value={originQuery}
                    onChange={(e) => handleOriginSearch(e.target.value)}
                    onFocus={() => setShowOriginDropdown(true)}
                  />
                  <MapPinIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  {originQuery && (
                    <button onClick={() => { setOriginQuery(''); setOriginSelected(null); setOriginResults([]); }} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button onClick={handleQuickLocate} className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-forest hover:bg-emerald-50" title="Use my current location">
                  <MapPinIcon className="h-4 w-4" />
                </button>
              </div>
              {showOriginDropdown && originResults.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {originResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { setOriginSelected(r); setOriginQuery(r.name.split(',')[0]); setShowOriginDropdown(false); setOriginResults([]); }}
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                    >
                      <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate text-ink">{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {originSelected && (
                <p className="mt-1.5 text-[11px] font-semibold text-forest">{originSelected.name.split(',').slice(0, 2).join(',')}</p>
              )}
            </div>

            {/* Destination */}
            <div className="relative">
              <label className="label">Destination</label>
              <div className="mt-2">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pl-9 text-sm text-ink focus:border-forest focus:ring-2 focus:ring-emerald-100 outline-none"
                    placeholder="e.g. Saswad Wari Camp"
                    value={destQuery}
                    onChange={(e) => handleDestSearch(e.target.value)}
                    onFocus={() => setShowDestDropdown(true)}
                  />
                  <MapPinIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  {destQuery && (
                    <button onClick={() => { setDestQuery(''); setDestSelected(null); setDestResults([]); }} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {showDestDropdown && destResults.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {destResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { setDestSelected(r); setDestQuery(r.name.split(',')[0]); setShowDestDropdown(false); setDestResults([]); }}
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                    >
                      <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate text-ink">{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {destSelected && (
                <p className="mt-1.5 text-[11px] font-semibold text-forest">{destSelected.name.split(',').slice(0, 2).join(',')}</p>
              )}
            </div>
          </div>

          <Button
            variant="primary"
            icon={MagnifyingGlassIcon}
            onClick={handleFindRoute}
            disabled={routeLoading || !originSelected || !destSelected}
            className="mt-4"
          >
            {routeLoading ? 'Computing route...' : 'Find Walking Route'}
          </Button>

          {/* Route result */}
          {routeResult && !routeResult.error && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow !text-emerald-700">Computed Route</p>
                  <h3 className="mt-1 text-base font-bold text-ink">
                    {routeResult.origin?.address?.split(',').slice(0, 2).join(',')} → {routeResult.destination?.address?.split(',').slice(0, 2).join(',')}
                  </h3>
                </div>
                <Badge tone="green">Live OSRM Data</Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xl font-bold text-ink">{routeResult.distanceKm} km</p>
                  <p className="label mt-1">Distance</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xl font-bold text-ink">{routeResult.durationMin} min</p>
                  <p className="label mt-1">Walking time</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xl font-bold text-ink">{routeResult.steps?.length || 0}</p>
                  <p className="label mt-1">Turns</p>
                </div>
              </div>

              {routeResult.steps?.length > 0 && (
                <div className="mt-4 max-h-48 space-y-1.5 overflow-y-auto">
                  {routeResult.steps.slice(0, 10).map((step, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">{i + 1}</span>
                      <span className="flex-1 text-slate-600">{step.instruction}</span>
                      <span className="shrink-0 font-semibold text-slate-400">{step.distance}m</span>
                    </div>
                  ))}
                  {routeResult.steps.length > 10 && (
                    <p className="text-center text-[11px] text-slate-400">+ {routeResult.steps.length - 10} more steps</p>
                  )}
                </div>
              )}

              {routeResult.aiAnalysis && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">AI Route Analysis</p>
                  <p className="mt-2 text-sm leading-5 text-slate-700 whitespace-pre-line">{routeResult.aiAnalysis}</p>
                  <p className="mt-2 text-[10px] text-slate-400">Powered by LLM · Advisory only</p>
                </div>
              )}
            </div>
          )}

          {routeResult?.error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {routeResult.error}
            </div>
          )}
        </article>
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
