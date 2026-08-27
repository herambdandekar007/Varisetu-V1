import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownTrayIcon, DocumentChartBarIcon, MapIcon, ShieldExclamationIcon, UserGroupIcon, UsersIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SectionTitle from '../../components/common/SectionTitle';
import MetricCard from '../../components/cards/MetricCard';
import RouteMap from '../../components/maps/RouteMap';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/format';

const icons = [UserGroupIcon, ShieldExclamationIcon, UsersIcon, DocumentChartBarIcon];

export default function AdminPage() {
  const { t } = useTranslation();
  const {
    activateCrowdSurge, stopCrowdSurge, activeDemo, zones, simulation,
    incidents, tasks, alerts, camps, crowdSummary, weather,
  } = useApp();
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Crowds', 'Resources', 'Response teams', 'Reports'];

  const handleOpenIncidentRoom = () => {
    if (activeDemo === 'crowd-simulation') {
      stopCrowdSurge();
      toast('Incident room simulation stopped. Dashboard data restored to baseline.');
    } else {
      activateCrowdSurge();
      toast.success('Simulated crowd surge activated. Pilgrim alerts and safer-route guidance are updated.');
    }
  };

  const openIncidents = incidents?.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED') || [];
  const activeTasks = tasks?.filter((t) => t.status !== 'COMPLETED') || [];
  const totalPilgrims = crowdSummary?.activePilgrims || simulation.currentCrowdCount || 14820;
  const highRiskZones = zones?.filter((z) => (z.risk_score || 0) > 70) || [];

  const kpis = useMemo(() => [
    { label: 'Active Pilgrims', value: totalPilgrims.toLocaleString('en-IN'), change: '+8.2% today', trend: 'up' },
    { label: 'Open Incidents', value: String(openIncidents.length), change: `${incidents?.length || 0} total`, trend: openIncidents.length > 3 ? 'alert' : 'up' },
    { label: 'Tasks Assigned', value: String(activeTasks.length), change: `${tasks?.length || 0} total`, trend: 'up' },
    { label: 'Active Alerts', value: String(alerts?.length || 0), change: `${alerts?.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH').length || 0} critical`, trend: 'alert' },
  ], [totalPilgrims, openIncidents, activeTasks, alerts]);

  const priorities = [
    { title: 'Deploy additional volunteers to Loni Market', type: 'Crowd Management', urgency: 'High', done: false },
    { title: 'Restock water supply at Camp C', type: 'Resource', urgency: 'Medium', done: false },
    { title: 'Medical team standby at Yawat crossing', type: 'Medical', urgency: 'High', done: false },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t('admin.eyebrow')}
        title={t('admin.title')}
        description={t('admin.description')}
        actions={
          <>
            <Button variant="outline" icon={ArrowDownTrayIcon}>Download SITREP</Button>
            <Button onClick={handleOpenIncidentRoom}>Open incident room</Button>
          </>
        }
      />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition',
              activeTab === tab ? 'bg-ink text-white' : 'bg-white text-slate-500 shadow-sm hover:text-ink',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <MetricCard
            key={kpi.label}
            icon={icons[index]}
            label={kpi.label}
            value={kpi.value}
            helper={kpi.change}
            trend={{ label: kpi.change, direction: kpi.trend }}
            tone={index === 1 ? 'red' : index === 2 ? 'green' : index === 3 ? 'blue' : 'orange'}
            index={index}
          />
        ))}
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.15fr_.85fr]">
        <article className="surface overflow-hidden p-4 sm:p-5">
          <SectionTitle
            title="Operational picture"
            detail={`${zones?.length || 0} zones monitored · ${openIncidents.length} active incidents`}
            action={<Badge tone="green" dot>{activeDemo === 'crowd-simulation' ? 'Demo live' : 'Live'}</Badge>}
          />
          <div className="relative h-[470px]">
            <RouteMap mode="crowd" />
            <div className="absolute right-4 top-4 z-[401] w-48 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
              <p className="label">Priority zones</p>
              <div className="mt-3 space-y-2">
                {(highRiskZones.length ? highRiskZones : zones?.slice(0, 3) || []).map((zone) => (
                  <div key={zone.name} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">{zone.name}</span>
                    <span className="font-bold" style={{ color: zone.color }}>{zone.density || `${zone.risk_score}%`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <aside className="space-y-4">
          <div className="surface p-5">
            <SectionTitle title="Command priorities" detail="Actions awaiting confirmation" />
            <div className="mt-4 space-y-3">
              {priorities.map((p, i) => (
                <article key={i} className={cn('rounded-2xl border p-4', p.urgency === 'High' ? 'border-orange-100 bg-orange-50' : 'border-blue-100 bg-blue-50')}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-ink">{p.title}</p>
                    <Badge tone={p.urgency === 'High' ? 'orange' : 'blue'}>{p.urgency}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{p.type}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="surface p-5">
            <SectionTitle title="System health" detail="Platform status" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-center">
                <p className="text-lg font-bold text-forest">{camps?.length || 0}</p>
                <p className="label">Camps Active</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-center">
                <p className="text-lg font-bold text-blue-700">{activeTasks.length}</p>
                <p className="label">Tasks Active</p>
              </div>
              <div className="rounded-xl bg-saffron-50 p-3 text-center">
                <p className="text-lg font-bold text-saffron">{highRiskZones.length}</p>
                <p className="label">High Risk Zones</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-3 text-center">
                <p className="text-lg font-bold text-purple-700">{weather?.temperature ?? simulation.temperature ?? 29}°C</p>
                <p className="label">Temperature</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
