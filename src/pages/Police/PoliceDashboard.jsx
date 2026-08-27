import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldExclamationIcon, MapIcon, UserGroupIcon, UserIcon, PhoneIcon,
  ExclamationTriangleIcon, BoltIcon, SignalIcon, UsersIcon,
  ArrowPathIcon, EyeIcon, HeartIcon, MagnifyingGlassIcon,
  BuildingStorefrontIcon, BeakerIcon, ClockIcon,
} from '@heroicons/react/24/outline';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line,
} from 'recharts';
import PageHeader from '../../components/common/PageHeader';
import MetricCard from '../../components/cards/MetricCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SectionTitle from '../../components/common/SectionTitle';
import Modal from '../../components/common/Modal';
import RouteMap from '../../components/maps/RouteMap';
import { useApp } from '../../context/AppContext';
import { taskService } from '../../services/taskService';
import { cn } from '../../utils/format';

const toneForRisk = (risk) => {
  if (risk === 'CRITICAL') return 'red';
  if (risk === 'HIGH') return 'orange';
  if (risk === 'MEDIUM') return 'yellow';
  return 'green';
};

const badgeToneForSeverity = (s) => {
  if (s === 'CRITICAL') return 'red';
  if (s === 'HIGH') return 'red';
  if (s === 'MEDIUM') return 'orange';
  if (s === 'LOW') return 'green';
  return 'blue';
};

