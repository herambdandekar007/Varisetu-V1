import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BoltIcon, CloudIcon, ExclamationTriangleIcon, MapPinIcon, ShieldCheckIcon, UserGroupIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
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
  { nameKey: 'alandiStart', time: '08:00', status: 'passed' },
  { nameKey: 'loniKalbhor', time: '09:30', status: 'passed' },
  { nameKey: 'canalJunction', time: '10:45', status: 'current' },
  { nameKey: 'yawatHalt', time: '13:15', status: 'next' },
  { nameKey: 'saswadCamp', time: '15:30', status: 'future' },
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

  const riskText = (level) => t(`dashboard.riskLevels.${String(level).toLowerCase()}`, { defaultValue: level });
  const crowdStatusText = (status) => t(`dashboard.crowdStatuses.${String(status).toLowerCase()}`, { defaultValue: status });
  const weatherConditionText = (condition) => {
    if (!condition) return condition;
    const key = String(condition).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return t(`dashboard.weatherConditions.${key}`, { defaultValue: condition });
  };

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

  const safetyLabel = t(`dashboard.safety.${String(riskLevel).toLowerCase()}.label`);
  const safetySummary = t(`dashboard.safety.${String(riskLevel).toLowerCase()}.summary`);

  const dynamicMetrics = [
    {
      icon: UserGroupIcon,
      labelKey: 'dashboard.crowdLevel',
      value: crowdStatusText(wariStatus.crowdStatus),
      helper: activeDemo === 'crowd-simulation'
        ? t('dashboard.demoSimulatedPilgrims', { count: simulation.currentCrowdCount.toLocaleString('en-IN') })
        : t('dashboard.comfortableFlow'),
      trend: { label: activeDemo === 'crowd-simulation' ? crowdStatusText(simulation.zoneStatus) : t('dashboard.stable'), direction: 'up' },
      tone: safetyTone,
    },
    { icon: UserIcon, labelKey: 'dashboard.todaysWarkaris', value: (crowdSummary?.activePilgrims || 184260).toLocaleString('en-IN'), helper: t('dashboard.acrossActiveCorridor'), trend: { label: '+8.2%', direction: 'up' }, tone: 'orange' },
    { icon: CloudIcon, labelKey: 'dashboard.weather', value: `${temp}°C`, helper: weather?.condition ? weatherConditionText(weather.condition) : t(temp >= 40 ? 'dashboard.heatAdvisory' : temp >= 36 ? 'dashboard.warmConditions' : 'dashboard.lightRainExpected'), trend: { label: temp >= 40 ? t('dashboard.heatWarning') : weather?.condition ? weatherConditionText(weather.condition) : t('dashboard.uvModerate'), direction: 'up' }, tone: temp >= 40 ? 'red' : temp >= 36 ? 'orange' : 'blue' },
    {
      icon: ExclamationTriangleIcon,
      labelKey: 'dashboard.activeAlerts',
      value: String((alerts?.length || 0) + (simulation.activeAlerts?.length || 0) || '03'),
      helper: (alerts?.length || simulation.activeAlerts?.length) > 0
        ? t('dashboard.alertsNeedAttention', { count: alerts?.length || simulation.activeAlerts?.length })
        : t('dashboard.oneNeedsAttention'),
      trend: { label: t('dashboard.reviewNow'), direction: 'alert' },
      tone: 'red',
    },
  ];

  const aiRiskScore = Math.min(99, Math.max(8, activeDemo === 'crowd-simulation' ? riskScore : aiPressure?.riskScore ?? riskScore ?? 62));
  const aiRiskBadgeTone = aiRiskScore >= 85 ? 'red' : aiRiskScore >= 65 ? 'orange' : 'green';
  const aiRiskBadgeLabel = t(aiRiskScore >= 85 ? 'dashboard.severeZone' : aiRiskScore >= 65 ? 'dashboard.watchZone' : 'dashboard.normal');
  const aiPredictionTime = aiPressure?.predictionTime || '10:40–11:20';
  const aiDescription = activeDemo === 'crowd-simulation'
    ? riskLevel === 'CRITICAL'
      ? t('dashboard.demoCriticalPressure')
      : riskLevel === 'HIGH'
        ? t('dashboard.demoHighPressure')
        : t('dashboard.demoMonitoredCrossing')
    : aiPressure?.description || t('dashboard.processionCrossing');
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
      toast.success(t('dashboard.demoStarted'));
    } else {
      toggleCrowdSimulation();
      toast(t('dashboard.demoStopped'));
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
        pilgrimName: profile?.full_name || t('topbar.pilgrim'),
        description: sosDescription || t('dashboard.defaultSosDescription'),
        latitude: pilgrimLocation?.latitude ?? 18.647,
        longitude: pilgrimLocation?.longitude ?? 74.084,
        zoneId: pilgrimLocation?.zoneId || crowdSummary?.highestRiskZone?.id || 'zone-21',
        zoneName: pilgrimLocation?.zoneName || crowdSummary?.highestRiskZone?.zoneName || t('dashboard.loniMarket'),
      });
      toast.success(t('dashboard.sosTransmitted'), { icon: '🚨', duration: 5000 });
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
      title: a.title || a.zone || t('dashboard.demoAlert'),
      text: a.message || t('dashboard.simulatedAlert'),
      severity: 'MEDIUM',
      time: t('common.now'),
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
        eyebrow={t('dashboard.eyebrow', { name: profile?.full_name || t('topbar.pilgrim') })}
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
            detail={t(activeDemo === 'crowd-simulation' ? 'dashboard.routeDemoGuidance' : 'dashboard.routeLiveGuidance')}
            action={<Badge tone={recommendedId === 'route-main' ? 'green' : 'blue'} dot>{t('common.safe')}</Badge>}
          />
          <div className="relative h-[480px] overflow-hidden rounded-2xl">
            <RouteMap mode="pilgrim" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className={cn('rounded-2xl p-3', riskColor(routeARisk))}>
              <p className="label !opacity-70">{t('dashboard.routeRisk')}</p>
              <p className="mt-1 text-lg font-bold">{riskText(routeARisk)}</p>
            </div>
            <div className="rounded-2xl bg-saffron-50 p-3">
              <p className="label !text-orange-700/70">{t('dashboard.nextWater')}</p>
              <p className="mt-1 text-lg font-bold text-saffron">{mainRoute?.nextWaterKm ? t('dashboard.kilometers', { distance: mainRoute.nextWaterKm }) : t('dashboard.meters', { distance: 180 })}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3">
              <p className="label !text-blue-700/70">{t('dashboard.nextHalt')}</p>
              <p className="mt-1 text-lg font-bold text-blue-700">{mainRoute?.nextHaltName || t('dashboard.yawat')} · {mainRoute?.nextHaltEta || '13:15'}</p>
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
                <p className="eyebrow !text-red-700/70">{t('dashboard.emergency')}</p>
                <h2 className="text-xl font-bold text-red-800">{t('dashboard.needHelpNow')}</h2>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/20">
                <PhoneIcon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-sm leading-5 text-red-700/80">
              {t('dashboard.sosShareLocation')}
            </p>
            <Button variant="danger" className="mt-4 w-full !py-3 !text-base" onClick={handleSOS}>
              <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
              {t('dashboard.sosCallForHelp')}
            </Button>
          </div>

          <div className="surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">{t('dashboard.safetyStatus')}</p>
                <h2 className="mt-1 text-xl font-bold text-ink">{safetyLabel}</h2>
              </div>
              <Badge tone={safetyTone} dot className="uppercase tracking-wide">{safetyLabel}</Badge>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
              <ShieldCheckIcon className={cn('mt-0.5 h-5 w-5', safetyTone === 'red' ? 'text-red-500' : safetyTone === 'orange' ? 'text-orange-500' : safetyTone === 'amber' ? 'text-amber-500' : 'text-emerald-500')} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{safetySummary}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {pilgrimLocation?.zoneName ? t('dashboard.yourZone', { zone: pilgrimLocation.zoneName }) : t('dashboard.locationPending')}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
              <div className="rounded-xl bg-emerald-50 py-2 text-emerald-700">{t('dashboard.crowdStatus', { status: crowdStatusText(wariStatus.crowdStatus) })}</div>
              <div className="rounded-xl bg-blue-50 py-2 text-blue-700">{t('dashboard.healthGood')}</div>
              <div className={cn('rounded-xl py-2', temp >= 40 ? 'bg-red-50 text-red-700' : temp >= 36 ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-700')}>
                {t('dashboard.weatherTemperature', { temperature: temp })}
              </div>
            </div>
            {pilgrimLocation?.zoneName && (
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                {zoneAlerts.length > 0
                  ? t('dashboard.alertsInYourZone', { count: zoneAlerts.length })
                  : t('dashboard.noAlertsInYourZone')}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-ink p-5 text-white shadow-float">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow !text-emerald-200">{t('dashboard.aiPrediction')}</p>
                <h2 className="text-xl font-bold">{t('dashboard.pressureForecast')}</h2>
                {activeDemo === 'crowd-simulation' && (
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-300/80">{t('dashboard.demoLiveData')}</p>
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
                <p className="text-sm font-bold">{t('dashboard.loniMarket')}</p>
                <p className="text-xs font-bold text-orange-200">{aiPredictionTime}</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-emerald-50/65">{aiDescription}</p>
            </div>
            <Link to="/crowd" onClick={handleCrowdWatchClick} className="mt-5 block">
              <Button className="w-full" variant={activeDemo === 'crowd-simulation' ? 'outline' : 'primary'}>
                {activeDemo === 'crowd-simulation' ? t('dashboard.stopDemo') : t('nav.crowd')}
              </Button>
            </Link>
          </div>
        </motion.aside>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <article className="surface p-5">
          <SectionTitle
            title={t('dashboard.routeRecommendation')}
            detail={rec?.reason || t(recommendedId === 'route-canal' ? 'dashboard.crowdRiskAhead' : 'dashboard.mainRouteClear')}
            action={
              <Badge tone="green" dot>
                {aiRouteRec ? t('dashboard.updatedAt', { time: new Date(aiRouteRec.recommendationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }) : t('dashboard.smartGuidance')}
              </Badge>
            }
          />
          {(recommendedId === 'route-canal' || routeARisk === 'HIGH' || routeARisk === 'CRITICAL') && (
            <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
              ⚠ {crowdSummary?.highestRiskZone?.zoneName
                ? t('dashboard.crowdRiskNearZone', { zone: crowdSummary.highestRiskZone.zoneName })
                : t('dashboard.crowdRiskDistance')}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={cn('rounded-2xl border p-4 transition', recommendedId === 'route-main' ? 'border-forest ring-2 ring-forest/20' : 'border-slate-200')}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">{t('dashboard.routeAMainRoad')}</p>
                  <p className="mt-2 text-lg font-bold text-ink">{mainRoute?.totalDistanceKm || 4.2} km</p>
                </div>
                <div className={cn('rounded-xl px-2 py-1 text-[11px] font-bold uppercase tracking-wide', riskColor(routeARisk))}>
                  {t('dashboard.riskCrowd', { risk: riskText(routeARisk) })}
                </div>
              </div>
              <div className={cn('mt-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold', riskColor(routeARisk))}>
                {t('dashboard.riskLevelLabel', { risk: riskText(routeARisk) })}
              </div>
              {recommendedId === 'route-main' && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  ✓ {t('dashboard.recommendedRoute', { route: 'A' })}
                </div>
              )}
            </div>
            <div className={cn('rounded-2xl border p-4 transition', recommendedId === 'route-canal' ? 'border-forest ring-2 ring-forest/20' : 'border-slate-200')}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">{t('dashboard.routeBCanalSide')}</p>
                  <p className="mt-2 text-lg font-bold text-ink">{altRoute?.totalDistanceKm || 5.1} km</p>
                </div>
                <div className={cn('rounded-xl px-2 py-1 text-[11px] font-bold uppercase tracking-wide', riskColor(routeBRisk))}>
                  {t('dashboard.riskCrowd', { risk: riskText(routeBRisk) })}
                </div>
              </div>
              <div className={cn('mt-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold', riskColor(routeBRisk))}>
                {t('dashboard.riskLevelLabel', { risk: riskText(routeBRisk) })}
              </div>
              {recommendedId === 'route-canal' && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  ✓ {t('dashboard.recommendedRoute', { route: 'B' })}
                </div>
              )}
            </div>
          </div>
          <Link to="/navigation">
            <Button className="mt-5 w-full">
              <MapPinIcon className="h-4 w-4" />
              {t('dashboard.takeSaferRoute')}
            </Button>
          </Link>
        </article>

        <article className="surface p-5">
          <SectionTitle
            title={t('dashboard.latestUpdates')}
            detail={pilgrimLocation?.zoneName ? t('dashboard.alertsForZone', { zone: pilgrimLocation.zoneName }) : t('dashboard.alertsForCurrentRoute')}
            action={<Link to="/alerts" className="text-xs font-bold text-saffron">{t('common.viewAll')}</Link>}
          />
          <div className="space-y-3">
            {mergedAlerts.length === 0 ? (
              <div className="rounded-2xl bg-emerald-50 p-5 text-center text-sm text-emerald-800">
                {t('dashboard.allClear')}
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
          <SectionTitle title={t('dashboard.quickActions')} detail={t('dashboard.quickActionsDetail')} />
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => toast.success(t('dashboard.groupLocationShared'))}
              className="rounded-2xl border border-slate-100 p-4 text-left transition hover:border-forest hover:bg-emerald-50"
            >
              <UserGroupIcon className="h-5 w-5 text-forest" aria-hidden="true" />
              <p className="mt-4 text-sm font-bold">{t('dashboard.shareLocation')}</p>
              <p className="mt-1 text-xs text-slate-500">{t('dashboard.keepFamilyTogether')}</p>
            </button>
            <Link
              to="/resources"
              className="rounded-2xl border border-slate-100 p-4 transition hover:border-saffron hover:bg-saffron-50"
            >
              <ExclamationTriangleIcon className="h-5 w-5 text-saffron" aria-hidden="true" />
              <p className="mt-4 text-sm font-bold">{t('dashboard.findEssentials')}</p>
              <p className="mt-1 text-xs text-slate-500">{t('dashboard.essentialServices')}</p>
            </Link>
          </div>
        </article>

        <article className="surface p-5">
          <SectionTitle title={t('dashboard.nextHalt')} detail={t('dashboard.yawatCommunityGround')} action={<Badge tone="blue">13:15</Badge>} />
          <div className="flex flex-wrap gap-4 sm:flex-nowrap">
            <div className="flex-1 rounded-2xl bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-ink">{t('dashboard.distanceAhead', { distance: '4.6' })}</p>
                  <p className="mt-1 text-xs text-slate-500">{t('dashboard.walkingTime')}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                {t('dashboard.haltServicesAvailable')}
              </div>
            </div>
            <div className="flex-1">
              <div className="h-full">
                <ol className="relative ml-2 space-y-3 border-l border-dashed border-slate-200 pl-5">
                  {DEFAULT_STOPS.slice(1, 4).map((stop) => (
                    <li key={stop.nameKey} className="relative">
                      <span className={cn('absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white', stop.status === 'current' ? 'bg-forest' : stop.status === 'next' ? 'bg-saffron' : 'bg-slate-300')} />
                      <p className="text-sm font-bold text-ink">{t(`dashboard.stops.${stop.nameKey}`)}</p>
                      <p className="text-[11px] text-slate-500">{stop.time} · {t(`dashboard.stopStatus.${stop.status}`)}</p>
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
        title={t('dashboard.confirmSos')}
        description={t('dashboard.confirmSosDescription')}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setSosModalOpen(false); setSosDescription(''); }}>{t('dashboard.cancel')}</Button>
            <Button variant="danger" icon={PhoneIcon} onClick={submitSOS} disabled={sosSubmitting}>
              {sosSubmitting ? t('dashboard.transmitting') : t('dashboard.sendSosNow')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-bold text-red-800">{t('dashboard.emergencySos')}</p>
                <p className="mt-1 text-xs text-red-700">
                  {t('dashboard.sosDataShared')}
                </p>
              </div>
            </div>
          </div>
          {pilgrimLocation?.latitude && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <MapPinIcon className="h-4 w-4 text-slate-400" />
              <span>{t('dashboard.locationCoordinates', { latitude: pilgrimLocation.latitude.toFixed(4), longitude: pilgrimLocation.longitude.toFixed(4) })}</span>
              {pilgrimLocation.zoneName && <span className="ml-auto font-semibold text-ink">{pilgrimLocation.zoneName}</span>}
            </div>
          )}
          <div>
            <label className="label">{t('dashboard.whatsHappening')}</label>
            <textarea
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-ink focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
              placeholder={t('dashboard.sosPlaceholder')}
              value={sosDescription}
              onChange={(e) => setSosDescription(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {t('dashboard.sosContactNote')}
          </p>
        </div>
      </Modal>
    </>
  );
}
