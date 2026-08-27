import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SectionTitle from '../../components/common/SectionTitle';
import RouteMap from '../../components/maps/RouteMap';
import { useApp } from '../../context/AppContext';
import {
  MapPinIcon, ExclamationTriangleIcon, ClockIcon,
  BoltIcon, CheckCircleIcon, UserGroupIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/format';

const statusColor = (status) => {
  switch (status) {
    case 'PENDING': return 'bg-amber-500';
    case 'ACCEPTED': return 'bg-blue-500';
    case 'IN_PROGRESS': return 'bg-saffron';
    case 'COMPLETED': return 'bg-emerald-500';
    default: return 'bg-slate-400';
  }
};

const incidentTone = (p) =>
  p === 'CRITICAL' || p === 'HIGH' ? 'red' : p === 'MEDIUM' ? 'orange' : 'green';

export default function ZonePage() {
  const { tasks, incidents, simulation, activeDemo, weather } = useApp();

  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const recentIncidents = incidents.slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="Volunteer Field Console"
        title="Incident Map"
        description="View nearby incidents, active tasks and your assigned sector in real time."
        actions={[
          <Button
            key="sim"
            variant="outline"
            icon={BoltIcon}
            onClick={() => window.location.href = '/volunteer/tasks'}
          >
            View My Tasks
          </Button>,
        ]}
      />

      {activeDemo === 'crowd-simulation' && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-700">
          DEMO / SIMULATED LIVE DATA · Map, tasks and incidents are synchronized
        </div>
      )}

      <section className="grid gap-6 2xl:grid-cols-[1.6fr_.8fr]">
        <article className="surface overflow-hidden p-4 sm:p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <SectionTitle
              title="Sector Operations Map"
              detail="Sector C · Alandi — Pilgrim route corridor"
              action={<Badge tone="green" dot>Live</Badge>}
            />
            <div className="flex flex-wrap gap-2">
              <Badge tone="blue" dot>Assigned: Tents 12–18</Badge>
              <Badge tone="amber">Temp {weather?.temperature ?? simulation.temperature ?? 32}°C</Badge>
            </div>
          </div>
          <div className="relative h-[520px] overflow-hidden rounded-2xl">
            <RouteMap mode="crowd" />
            {activeDemo === 'crowd-simulation' && (
              <div className="absolute left-4 top-4 z-[401] rounded-2xl border border-amber-200 bg-amber-50/95 px-3 py-2 shadow backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Demo · Simulated Live</p>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <ClockIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Pending</p>
                  <p className="mt-0.5 text-2xl font-bold text-ink">{tasks.filter(t => t.status === 'PENDING').length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <UserGroupIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">In Progress</p>
                  <p className="mt-0.5 text-2xl font-bold text-ink">{tasks.filter(t => t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS').length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircleIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Completed</p>
                  <p className="mt-0.5 text-2xl font-bold text-ink">{tasks.filter(t => t.status === 'COMPLETED').length}</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <article className="surface p-5">
            <SectionTitle
              title="My Active Tasks"
              detail={`${activeTasks.length} open`}
              action={<Badge tone="amber" dot>{activeTasks.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL').length} high priority</Badge>}
            />
            <div className="mt-4 max-h-[300px] space-y-3 overflow-y-auto pr-1">
              {activeTasks.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No active tasks — awaiting assignment
                </div>
              ) : (
                activeTasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-slate-100 bg-white p-3 hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{task.id}</p>
                        <p className="mt-0.5 truncate text-sm font-bold text-ink">{task.title}</p>
                      </div>
                      <Badge tone={task.priority === 'CRITICAL' || task.priority === 'HIGH' ? 'red' : task.priority === 'MEDIUM' ? 'orange' : 'green'}>
                        {task.priority}
                      </Badge>
                    </div>
                    {task.location?.zoneName && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                        {task.location.zoneName}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500">
                        <span className={cn('h-2 w-2 rounded-full', statusColor(task.status))} />
                        {task.status}
                      </span>
                      <Button
                        variant="ghost"
                        className="!py-1 !px-2 text-[11px]"
                        onClick={() => window.location.href = '/volunteer/tasks'}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="surface p-5">
            <SectionTitle
              title="Nearby Incidents"
              detail={`${recentIncidents.length} reported`}
              action={<Badge tone="red" dot>{incidents.filter(i => i.status === 'OPEN').length} new</Badge>}
            />
            <div className="mt-4 max-h-[300px] space-y-3 overflow-y-auto pr-1">
              {recentIncidents.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No nearby incidents reported
                </div>
              ) : (
                recentIncidents.map((inc) => (
                  <div key={inc.id} className="rounded-2xl border border-slate-100 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex items-start gap-2">
                        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-red-50 text-red-500">
                          <ExclamationTriangleIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{inc.type} · {inc.zoneName || 'Unknown zone'}</p>
                          <p className="mt-0.5 truncate text-sm font-bold text-ink">{inc.title}</p>
                        </div>
                      </div>
                      <Badge tone={incidentTone(inc.priority)}>{inc.priority}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{inc.description}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500">
                        <span className={cn('h-2 w-2 rounded-full',
                          inc.status === 'OPEN' ? 'bg-red-500'
                          : inc.status === 'ACKNOWLEDGED' ? 'bg-orange-500'
                          : inc.status === 'RESPONDING' ? 'bg-blue-500' : 'bg-emerald-500'
                        )} />
                        {inc.status}
                      </span>
                      {inc.zoneName && <span className="font-bold text-slate-400">{inc.zoneName}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </aside>
      </section>
    </>
  );
}
