import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardDocumentCheckIcon, MapPinIcon, PlayIcon, CheckCircleIcon,
  HeartIcon, UsersIcon, ExclamationTriangleIcon, ShieldCheckIcon,
  ArrowRightIcon, ClockIcon, InformationCircleIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SectionTitle from '../../components/common/SectionTitle';
import MetricCard from '../../components/cards/MetricCard';
import RouteMap from '../../components/maps/RouteMap';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/format';

const priorityTone = (p) => {
  if (p === 'CRITICAL') return 'red';
  if (p === 'HIGH') return 'orange';
  if (p === 'MEDIUM') return 'yellow';
  return 'green';
};

const categoryIcon = (c) => {
  switch (c) {
    case 'MEDICAL': return HeartIcon;
    case 'CROWD': return UsersIcon;
    case 'RESCUE': return ShieldCheckIcon;
    case 'CAMP': return ExclamationTriangleIcon;
    default: return ExclamationTriangleIcon;
  }
};

const statusTone = (s) => {
  switch (s) {
    case 'PENDING': return 'blue';
    case 'ACCEPTED': return 'yellow';
    case 'IN_PROGRESS': return 'orange';
    case 'COMPLETED': return 'green';
    default: return 'slate';
  }
};

const taskStatusLabel = (s) => s.replace('_', ' ');