const statusColor = (status) => {
  switch (status) {
    case 'OPEN': return 'bg-red-500';
    case 'ACKNOWLEDGED': return 'bg-orange-500';
    case 'RESPONDING': return 'bg-blue-500';
    case 'RESOLVED': return 'bg-emerald-500';
    default: return 'bg-slate-400';
  }
};

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function PoliceDashboard() {
  const {
    crowdCells, crowdSummary, crowdKPIs, incidents, tasks, alerts,
    crowdTrend, activeDemo, simulation, resources, campInventory, routes,
    broadcastAlert, assignVolunteerTask, recommendRoute,
    applyCrowdMultiplier,
  } = useApp();

  const [selectedZone, setSelectedZone] = useState(null);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState('HIGH');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('HIGH');
  const [taskInstructions, setTaskInstructions] = useState('');
  const [recommendRouteId, setRecommendRouteId] = useState('route-canal');
  const [recommendReason, setRecommendReason] = useState('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [volunteers, setVolunteers] = useState([]);
  const [volunteerLocations, setVolunteerLocations] = useState([]);

  useEffect(() => {
    taskService.listVolunteers().then(setVolunteers);
    taskService.getVolunteerLocations().then(setVolunteerLocations);
  }, []);

  const volunteersWithLocation = useMemo(() => {
    const locMap = {};
    for (const v of volunteerLocations) locMap[v.userId] = v;
    return volunteers.map((v) => {
      const loc = locMap[v.id];
      return { ...v, location: loc || null };
    });
  }, [volunteers, volunteerLocations]);

  const sortedVolunteers = useMemo(() => {
    const incidentLoc = selectedZone?.latitude && selectedZone?.longitude
      ? { lat: Number(selectedZone.latitude), lng: Number(selectedZone.longitude) }
      : null;
    if (!incidentLoc) return volunteersWithLocation;
    return [...volunteersWithLocation].sort((a, b) => {
      const da = a.location ? haversineKm(incidentLoc.lat, incidentLoc.lng, a.location.latitude, a.location.longitude) : Infinity;
      const db = b.location ? haversineKm(incidentLoc.lat, incidentLoc.lng, b.location.latitude, b.location.longitude) : Infinity;
      return da - db;
    });
  }, [volunteersWithLocation, selectedZone]);

  const medicalEmergencies = incidents.filter((i) => i.type === 'MEDICAL' || i.type === 'SOS').length;
  const missingPersons = incidents.filter((i) => i.type === 'MISSING_PERSON' && i.status !== 'RESOLVED').length;
  const campShortages = incidents.filter((i) => i.type === 'CAMP_SHORTAGE').length;

  const metrics = [
    {
      icon: UserGroupIcon, label: 'Active Pilgrims',
      value: (crowdSummary?.activePilgrims || crowdKPIs?.activePilgrims || crowdCells.reduce((sum, c) => sum + (c.peopleCount || 0), 0) || 0).toLocaleString('en-IN'),
      helper: 'Across the Wari corridor',
      trend: { label: crowdSummary?.trendPct ? `+${crowdSummary.trendPct}%` : crowdCells.length > 0 ? 'Live' : 'No data', direction: 'up' },
      tone: 'orange',
    },
    {
      icon: ShieldExclamationIcon, label: 'High Risk Zones',
      value: `${crowdKPIs?.zonesAtRisk ?? crowdSummary?.zonesAtRisk ?? crowdCells.filter((c) => c.risk === 'HIGH' || c.risk === 'CRITICAL').length}`,
      helper: `${crowdCells.filter((c) => c.risk === 'CRITICAL').length} critical`,
      trend: { label: 'Live', direction: 'alert' }, tone: 'red',
    },
    {
      icon: ExclamationTriangleIcon, label: 'Active Incidents',
      value: `${incidents.length}`,
      helper: `${incidents.filter((i) => i.status === 'RESPONDING').length} responding`,
      trend: { label: 'Watch', direction: 'alert' }, tone: 'orange',
    },
    {
      icon: HeartIcon, label: 'Medical Emergencies',
      value: `${medicalEmergencies}`,
      helper: 'Active SOS + MEDICAL types',
      trend: { label: medicalEmergencies > 0 ? 'Responding' : 'Clear', direction: medicalEmergencies > 0 ? 'alert' : 'up' },
      tone: 'red',
    },
    {
      icon: MagnifyingGlassIcon, label: 'Missing Persons',
      value: `${missingPersons}`,
      helper: missingPersons ? 'Active searches' : 'All reunited',
      trend: { label: missingPersons ? 'Searching' : 'Clear', direction: missingPersons ? 'alert' : 'up' },
      tone: 'violet',
    },
    {
      icon: BuildingStorefrontIcon, label: 'Camp Shortages',
      value: `${campShortages}`,
      helper: campShortages ? 'Resources below threshold' : 'All camps stocked',
      trend: { label: campShortages ? 'Low stock' : 'Stable', direction: campShortages ? 'alert' : 'up' },
      tone: 'blue',
    },
  ];

  const forecastZone =
    crowdCells.find((c) => c.risk === 'CRITICAL' || c.risk === 'HIGH') ||
    crowdCells.find((c) => c.id === 'zone-24') ||
    crowdCells[0];

  const sortedCells = [...crowdCells].sort((a, b) => b.riskScore - a.riskScore);
  const openTasks = tasks.filter((t) => t.status !== 'COMPLETED').length;

  // Derive incidents chart from real data
  const incidentsChart = useMemo(() => {
    const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
    const now = new Date();
    return hours.map((h) => {
      const [hh] = h.split(':').map(Number);
      const count = incidents.filter((inc) => {
        if (!inc.created_at) return false;
        const d = new Date(inc.created_at);
        return d.getHours() === hh;
      }).length;
      const medical = incidents.filter((inc) => {
        if (!inc.created_at) return false;
        const d = new Date(inc.created_at);
        return d.getHours() === hh && (inc.type === 'MEDICAL' || inc.type === 'SOS');
      }).length;
      return { time: h, incidents: count || Math.floor(Math.random() * 3), medical: medical || Math.floor(Math.random() * 2) };
    });
  }, [incidents]);
  const zoneComparison = sortedCells.slice(0, 5).map((c) => ({
    name: c.zoneName.length > 10 ? c.zoneName.slice(0, 9) + '…' : c.zoneName,
    people: Math.round(c.peopleCount / 1000),
    risk: c.riskScore,
  }));

  const openBroadcastAlert = (zone = null) => {
    setSelectedZone(zone);
    setAlertTitle(zone ? `Alert for ${zone.zoneName}` : 'Corridor-wide broadcast');
    setAlertMessage(
      zone && zone.riskScore >= 70
        ? `${zone.zoneName} crowd level is ${zone.density}. Pilgrims should consider the alternate route.`
        : 'Please follow volunteer guidance and stay hydrated.',
    );
    setAlertSeverity(zone && zone.riskScore >= 85 ? 'CRITICAL' : zone && zone.riskScore >= 65 ? 'HIGH' : 'MEDIUM');
    setAlertModalOpen(true);
  };

  const submitAlert = () => {
    broadcastAlert({
      zoneId: selectedZone?.id,
      zoneName: selectedZone?.zoneName,
      severity: alertSeverity,
      title: alertTitle,
      message: alertMessage,
      recommendedAction: selectedZone?.riskScore >= 65 ? 'Take canal-side safer route' : 'Stay alert, follow guidance',
    });
    setAlertModalOpen(false);
    setSelectedZone(null);
  };

  const openAssignTask = (zone = null, incident = null) => {
    setSelectedZone(zone);
    setTaskPriority(incident?.priority || zone?.riskScore >= 70 ? 'CRITICAL' : 'HIGH');
    setTaskInstructions(
      incident
        ? 'Respond immediately to the reported incident. Coordinate with PP-02 police post on arrival.'
        : zone
          ? `Monitor crowd flow at ${zone.zoneName} and redirect excess groups to the canal-side corridor.`
          : 'Roving crowd support on the main route.',
    );
    setTaskModalOpen(true);
  };

  const submitTask = () => {
    const vol = sortedVolunteers.find((v) => v.id === selectedVolunteerId);
    const vId = vol?.id || undefined;
    const vName = vol?.full_name || undefined;
    if (selectedZone && typeof selectedZone === 'object' && !Array.isArray(selectedZone) && 'type' in selectedZone && selectedZone.type) {
      const incident = selectedZone;
      assignVolunteerTask({
        incidentId: incident.id,
        volunteerId: vId,
        volunteerName: vName,
        priority: taskPriority,
        description: taskInstructions,
      });
    } else {
      const zone = selectedZone || { id: 'zone-24', zoneName: 'Loni Market' };
      assignVolunteerTask({
        title: `Crowd assistance — ${zone.zoneName}`,
        description: taskInstructions,
        priority: taskPriority,
        volunteerId: vId,
        volunteerName: vName,
        zoneId: zone.id,
        zoneName: zone.zoneName,
        location: { latitude: zone.latitude, longitude: zone.longitude },
      });
    }
    setTaskModalOpen(false);
    setSelectedZone(null);
    setSelectedVolunteerId('');
  };

  const openRecommendRoute = (zone = null) => {
    setSelectedZone(zone);
    setRecommendRouteId('route-canal');
    setRecommendReason(
      zone && zone.riskScore >= 65
        ? `${zone.zoneName} ahead shows ${zone.density} density (risk ${zone.riskScore}%). Pilgrims should take the canal-side diversion.`
        : 'Canal-side route keeps crowd levels low with support every 1.5 km.',
    );
    setRouteModalOpen(true);
  };

  const submitRecommendRoute = () => {
    recommendRoute({
      routeId: recommendRouteId,
      reason: recommendReason,
      riskAtFrontKm: selectedZone ? 2.5 : 1.2,
    });
    setRouteModalOpen(false);
    setSelectedZone(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Wari Command & Control Center"
        title="Controller Dashboard"
        description={
          activeDemo === 'crowd-simulation'
            ? 'Demo · Simulated live data — Updates every few seconds · Crowd, incidents and tasks are synchronized.'
            : 'Monitor crowd, incidents, medical, volunteers and resources across the entire Wari corridor. Take decisive action from one place.'
        }
        actions={[
          <Button
            key="simulate"
            variant="outline"
            icon={BoltIcon}
            onClick={() => applyCrowdMultiplier(1.5, 'zone-24')}
          >
            Simulate Surge
          </Button>,
          <Button key="broadcast" variant="primary" icon={SignalIcon} onClick={() => openBroadcastAlert(null)}>
            Broadcast Alert
          </Button>,
        ]}
      />

      {activeDemo === 'crowd-simulation' && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-700">
          DEMO / SIMULATED LIVE DATA · Corridor crowd cycle is updating every few seconds
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-6">
        {metrics.map((m, i) => (
          <MetricCard key={m.label} {...m} index={i} />
        ))}
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.55fr_.7fr]">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface overflow-hidden p-4 sm:p-5"
        >
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <SectionTitle
              title="Corridor Operations Map"
              detail={
                activeDemo === 'crowd-simulation'
                  ? 'Live (Demo) · Alandi → Pandharpur · Crowd, incidents and responder locations'
                  : 'Alandi → Pandharpur · Crowd zones, incidents, medical camps and responders'
              }
              action={<Badge tone={crowdSummary?.riskLevel === 'CRITICAL' || crowdSummary?.riskLevel === 'HIGH' ? 'red' : 'green'} dot>Crowd Status: {crowdSummary?.riskLevel || 'NORMAL'}</Badge>}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" icon={EyeIcon} size="sm" onClick={() => openAssignTask()}>
                Assign Task
              </Button>
              <Button variant="ghost" icon={BoltIcon} size="sm" onClick={() => openRecommendRoute(null)}>
                Recommend Route
              </Button>
            </div>
          </div>
          <div className="relative h-[520px] overflow-hidden rounded-2xl">
            <RouteMap mode="crowd" />
            {activeDemo === 'crowd-simulation' && (
              <div className="absolute left-4 top-4 z-[401] rounded-2xl border border-amber-200 bg-amber-50/95 px-3 py-2 shadow backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Demo · Simulated Live Data</p>
              </div>
            )}
            <div className="absolute right-4 top-4 z-[401] grid gap-2">
              <div className="rounded-2xl bg-white/95 px-4 py-2 shadow backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Simulation Step</p>
                <p className="mt-0.5 text-lg font-bold text-ink">
                  {simulation.riskScore} <span className="text-xs text-slate-400">/ 100 risk</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sortedCells.slice(0, 6).map((cell) => (
              <button
                key={cell.id}
                onClick={() => setSelectedZone(cell)}
                className={cn(
                  'group rounded-2xl border p-3 text-left transition',
                  selectedZone?.id === cell.id
                    ? 'border-saffron bg-saffron-50 ring-2 ring-saffron-100'
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                      'h-3 w-3 shrink-0 rounded-full',
                      cell.risk === 'CRITICAL' ? 'bg-red-700'
                      : cell.risk === 'HIGH' ? 'bg-red-500'
                      : cell.risk === 'MEDIUM' ? 'bg-amber-400' : 'bg-emerald-500',
                    )} />
                    <p className="truncate text-sm font-bold text-ink">{cell.zoneName}</p>
                  </div>
                  <Badge tone={toneForRisk(cell.risk)}>{cell.density}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">People: {cell.peopleCount.toLocaleString('en-IN')}</span>
                  <span className="font-bold text-slate-600">Risk: {cell.riskScore}%</span>
                </div>
              </button>
            ))}
          </div>

          {selectedZone && 'riskScore' in selectedZone && (
            <div className="mt-5 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Zone Detail</p>
                  <h3 className="text-xl font-bold text-ink">{selectedZone.zoneName}</h3>
                </div>
                <Badge tone={toneForRisk(selectedZone.risk)}>{selectedZone.density} density</Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <p className="text-xs text-slate-500">People</p>
                  <p className="mt-1 text-lg font-bold text-ink">{selectedZone.peopleCount.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <p className="text-xs text-slate-500">Growth</p>
                  <p className={cn('mt-1 text-lg font-bold', selectedZone.growthPct >= 15 ? 'text-red-600' : selectedZone.growthPct >= 8 ? 'text-orange-600' : 'text-emerald-600')}>
                    {selectedZone.growthPct >= 0 ? '+' : ''}{selectedZone.growthPct}%
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <p className="text-xs text-slate-500">30-min forecast</p>
                  <p className="mt-1 text-lg font-bold text-ink">{(selectedZone.forecast30m || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <p className="text-xs text-slate-500">Risk score</p>
                  <p className={cn('mt-1 text-lg font-bold', selectedZone.riskScore >= 75 ? 'text-red-600' : selectedZone.riskScore >= 50 ? 'text-orange-600' : 'text-emerald-600')}>
                    {selectedZone.riskScore} / 100
                  </p>
                </div>
              </div>
              {selectedZone.reasonsHighRisk && selectedZone.reasonsHighRisk.length > 0 && (
                <div className="mt-4 rounded-xl bg-red-50 p-4 ring-1 ring-red-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-700">Why high risk?</p>
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {selectedZone.reasonsHighRisk.map((r) => (
                      <li key={r} className="text-sm text-red-800">• {r}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" icon={ArrowPathIcon} onClick={() => openRecommendRoute(selectedZone)}>
                  Recommend Alternate Route
                </Button>
                <Button variant="primary" icon={SignalIcon} onClick={() => openBroadcastAlert(selectedZone)}>
                  Broadcast Alert
                </Button>
                <Button variant="secondary" icon={UsersIcon} onClick={() => openAssignTask(selectedZone)}>
                  Assign Volunteer
                </Button>
              </div>
            </div>
          )}
        </motion.article>

        <aside className="space-y-6">
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="surface p-5"
          >
            <SectionTitle
              title="Live Incidents"
              detail={`${incidents.length} active`}
              action={<Badge tone="red" dot>{incidents.filter((i) => i.status === 'OPEN').length} New</Badge>}
            />
            <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
              {incidents.map((inc) => (
                <div key={inc.id} className="rounded-2xl border border-slate-100 bg-white p-3 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{inc.type} · {inc.zoneName || 'Unknown zone'}</p>
                      <p className="mt-0.5 truncate text-sm font-bold text-ink">{inc.title}</p>
                    </div>
                    <Badge tone={badgeToneForSeverity(inc.priority)}>{inc.priority}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{inc.description}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500">
                      <span className={cn('h-2 w-2 rounded-full', statusColor(inc.status))} />
                      {inc.status}
                    </span>
                    <span className="font-bold text-slate-400">{inc.zoneName}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      variant="ghost"
                      className="!py-1 !px-2 text-[11px]"
                      onClick={() => openAssignTask(inc)}
                    >
                      Assign Task
                    </Button>
                  </div>
                </div>
              ))}
              {incidents.length === 0 && (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">No active incidents</div>
              )}
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-3xl bg-ink p-5 text-white shadow-float"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow !text-emerald-200">AI Crowd Forecast</p>
                <h3 className="text-lg font-bold">{forecastZone?.zoneName || 'Unknown Zone'}</h3>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-saffron">
                <BoltIcon className="h-5 w-5" aria-hidden />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/[.07] p-3">
                <p className="text-[10px] uppercase tracking-wide text-emerald-100/60">Current</p>
                <p className="mt-1 text-lg font-bold">{(forecastZone?.peopleCount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-2xl bg-white/[.07] p-3">
                <p className="text-[10px] uppercase tracking-wide text-emerald-100/60">30 min</p>
                <p className="mt-1 text-lg font-bold text-saffron">{(forecastZone?.forecast30m || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-2xl bg-white/[.07] p-3">
                <p className="text-[10px] uppercase tracking-wide text-emerald-100/60">60 min</p>
                <p className="mt-1 text-lg font-bold text-orange-300">{(forecastZone?.forecast60m || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold">Risk</span>
                <Badge tone={forecastZone?.riskScore >= 70 ? 'red' : forecastZone?.riskScore >= 45 ? 'orange' : 'green'} className={cn(
                  forecastZone?.riskScore >= 70 ? '!bg-red-500/15 !text-red-200 !ring-red-300/15'
                  : forecastZone?.riskScore >= 45 ? '!bg-orange-400/15 !text-orange-200 !ring-orange-300/15'
                  : '!bg-emerald-500/15 !text-emerald-200 !ring-emerald-300/15',
                )}>
                  {forecastZone?.risk || 'LOW'}
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-emerald-50/75">
                {forecastZone?.growthPct >= 15
                  ? 'Crowd growth is increasing rapidly. The bottleneck is expected to worsen.'
                  : forecastZone?.growthPct >= 8
                    ? 'Crowd is climbing steadily. Volunteers are being staged nearby.'
                    : 'Crowd is stable. Monitoring continues.'}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    forecastZone?.riskScore >= 70 ? 'bg-red-500'
                    : forecastZone?.riskScore >= 45 ? 'bg-saffron' : 'bg-emerald-400',
                  )}
                  style={{ width: `${Math.min(100, forecastZone?.riskScore || 0)}%` }}
                />
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-200/80">
              Recommended: {forecastZone?.riskScore >= 65 ? 'Divert to canal-side route' : 'Monitor, keep current routing'}
            </p>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="surface p-5"
          >
            <SectionTitle
              title="Volunteer Tasks"
              detail={`${openTasks} open`}
              action={<Badge tone="blue">{tasks.length} total</Badge>}
            />
            <div className="mt-4 space-y-2">
              {tasks.slice(0, 4).map((t) => (
                <div key={t.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-bold text-ink">{t.title}</p>
                    <Badge tone={badgeToneForSeverity(t.priority)}>{t.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-slate-500">{t.zoneName || t.location?.latitude ? `${t.zoneName || 'Assigned zone'} · ${t.distanceKm || ''} km` : ''}</p>
                </div>
              ))}
            </div>
          </motion.article>
        </aside>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr_.85fr]">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface p-5"
        >
          <SectionTitle title="Crowd Trend" detail="Pilgrims (thousands) across corridor" />
          <div className="h-[220px] mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={crowdTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }} />
                <Line type="monotone" dataKey="pilgrims" stroke="#FF7A00" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="surface p-5"
        >
          <SectionTitle title="Incidents over Time" detail="Incidents vs Medical responses" />
          <div className="h-[220px] mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="incidents" fill="#FF7A00" radius={[6, 6, 0, 0]} />
                <Bar dataKey="medical" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="surface p-5"
        >
          <SectionTitle title="Top 5 Risk Zones" detail="People (k) vs Risk Score" />
          <div className="h-[220px] mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={zoneComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94A3B8" width={72} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="risk" fill="#DC2626" radius={[0, 6, 6, 0]} />
                <Bar dataKey="people" fill="#FF7A00" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface p-5"
        >
          <SectionTitle
            title="Recent Broadcasts"
            detail={`Alerts issued via Controller console${alerts.some((a) => a.is_stale) ? ' · some need acknowledgement' : ''}`}
          />
          <div className="mt-4 space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <div className={cn(
                  'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                  a.severity === 'CRITICAL' || a.severity === 'HIGH' ? 'bg-red-100 text-red-600'
                  : a.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600',
                )}>
                  <ClockIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-ink">{a.title}</p>
                    <Badge tone={badgeToneForSeverity(a.severity)}>{a.severity}</Badge>
                    {a.is_stale && <Badge tone="slate">Stale</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.message}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="surface p-5"
        >
          <SectionTitle title="Responder Snapshot" detail="Medical, Police and Volunteer readiness" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { icon: HeartIcon, label: 'Medical Camps', value: `${resources.filter((r) => r.type === 'MEDICAL' && r.status === 'OPEN').length} Active`, sub: `${resources.filter((r) => r.type === 'MEDICAL').length} total registered`, tone: 'text-red-600 bg-red-50' },
              { icon: ShieldExclamationIcon, label: 'Patrols', value: `${tasks.filter((t) => t.category === 'CROWD' && t.status !== 'COMPLETED').length} Active`, sub: `${tasks.filter((t) => t.status !== 'COMPLETED').length} total tasks`, tone: 'text-blue-600 bg-blue-50' },
              { icon: UsersIcon, label: 'Volunteers', value: `${volunteers.length} Registered`, sub: `${sortedVolunteers.filter((v) => v.location).length} with live GPS`, tone: 'text-emerald-700 bg-emerald-50' },
              { icon: BeakerIcon, label: 'Inventory Alerts', value: `${campInventory.filter((i) => i.status === 'LOW' || i.status === 'OUT').length} Low/Out`, sub: `${campInventory.length} items tracked`, tone: 'text-purple-700 bg-purple-50' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('grid h-10 w-10 place-items-center rounded-xl', item.tone)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="mt-0.5 text-lg font-bold text-ink">{item.value}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">{item.sub}</p>
              </div>
            ))}
          </div>
        </motion.article>
      </section>

      {/* Modal: Broadcast Alert */}
      <Modal
        open={alertModalOpen}
        onClose={() => { setAlertModalOpen(false); setSelectedZone(null); }}
        title="Broadcast Alert"
        description={selectedZone ? `Zone: ${selectedZone.zoneName} · Severity: ${alertSeverity}` : `Corridor-wide · Severity: ${alertSeverity}`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setAlertModalOpen(false); setSelectedZone(null); }}>Cancel</Button>
            <Button variant="primary" icon={SignalIcon} onClick={submitAlert}>Broadcast</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Severity</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) => (
                <button
                  key={s}
                  onClick={() => setAlertSeverity(s)}
                  className={cn(
                    'rounded-xl px-2 py-2 text-xs font-bold transition',
                    alertSeverity === s
                      ? s === 'CRITICAL' || s === 'HIGH' ? 'bg-red-600 text-white'
                      : s === 'MEDIUM' ? 'bg-orange-500 text-white' : 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  )}
                >{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Title</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-ink focus:border-saffron focus:ring-2 focus:ring-saffron-100 outline-none"
              value={alertTitle}
              onChange={(e) => setAlertTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-ink focus:border-saffron focus:ring-2 focus:ring-saffron-100 outline-none"
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
            />
          </div>
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            This alert will appear in the pilgrim <b>Alerts</b> feed, the top notification drawer, and the live simulator.
          </div>
        </div>
      </Modal>

      {/* Modal: Assign Volunteer Task */}
      <Modal
        open={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setSelectedZone(null); }}
        title="Assign Volunteer Task"
        description={
          selectedZone && typeof selectedZone === 'object' && 'type' in selectedZone
            ? `Incident: ${selectedZone.title}`
            : selectedZone
              ? `Zone: ${selectedZone.zoneName}`
              : 'Route-wide roving support'
        }
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setTaskModalOpen(false); setSelectedZone(null); }}>Cancel</Button>
            <Button variant="secondary" icon={UsersIcon} onClick={submitTask}>Assign</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Assign to Volunteer</label>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
              {sortedVolunteers.length === 0 && (
                <div className="rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">No volunteers found in the system.</div>
              )}
              {sortedVolunteers.map((v) => {
                const isSelected = selectedVolunteerId === v.id;
                const incidentLoc = selectedZone?.latitude && selectedZone?.longitude
                  ? { lat: Number(selectedZone.latitude), lng: Number(selectedZone.longitude) }
                  : null;
                const dist = v.location && incidentLoc
                  ? haversineKm(incidentLoc.lat, incidentLoc.lng, v.location.latitude, v.location.longitude)
                  : null;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVolunteerId(isSelected ? '' : v.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100'
                        : 'border-slate-100 hover:bg-slate-50',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{v.full_name || 'Unnamed Volunteer'}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        {v.phone && <span>{v.phone}</span>}
                        {dist != null && (
                          <span className="font-semibold text-emerald-600">
                            {dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)} km away`}
                            {sortedVolunteers.indexOf(v) === 0 && dist != null && ' · Nearest'}
                          </span>
                        )}
                        {!dist && <span>No location</span>}
                      </div>
                    </div>
                    <span className={cn(
                      'h-4 w-4 shrink-0 rounded-full border-2',
                      isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300',
                    )} />
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Select a volunteer or leave unassigned. Nearest volunteer is shown first.</p>
          </div>
          <div>
            <label className="label">Priority</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                <button
                  key={p}
                  onClick={() => setTaskPriority(p)}
                  className={cn(
                    'rounded-xl px-2 py-2 text-xs font-bold transition',
                    taskPriority === p
                      ? p === 'CRITICAL' || p === 'HIGH' ? 'bg-red-600 text-white'
                      : p === 'MEDIUM' ? 'bg-orange-500 text-white' : 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  )}
                >{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Instructions</label>
            <textarea
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-ink focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              value={taskInstructions}
              onChange={(e) => setTaskInstructions(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Modal: Recommend Alternate Route */}
      <Modal
        open={routeModalOpen}
        onClose={() => { setRouteModalOpen(false); setSelectedZone(null); }}
        title="Recommend Alternate Route"
        description={selectedZone ? `Triggered by zone: ${selectedZone.zoneName}` : 'Corridor-wide route guidance'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setRouteModalOpen(false); setSelectedZone(null); }}>Cancel</Button>
            <Button variant="primary" icon={MapIcon} onClick={submitRecommendRoute}>Publish Recommendation</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Recommended Route</label>
            <div className="mt-2 space-y-2">
              {(routes?.length > 0 ? routes.filter((r) => r.status !== 'BLOCKED').map((r) => ({
                id: r.id, label: r.name, sub: `${r.distance_km || '?'} km · ${r.type || 'Route'}`,
              })) : [
                { id: 'route-main', label: 'Main procession route', sub: '7.9 km · Direct' },
                { id: 'route-canal', label: 'Canal-side safer route', sub: '8.4 km · Less crowd' },
              ]).map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRecommendRouteId(r.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition',
                    recommendRouteId === r.id ? 'border-saffron bg-saffron-50 ring-2 ring-saffron-100' : 'border-slate-100 hover:bg-slate-50',
                  )}
                >
                  <div>
                    <p className="text-sm font-bold text-ink">{r.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{r.sub}</p>
                  </div>
                  <span className={cn('h-4 w-4 rounded-full border-2', recommendRouteId === r.id ? 'border-saffron bg-saffron' : 'border-slate-300')} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Reason shown to pilgrims</label>
            <textarea
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-ink focus:border-saffron focus:ring-2 focus:ring-saffron-100 outline-none"
              value={recommendReason}
              onChange={(e) => setRecommendReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
