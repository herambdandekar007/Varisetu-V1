import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BoltIcon, CloudIcon, ExclamationTriangleIcon, MapPinIcon, ShieldCheckIcon, UserGroupIcon, UserIcon, PhoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SectionTitle from '../../components/common/SectionTitle';
import MetricCard from '../../components/cards/MetricCard';
import RouteMap from '../../components/maps/RouteMap';
import Modal from '../../components/common/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { alertService } from '../../services/alertService';
import { cn } from '../../utils/format';

const DEFAULT_STOPS = [
  { name: 'Alandi Start', time: '08:00', status: 'passed' },
  { name: 'Loni Kalbhor', time: '09:30', status: 'passed' },
  { name: 'Canal Junction', time: '10:45', status: 'current' },
  { name: 'Yawat Halt', time: '13:15', status: 'next' },
  { name: 'Saswad Camp', time: '15:30', status: 'future' },
];

export default function DashboardPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const {
    toggleCrowdSimulation,
    activeDemo,
    simulation,
    notifications,
    wariStatus,
    createEmergency,
    alerts,
    routeRecommendation,
    routes,
    crowdSummary,
    pilgrimLocation,
    weather,
    aiPressure,
    aiRouteRec,
  } = useApp();

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosDescription, setSosDescription] = useState('');
  const [sosSubmitting, setSosSubmitting] = useState(false);
  const [zoneAlerts, setZoneAlerts] = useState([]);

  useEffect(() => {
    const zoneId = pilgrimLocation?.zoneId || crowdSummary?.highestRiskZone?.id;
    if (zoneId) {
      alertService.listForPilgrim(zoneId).then(setZoneAlerts);
    } else {
      alertService.listActive().then(setZoneAlerts);
    }
  }, [pilgrimLocation?.zoneId, crowdSummary?.highestRiskZone?.id, alerts]);

  const riskLevel = aiPressure?.riskLevel || crowdSummary?.riskLevel || 'LOW';
  const riskScore = aiPressure?.riskScore ?? crowdSummary?.highestRiskZone?.riskScore ?? simulation.riskScore;
  const temp = weather?.temperature ?? simulation.temperature ?? 29;

  const safetyTone = riskLevel === 'CRITICAL'
    ? 'red'
    : riskLevel === 'HIGH'
      ? 'orange'
      : riskLevel === 'MEDIUM'
        ? 'amber'
        : 'green';

  const safetyLabel = riskLevel === 'CRITICAL'
    ? 'EMERGENCY'
    : riskLevel === 'HIGH'
      ? 'WARNING'
      : riskLevel === 'MEDIUM'
        ? 'CAUTION'
        : 'GOOD';

  const safetySummary = riskLevel === 'CRITICAL'
    ? 'Immediate danger. Follow emergency instructions.'
    : riskLevel === 'HIGH'
      ? 'Caution advised. Use alternate routes.'
      : riskLevel === 'MEDIUM'
        ? 'Stay alert. Crowd levels elevated.'
        : 'No immediate danger. Safe conditions.';

  const dynamicMetrics = [
    {
      icon: UserGroupIcon,
      labelKey: 'dashboard.crowdLevel',
      value: wariStatus.crowdStatus,
      helper: activeDemo === 'crowd-simulation'
        ? `Demo · Simulated · ${simulation.currentCrowdCount.toLocaleString('en-IN')} pilgrims`
        : 'Comfortable flow in your zone',
      trend: { label: activeDemo === 'crowd-simulation' ? simulation.zoneStatus : 'Stable', direction: riskScore >= 65 ? 'up' : 'up' },
      tone: safetyTone,
    },
    { icon: UserIcon, labelKey: 'dashboard.todaysWarkaris', value: (crowdSummary?.activePilgrims || 184260).toLocaleString('en-IN'), helper: 'Across the active corridor', trend: { label: '+8.2%', direction: 'up' }, tone: 'orange' },
    { icon: CloudIcon, labelKey: 'dashboard.weather', value: `${temp}°C`, helper: weather?.condition || (temp >= 40 ? 'Heat advisory · stay hydrated' : temp >= 36 ? 'Warm conditions expected' : 'Light rain expected after 15:00'), trend: { label: temp >= 40 ? 'Heat warning' : weather?.condition || 'UV moderate', direction: 'up' }, tone: temp >= 40 ? 'red' : temp >= 36 ? 'orange' : 'blue' },
    {
      icon: ExclamationTriangleIcon,
      labelKey: 'dashboard.activeAlerts',
      value: String((alerts?.length || 0) + (simulation.activeAlerts?.length || 0) || '03'),
      helper: (alerts?.length || simulation.activeAlerts?.length) > 0
        ? `${alerts?.length || simulation.activeAlerts?.length} need${(alerts?.length || simulation.activeAlerts?.length) === 1 ? 's' : ''} attention near you`
        : '1 needs attention near you',
      trend: { label: 'Review now', direction: 'alert' },
      tone: 'red',
    },
  ];

  const aiRiskScore = Math.min(99, Math.max(8, activeDemo === 'crowd-simulation' ? riskScore : aiPressure?.riskScore ?? riskScore ?? 62));
  const aiRiskBadgeTone = aiRiskScore >= 85 ? 'red' : aiRiskScore >= 65 ? 'orange' : 'green';
  const aiRiskBadgeLabel = aiRiskScore >= 85 ? 'Severe zone' : aiRiskScore >= 65 ? 'Watch zone' : 'Normal';
  const aiPredictionTime = aiPressure?.predictionTime || '10:40–11:20';
  const aiDescription = activeDemo === 'crowd-simulation'
    ? riskLevel === 'CRITICAL'
      ? 'Demo: Severe crowd pressure at Loni Market. Use the canal-side diversion now.'
      : riskLevel === 'HIGH'
        ? 'Demo: High crowd pressure building. Canal-side route is safer.'
        : 'Demo: Monitored crossing. Follow volunteer guidance.'
    : aiPressure?.description || 'Procession crossing may slow the east lane. Your route avoids this corridor.';
  const aiConfidence = aiPressure?.confidence ?? Math.min(98, 80 + Math.round(aiRiskScore / 10));

  const rec = aiRouteRec || routeRecommendation;
  const mainRoute = routes?.find((r) => r.id === 'route-main');
  const altRoute = routes?.find((r) => r.id === 'route-canal');
  const routeARisk = rec?.recommended?.id === 'route-main' ? rec?.recommended?.computedRisk : mainRoute?.risk || 'LOW';
  const routeBRisk = rec?.recommended?.id === 'route-canal' ? rec?.recommended?.computedRisk : altRoute?.risk || 'LOW';
  const recommendedId = rec?.recommended?.id || rec?.recommendedRouteId || (routeARisk === 'HIGH' || routeARisk === 'CRITICAL' ? 'route-canal' : 'route-main');

  const riskColor = (r) =>
    r === 'CRITICAL' ? 'text-red-700 bg-red-50'
      : r === 'HIGH' ? 'text-orange-700 bg-orange-50'
        : r === 'MEDIUM' ? 'text-amber-700 bg-amber-50'
          : 'text-emerald-700 bg-emerald-50';

  const handleCrowdWatchClick = () => {
    if (activeDemo !== 'crowd-simulation') {
      toggleCrowdSimulation();
      toast.success('Demo live simulation started. Crowd, map and route data will now update.');
    } else {
      toggleCrowdSimulation();
      toast('Demo simulation stopped. Dashboard data restored to baseline.');
    }
  };

  const handleSOS = () => {
    setSosDescription('');
    setSosModalOpen(true);
  };

  const submitSOS = async () => {
    setSosSubmitting(true);
    try {
      createEmergency({
        pilgrimName: profile?.full_name || 'Pilgrim',
        description: sosDescription || 'Pilgrim pressed SOS button — immediate assistance requested.',
        latitude: pilgrimLocation?.latitude ?? 18.647,
        longitude: pilgrimLocation?.longitude ?? 74.084,
        zoneId: pilgrimLocation?.zoneId || crowdSummary?.highestRiskZone?.id || 'zone-21',
        zoneName: pilgrimLocation?.zoneName || crowdSummary?.highestRiskZone?.zoneName || 'Loni Market',
      });
      toast.success('SOS transmitted. Controllers are notified and dispatching help.', { icon: '🚨', duration: 5000 });
      setSosModalOpen(false);
    } finally {
      setSosSubmitting(false);
    }
  };

  const mergedAlerts = [
    ...zoneAlerts.map((a) => ({
      id: a.id,
      title: a.title,
      text: a.message,
      severity: a.severity,
      zone: a.zone_name,
      time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tone: a.severity === 'CRITICAL' ? 'bg-red-500' : a.severity === 'HIGH' ? 'bg-orange-500' : a.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-saffron',
    })),
    ...(simulation.activeAlerts || []).map((a, idx) => ({
      id: `sim-${idx}-${a.id}`,
      title: a.title || a.zone || 'Demo Alert',
      text: a.message || 'Simulated alert',
      severity: 'MEDIUM',
      time: 'Now',
      tone: 'bg-amber-500',
    })),
    ...notifications.filter((n) => n.type === 'sos' || n.type === 'task-assign').slice(0, 2).map((n) => ({
      ...n,
      severity: 'HIGH',
      tone: n.type === 'sos' ? 'bg-red-500' : 'bg-saffron',
    })),
  ].slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow={t('dashboard.eyebrow', { name: profile?.full_name || 'Pilgrim' })}
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        actions={
          <>
            <Link to="/navigation">
              <Button variant="outline" icon={MapPinIcon}>{t('dashboard.viewRoute')}</Button>
            </Link>
            <Button variant="danger" icon={ExclamationTriangleIcon} onClick={handleSOS}>
              <PhoneIcon className="-ml-0.5 h-4 w-4" aria-hidden="true" />
              {t('dashboard.sosHelp')}
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {dynamicMetrics.map((metric, index) => (
          <MetricCard key={metric.labelKey} icon={metric.icon} label={t(metric.labelKey)} value={metric.value} helper={metric.helper} trend={metric.trend} tone={metric.tone} index={index} />
        ))}
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.35fr_.65fr]">
        <div className="surface overflow-hidden p-4 sm:p-5">
          <SectionTitle
            title={t('dashboard.yourRoute')}
            detail={activeDemo === 'crowd-simulation' ? 'Alandi to Saswad · Demo simulated guidance' : 'Alandi to Saswad · live guidance'}
            action={<Badge tone={recommendedId === 'route-main' ? 'green' : 'blue'} dot>{t('common.safe')}</Badge>}
          />
          <div className="relative h-[340px] overflow-hidden rounded-2xl">
            <RouteMap mode="pilgrim" />
            <div className="absolute right-4 top-4 z-[401] rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Route</p>
              <p className="mt-1 text-lg font-bold text-ink">{mainRoute?.totalDistanceKm || 8.4} km <span className="text-sm text-slate-400">· {mainRoute?.estimatedDuration || '2h 18m'}</span></p>
              {activeDemo === 'crowd-simulation' && (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-amber-600">Demo · Simulated Live</p>
              )}
            </div>
            {(activeDemo === 'crowd-simulation' || (alerts && alerts.length > 0)) && (
              <div className="absolute left-4 top-4 z-[401] rounded-2xl bg-ink/85 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-amber-300/80 shadow-lg backdrop-blur">
                Demo · Simulated Live Data
              </div>
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className={cn('rounded-2xl p-3', riskColor(routeARisk))}>
              <p className="label !opacity-70">Route risk</p>
              <p className="mt-1 text-lg font-bold">{routeARisk}</p>
            </div>
            <div className="rounded-2xl bg-saffron-50 p-3">
              <p className="label !text-orange-700/70">Next water</p>
              <p className="mt-1 text-lg font-bold text-saffron">{mainRoute?.nextWaterKm ? `${mainRoute.nextWaterKm} km` : '180 m'}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3">
              <p className="label !text-blue-700/70">Next halt</p>
              <p className="mt-1 text-lg font-bold text-blue-700">{mainRoute?.nextHaltName || 'Yawat'} · {mainRoute?.nextHaltEta || '13:15'}</p>
            </div>
          </div>
        </div>

        <motion.aside
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-white p-5 shadow-float">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow !text-red-700/70">Emergency</p>
                <h2 className="text-xl font-bold text-red-800">Need help right now?</h2>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/20">
                <PhoneIcon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-sm leading-5 text-red-700/80">
              Press SOS to share your live location with controllers instantly.
            </p>
            <Button variant="danger" className="mt-4 w-full !py-3 !text-base" onClick={handleSOS}>
              <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
              SOS · Call for Help
            </Button>
          </div>

          <div className="surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Safety status</p>
                <h2 className="mt-1 text-xl font-bold text-ink">{safetyLabel}</h2>
              </div>
              <Badge tone={safetyTone} dot className="uppercase tracking-wide">{safetyLabel}</Badge>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
              <ShieldCheckIcon className={cn('mt-0.5 h-5 w-5', safetyTone === 'red' ? 'text-red-500' : safetyTone === 'orange' ? 'text-orange-500' : safetyTone === 'amber' ? 'text-amber-500' : 'text-emerald-500')} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{safetySummary}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {pilgrimLocation?.zoneName ? `Your zone: ${pilgrimLocation.zoneName}` : 'Location pending'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
              <div className="rounded-xl bg-emerald-50 py-2 text-emerald-700">Crowd {wariStatus.crowdStatus}</div>
              <div className="rounded-xl bg-blue-50 py-2 text-blue-700">Health Good</div>
              <div className={cn('rounded-xl py-2', temp >= 40 ? 'bg-red-50 text-red-700' : temp >= 36 ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-700')}>
                Weather {temp}°C
              </div>
            </div>
            {pilgrimLocation?.zoneName && (
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                {zoneAlerts.length > 0
                  ? `${zoneAlerts.length} alert${zoneAlerts.length === 1 ? '' : 's'} active in your zone`
                  : 'No alerts in your zone'}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-ink p-5 text-white shadow-float">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow !text-emerald-200">{t('dashboard.aiPrediction')}</p>
                <h2 className="text-xl font-bold">{t('dashboard.pressureForecast')}</h2>
                {activeDemo === 'crowd-simulation' && (
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-300/80">Demo · Simulated Live Data</p>
                )}
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-saffron">
                <BoltIcon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-6 flex items-end gap-4">
              <p className="text-6xl font-bold tracking-tighter text-white">{aiRiskScore}</p>
              <div className="pb-1">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-100/60">{t('dashboard.riskScore')}</p>
                <Badge tone={aiRiskBadgeTone} className={cn('mt-2', aiRiskBadgeTone === 'red' ? '!bg-red-500/15 !text-red-200 !ring-red-300/15' : aiRiskBadgeTone === 'orange' ? '!bg-orange-400/15 !text-orange-200 !ring-orange-300/15' : '!bg-emerald-500/15 !text-emerald-200 !ring-emerald-300/15')}>{aiRiskBadgeLabel}</Badge>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-white/[.08] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Loni Market</p>
                <p className="text-xs font-bold text-orange-200">{aiPredictionTime}</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-emerald-50/65">{aiDescription}</p>
            </div>
            <Link to="/crowd" onClick={handleCrowdWatchClick} className="mt-5 block">
              <Button className="w-full" variant={activeDemo === 'crowd-simulation' ? 'outline' : 'primary'}>
                {activeDemo === 'crowd-simulation' ? `Stop Demo (Running)` : t('nav.crowd')}
              </Button>
            </Link>
          </div>
        </motion.aside>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <article className="surface p-5">
          <SectionTitle
            title="Route Recommendation"
            detail={rec?.reason || (recommendedId === 'route-canal' ? 'Crowd risk detected ahead' : 'Main route is clear')}
            action={
              <Badge tone="green" dot>
                {aiRouteRec ? `Updated ${new Date(aiRouteRec.recommendationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Smart Guidance'}
              </Badge>
            }
          />
          {(recommendedId === 'route-canal' || routeARisk === 'HIGH' || routeARisk === 'CRITICAL') && (
            <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
              ⚠ Crowd risk detected ~{(crowdSummary?.highestRiskZone?.zoneName ? 'near ' + crowdSummary.highestRiskZone.zoneName : '2.5 km ahead')}. Consider the alternate route.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={cn('rounded-2xl border p-4 transition', recommendedId === 'route-main' ? 'border-forest ring-2 ring-forest/20' : 'border-slate-200')}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Route A · Main Road</p>
                  <p className="mt-2 text-lg font-bold text-ink">{mainRoute?.totalDistanceKm || 4.2} km</p>
                </div>
                <div className={cn('rounded-xl px-2 py-1 text-[11px] font-bold uppercase tracking-wide', riskColor(routeARisk))}>
                  {routeARisk} CROWD
                </div>
              </div>
              <div className={cn('mt-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold', riskColor(routeARisk))}>
                {routeARisk === 'HIGH' || routeARisk === 'CRITICAL' ? 'HIGH RISK' : routeARisk === 'MEDIUM' ? 'MEDIUM RISK' : 'LOW RISK'}
              </div>
              {recommendedId === 'route-main' && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  ✓ Recommended Route A
                </div>
              )}
            </div>
            <div className={cn('rounded-2xl border p-4 transition', recommendedId === 'route-canal' ? 'border-forest ring-2 ring-forest/20' : 'border-slate-200')}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Route B · Canal Side</p>
                  <p className="mt-2 text-lg font-bold text-ink">{altRoute?.totalDistanceKm || 5.1} km</p>
                </div>
                <div className={cn('rounded-xl px-2 py-1 text-[11px] font-bold uppercase tracking-wide', riskColor(routeBRisk))}>
                  {routeBRisk} CROWD
                </div>
              </div>
              <div className={cn('mt-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold', riskColor(routeBRisk))}>
                {routeBRisk === 'HIGH' || routeBRisk === 'CRITICAL' ? 'HIGH RISK' : routeBRisk === 'MEDIUM' ? 'MEDIUM RISK' : 'LOW RISK'}
              </div>
              {recommendedId === 'route-canal' && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  ✓ Recommended Route B
                </div>
              )}
            </div>
          </div>
          <Link to="/navigation">
            <Button className="mt-5 w-full">
              <MapPinIcon className="h-4 w-4" />
              TAKE SAFER ROUTE
            </Button>
          </Link>
        </article>

        <article className="surface p-5">
          <SectionTitle
            title={t('dashboard.latestUpdates')}
            detail={pilgrimLocation?.zoneName ? `Alerts for ${pilgrimLocation.zoneName} and nearby` : 'Alerts for your current route'}
            action={<Link to="/alerts" className="text-xs font-bold text-saffron">{t('common.viewAll')}</Link>}
          />
          <div className="space-y-3">
            {mergedAlerts.length === 0 ? (
              <div className="rounded-2xl bg-emerald-50 p-5 text-center text-sm text-emerald-800">
                All clear. No active alerts for your route.
              </div>
            ) : (
              mergedAlerts.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className={cn('mt-0.5 h-2 w-2 shrink-0 rounded-full', item.tone || 'bg-saffron')} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-4">
                      <p className="text-sm font-bold text-ink">{item.title}</p>
                      <time className="shrink-0 text-[11px] text-slate-400">{item.time}</time>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
                    {item.zone && (
                      <p className="mt-1 text-[11px] font-semibold text-slate-400">{item.zone}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <article className="surface p-5">
          <SectionTitle title={t('dashboard.quickActions')} detail="Small actions that keep your group safe" />
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => toast.success('Your group location is shared for the next 4 hours.')}
              className="rounded-2xl border border-slate-100 p-4 text-left transition hover:border-forest hover:bg-emerald-50"
            >
              <UserGroupIcon className="h-5 w-5 text-forest" aria-hidden="true" />
              <p className="mt-4 text-sm font-bold">{t('dashboard.shareLocation')}</p>
              <p className="mt-1 text-xs text-slate-500">Keep family together</p>
            </button>
            <Link
              to="/resources"
              className="rounded-2xl border border-slate-100 p-4 transition hover:border-saffron hover:bg-saffron-50"
            >
              <ExclamationTriangleIcon className="h-5 w-5 text-saffron" aria-hidden="true" />
              <p className="mt-4 text-sm font-bold">{t('dashboard.findEssentials')}</p>
              <p className="mt-1 text-xs text-slate-500">Water, food, medical</p>
            </Link>
          </div>
        </article>

        <article className="surface p-5">
          <SectionTitle title={t('dashboard.nextHalt')} detail="Yawat community ground" action={<Badge tone="blue">13:15</Badge>} />
          <div className="flex flex-wrap gap-4 sm:flex-nowrap">
            <div className="flex-1 rounded-2xl bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-ink">4.6 km ahead</p>
                  <p className="mt-1 text-xs text-slate-500">About 1 hr 12 min walking</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Meals, medical and rest available
              </div>
            </div>
            <div className="flex-1">
              <div className="h-full">
                <ol className="relative ml-2 space-y-3 border-l border-dashed border-slate-200 pl-5">
                  {DEFAULT_STOPS.slice(1, 4).map((stop) => (
                    <li key={stop.name} className="relative">
                      <span className={cn('absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white', stop.status === 'current' ? 'bg-forest' : stop.status === 'next' ? 'bg-saffron' : 'bg-slate-300')} />
                      <p className="text-sm font-bold text-ink">{stop.name}</p>
                      <p className="text-[11px] text-slate-500">{stop.time} · {stop.status === 'current' ? 'You are here' : stop.status === 'next' ? 'Next rest point' : 'Halt ahead'}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* SOS Confirmation Modal */}
      <Modal
        open={sosModalOpen}
        onClose={() => { setSosModalOpen(false); setSosDescription(''); }}
        title="Confirm SOS"
        description="This will immediately notify controllers and emergency responders with your live location."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setSosModalOpen(false); setSosDescription(''); }}>Cancel</Button>
            <Button variant="danger" icon={PhoneIcon} onClick={submitSOS} disabled={sosSubmitting}>
              {sosSubmitting ? 'Transmitting...' : 'Send SOS Now'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-bold text-red-800">Emergency SOS</p>
                <p className="mt-1 text-xs text-red-700">
                  Your name, live GPS location, and zone will be shared with controllers.
                  Help will be dispatched to your location.
                </p>
              </div>
            </div>
          </div>
          {pilgrimLocation?.latitude && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <MapPinIcon className="h-4 w-4 text-slate-400" />
              <span>Location: {pilgrimLocation.latitude.toFixed(4)}, {pilgrimLocation.longitude.toFixed(4)}</span>
              {pilgrimLocation.zoneName && <span className="ml-auto font-semibold text-ink">{pilgrimLocation.zoneName}</span>}
            </div>
          )}
          <div>
            <label className="label">What's happening? (optional)</label>
            <textarea
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-ink focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
              placeholder="e.g. I fell and can't walk. I'm near the canal junction."
              value={sosDescription}
              onChange={(e) => setSosDescription(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Controllers will see your request in real time. You can also call 108 (Ambulance) or 112 (Police) directly.
          </p>
        </div>
      </Modal>
    </>
  );
}