export default function TasksPage() {
  const {
    tasks, DEMO_VOLUNTEER_ID, DEMO_VOLUNTEER_NAME,
    volunteerAcceptTask, volunteerStartTask, volunteerCompleteTask,
    activeDemo, simulation, createEmergency,
  } = useApp();

  const [selectedTask, setSelectedTask] = useState(null);

  const myTasks = tasks.filter((t) =>
    t.assigned_to === DEMO_VOLUNTEER_ID || t.assigned_to == null || t.status === 'PENDING',
  );

  const sorted = [...myTasks].sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (order[a.priority] ?? 9) - (order[b.priority] ?? 9);
  });

  const pendingCount = sorted.filter((t) => t.status === 'PENDING').length;
  const inProgressCount = sorted.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ACCEPTED').length;
  const completedCount = sorted.filter((t) => t.status === 'COMPLETED').length;

  const metrics = [
    { icon: ClipboardDocumentCheckIcon, label: 'Assigned Tasks', value: String(sorted.length), helper: 'Tasks assigned to you today', trend: { label: `${pendingCount} new`, direction: pendingCount > 0 ? 'alert' : 'up' }, tone: 'blue' },
    { icon: PlayIcon, label: 'In Progress', value: String(inProgressCount), helper: 'Accepted + currently working', trend: { label: 'Live', direction: 'up' }, tone: 'orange' },
    { icon: CheckCircleIcon, label: 'Completed', value: String(completedCount), helper: 'Closed successfully today', trend: { label: 'Great work', direction: 'up' }, tone: 'green' },
    { icon: MapPinIcon, label: 'Operational Zone', value: 'Zone C', helper: 'Loni Kalbhor corridor', trend: { label: 'On duty', direction: 'up' }, tone: 'violet' },
  ];

  const renderPrimaryAction = (task) => {
    switch (task.status) {
      case 'PENDING':
        return (
          <Button
            variant="primary"
            onClick={(e) => { e.stopPropagation(); volunteerAcceptTask(task.id); }}
          >
            Accept Task
          </Button>
        );
      case 'ACCEPTED':
        return (
          <Button
            variant="primary"
            onClick={(e) => { e.stopPropagation(); volunteerStartTask(task.id); }}
            icon={PlayIcon}
          >
            Start Task
          </Button>
        );
      case 'IN_PROGRESS':
        return (
          <Button
            variant="secondary"
            onClick={(e) => { e.stopPropagation(); volunteerCompleteTask(task.id); }}
            icon={CheckCircleIcon}
          >
            Complete Task
          </Button>
        );
      default:
        return (
          <Badge tone="green" className="!bg-emerald-100 !text-emerald-700">Completed ✓</Badge>
        );
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Volunteer Console"
        title="My Tasks"
        description={
          activeDemo === 'crowd-simulation'
            ? 'Demo · Live synced with Controller Command Center · Accept → Start → Complete.'
            : 'Field operations queue: review, accept and complete tasks assigned by the Wari Controller.'
        }
        actions={[
          <Button
            key="sos"
            variant="danger"
            icon={ExclamationTriangleIcon}
            onClick={() => createEmergency({
              pilgrimName: DEMO_VOLUNTEER_NAME,
              description: 'Volunteer-reported situation requiring immediate controller attention.',
            })}
          >
            Report Emergency
          </Button>,
        ]}
      />

      {activeDemo === 'crowd-simulation' && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-700">
          DEMO / SIMULATED LIVE DATA · Tasks are synced from Controller Dashboard
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.label} {...m} index={i} />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface p-4 sm:p-5"
        >
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <SectionTitle
              title="Task Queue"
              detail={`${sorted.length} total · ${pendingCount} pending · ${inProgressCount} in progress`}
              action={
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <Badge tone="blue">{pendingCount} PENDING</Badge>
                  <Badge tone="orange">{inProgressCount} ACTIVE</Badge>
                  <Badge tone="green">{completedCount} DONE</Badge>
                </div>
              }
            />
          </div>

          <div className="space-y-4">
            {sorted.length === 0 && (
              <div className="rounded-2xl bg-slate-50 p-10 text-center">
                <ClipboardDocumentCheckIcon className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-bold text-slate-500">No tasks yet</p>
                <p className="mt-1 text-xs text-slate-400">Controller hasn&apos;t assigned any tasks to your zone yet.</p>
              </div>
            )}
            {sorted.map((task, idx) => {
              const CatIcon = categoryIcon(task.category);
              const isSelected = selectedTask?.id === task.id;
              return (
                <motion.button
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 * idx }}
                  onClick={() => setSelectedTask(isSelected ? null : task)}
                  className={cn(
                    'group w-full rounded-2xl border p-4 text-left transition',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-100'
                      : task.status === 'COMPLETED'
                        ? 'border-slate-100 bg-slate-50/70 opacity-90'
                        : 'border-slate-100 bg-white hover:shadow-card-hover hover:-translate-y-0.5',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn(
                        'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                        task.priority === 'CRITICAL' || task.priority === 'HIGH'
                          ? 'bg-red-100 text-red-600'
                          : task.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600',
                      )}>
                        <CatIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={priorityTone(task.priority)}>{task.priority} PRIORITY</Badge>
                          <Badge tone={statusTone(task.status)} className={cn(task.status === 'PENDING' ? '!bg-blue-100 !text-blue-700' : task.status === 'ACCEPTED' ? '!bg-amber-100 !text-amber-700' : task.status === 'IN_PROGRESS' ? '!bg-orange-100 !text-orange-700' : '!bg-emerald-100 !text-emerald-700')}>
                            {taskStatusLabel(task.status)}
                          </Badge>
                        </div>
                        <h3 className={cn('mt-2 text-base font-bold text-ink', task.status === 'COMPLETED' ? 'line-through text-slate-400' : '')}>
                          {task.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {task.zoneName || 'Assigned corridor'}
                          {task.distanceKm ? <> · <span className="font-semibold">{task.distanceKm} km away</span></> : null}
                        </p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      {renderPrimaryAction(task)}
                    </div>
                  </div>

                  {task.incidentTitle && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50/70 p-3 ring-1 ring-red-100">
                      <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-red-700">Linked Incident</p>
                        <p className="mt-0.5 truncate text-xs text-red-800">{task.incidentTitle}</p>
                      </div>
                    </div>
                  )}

                  {(isSelected || task.status !== 'COMPLETED') && (
                    <div className={cn('mt-3 grid gap-3 sm:grid-cols-3 text-xs', task.status === 'COMPLETED' ? 'opacity-70' : '')}>
                      <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-2.5">
                        <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-500">Location</p>
                          <p className="mt-0.5 truncate text-slate-700">{task.zoneName || 'Loni Kalbhor corridor'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-2.5">
                        <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-500">ETA</p>
                          <p className="mt-0.5 truncate text-slate-700">{task.etaMinutes ? `${task.etaMinutes} min travel` : '~10 min travel'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-2.5">
                        <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-500">Category</p>
                          <p className="mt-0.5 truncate text-slate-700">{task.category || 'Field support'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {task.instructions && isSelected && task.status !== 'COMPLETED' && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Instructions</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{task.instructions}</p>
                    </div>
                  )}

                  {task.description && isSelected && task.status === 'COMPLETED' && (
                    <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
                      <CheckCircleIcon className="mr-1 inline h-4 w-4 align-text-bottom" />
                      Task completed — {task.description}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.article>

        <aside className="space-y-6">
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="surface overflow-hidden p-4 sm:p-5"
          >
            <SectionTitle
              title={selectedTask ? `Task Map · ${selectedTask.zoneName || 'Nearby'}` : 'Nearby Area'}
              detail={selectedTask ? `Location of the selected task` : 'Tasks appear near the Loni Kalbhor corridor'}
              action={
                <Badge tone={activeDemo === 'crowd-simulation' ? 'orange' : 'green'} dot>
                  {activeDemo === 'crowd-simulation' ? 'Simulated Live' : 'Live'}
                </Badge>
              }
            />
            <div className="relative h-[280px] mt-3 overflow-hidden rounded-2xl">
              <RouteMap mode="crowd" />
            </div>
            {selectedTask && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs">
                <ArrowRightIcon className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">
                  Navigate to the task and press <b>Start Task</b> once you arrive on site.
                </span>
              </div>
            )}
            {activeDemo === 'crowd-simulation' && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Demo · Simulated live location · Risk step {simulation.riskScore}/100
              </div>
            )}
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="surface p-5"
          >
            <SectionTitle
              title="Task Lifecycle"
              detail="PENDING → ACCEPTED → IN PROGRESS → COMPLETED"
            />
            <div className="mt-4 space-y-3">
              {[
                { status: 'PENDING', label: '1. Pending', desc: 'Controller assigns you a task — it appears here.', icon: ClipboardDocumentCheckIcon, tone: 'bg-blue-100 text-blue-700' },
                { status: 'ACCEPTED', label: '2. Accepted', desc: 'Press Accept — Controller sees you are en route.', icon: CheckCircleIcon, tone: 'bg-amber-100 text-amber-700' },
                { status: 'IN_PROGRESS', label: '3. In Progress', desc: 'Press Start once you are on-site and working.', icon: PlayIcon, tone: 'bg-orange-100 text-orange-700' },
                { status: 'COMPLETED', label: '4. Completed', desc: 'Press Complete — Controller closes the incident.', icon: CheckCircleIcon, tone: 'bg-emerald-100 text-emerald-700' },
              ].map((s) => {
                const Icon = s.icon;
                const matches = selectedTask?.status === s.status;
                return (
                  <div
                    key={s.status}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border p-3 transition',
                      matches ? 'border-slate-300 bg-white shadow-sm' : 'border-transparent bg-slate-50',
                    )}
                  >
                    <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', s.tone)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">{s.label}</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
              💡 Any task created by the Controller dashboard (via Assign Volunteer or from Incident) appears here in real time.
            </p>
          </motion.article>
        </aside>
      </section>
    </>
  );
}
