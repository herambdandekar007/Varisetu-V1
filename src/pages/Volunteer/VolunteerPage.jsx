import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  SparklesIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { taskService } from '../../services/taskService';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SectionTitle from '../../components/common/SectionTitle';
import MetricCard from '../../components/cards/MetricCard';
import RouteMap from '../../components/maps/RouteMap';

export default function VolunteerPage() {
  const { t } = useTranslation();
  const {
    tasks,
    pilgrimLocation,
    incidents,
    DEMO_VOLUNTEER_ID,
    volunteerAcceptTask,
    volunteerCompleteTask,
  } = useApp();

  const [checked, setChecked] = useState({});

  const myTasks = useMemo(() => {
    return tasks.filter(
      (tk) =>
        (tk.assigned_to === DEMO_VOLUNTEER_ID || tk.assigned_to == null) &&
        tk.status !== 'COMPLETED',
    );
  }, [tasks, DEMO_VOLUNTEER_ID]);

  const assignedToMe = useMemo(() => {
    return tasks.filter(
      (tk) => tk.assigned_to === DEMO_VOLUNTEER_ID && tk.status !== 'COMPLETED',
    );
  }, [tasks, DEMO_VOLUNTEER_ID]);

  const completedCount = useMemo(() => {
    return tasks.filter(
      (tk) =>
        (tk.assigned_to === DEMO_VOLUNTEER_ID || tk.assigned_to == null) &&
        tk.status === 'COMPLETED',
    ).length;
  }, [tasks, DEMO_VOLUNTEER_ID]);

  const handleDecline = async (taskId) => {
    const result = await taskService.decline(taskId);
    if (result) toast('Task declined and returned to queue.');
  };

  const nearbyRequests = useMemo(() => {
    return incidents.filter((i) => i.status !== 'RESOLVED').length;
  }, [incidents]);

  const toggleTask = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const zoneName = pilgrimLocation?.zoneName || 'Unknown Zone';

  const statusBadge = (status) => {
    const map = {
      PENDING: { tone: 'slate', label: 'Pending' },
      ACCEPTED: { tone: 'blue', label: 'Accepted' },
      IN_PROGRESS: { tone: 'orange', label: 'In Progress' },
      COMPLETED: { tone: 'green', label: 'Done' },
    };
    const s = map[status] || { tone: 'slate', label: status };
    return <Badge tone={s.tone}>{s.label}</Badge>;
  };

  const priorityBadge = (priority) => {
    const map = {
      CRITICAL: { tone: 'red', label: 'Critical' },
      HIGH: { tone: 'orange', label: 'High' },
      MEDIUM: { tone: 'slate', label: 'Medium' },
      LOW: { tone: 'green', label: 'Low' },
    };
    const s = map[priority] || { tone: 'slate', label: priority };
    return <Badge tone={s.tone}>{s.label}</Badge>;
  };

  return (
    <>
      <PageHeader
        eyebrow={t('volunteer.eyebrow', 'Volunteer Console')}
        title={t('volunteer.title', 'Volunteer Dashboard')}
        description={t('volunteer.description', 'Manage your assigned tasks and assist pilgrims.')}
        actions={
          <Button
            variant="outline"
            icon={ClipboardDocumentCheckIcon}
            onClick={() => toast.success('Your check-in is logged for ' + zoneName + '.')}
          >
            Check in to zone
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={MapPinIcon}
          label="Assigned area"
          value={zoneName}
          helper={pilgrimLocation?.zoneName ? pilgrimLocation.zoneName : 'Location pending'}
          trend={{ label: 'On site', direction: 'up' }}
          tone="green"
          index={0}
        />
        <MetricCard
          icon={ClipboardDocumentCheckIcon}
          label="Tasks complete"
          value={`${completedCount}/${completedCount + myTasks.length}`}
          helper={`${assignedToMe.length} assigned to you`}
          trend={{ label: 'On track', direction: 'up' }}
          tone="blue"
          index={1}
        />
        <MetricCard
          icon={ExclamationTriangleIcon}
          label="Requests nearby"
          value={String(nearbyRequests).padStart(2, '0')}
          helper="Active incidents in area"
          trend={{ label: nearbyRequests > 0 ? 'Review' : 'Clear', direction: nearbyRequests > 0 ? 'alert' : 'up' }}
          tone="red"
          index={2}
        />
        <MetricCard
          icon={UserGroupIcon}
          label="Pilgrims in zone"
          value={pilgrimLocation?.latitude ? 'Present' : 'N/A'}
          helper={`Location: ${pilgrimLocation?.latitude?.toFixed(3) || '--'}, ${pilgrimLocation?.longitude?.toFixed(3) || '--'}`}
          trend={{ label: 'Tracking', direction: 'up' }}
          tone="orange"
          index={3}
        />
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[.78fr_1.22fr]">
        <article className="surface p-5">
          <SectionTitle
            title="Today's checklist"
            detail={`${completedCount} of ${completedCount + myTasks.length} tasks completed`}
          />
          {myTasks.length > 0 ? (
            <div className="space-y-3">
              {myTasks.map((task) => (
                <label
                  key={task.id}
                  className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                    checked[task.id] ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <input
                    className="mt-1 h-4 w-4 accent-[#008C45]"
                    type="checkbox"
                    checked={!!checked[task.id]}
                    onChange={() => toggleTask(task.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-sm font-bold ${checked[task.id] ? 'text-emerald-800 line-through' : 'text-ink'}`}>
                        {task.title}
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {priorityBadge(task.priority)}
                        {statusBadge(task.status)}
                        {task.assigned_to === DEMO_VOLUNTEER_ID && task.status === 'PENDING' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDecline(task.id); }}
                            className="ml-1 grid h-6 w-6 place-items-center rounded-lg bg-red-50 text-red-400 transition hover:bg-red-100 hover:text-red-600"
                            title="Decline task"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {task.description && (
                      <p className="mt-1 text-xs text-slate-500">{task.description}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {task.zone_name || 'Unassigned'} {task.category ? `· ${task.category}` : ''}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <CheckCircleIcon className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-500">No active tasks</p>
              <p className="mt-1 text-xs text-slate-400">New tasks assigned to you will appear here.</p>
            </div>
          )}
          {myTasks.length > 0 && (
            <Button
              className="mt-5 w-full"
              variant="secondary"
              icon={CheckCircleIcon}
              onClick={() => toast.success('Checklist progress has been synced.')}
            >
              Sync progress
            </Button>
          )}
        </article>

        <article className="surface overflow-hidden p-4 sm:p-5">
          <SectionTitle
            title="Your area"
            detail={`Requests and resource points near ${zoneName}`}
            action={<Badge tone="green" dot>Normal flow</Badge>}
          />
          <div className="relative h-[430px]">
            <RouteMap />
            <div className="absolute right-4 top-4 z-[401] rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
              <p className="label">Your next action</p>
              {myTasks.length > 0 ? (
                <>
                  <p className="mt-1 text-sm font-bold text-ink">{myTasks[0].title}</p>
                  <p className="mt-1 text-xs font-semibold text-saffron">{myTasks[0].zone_name || 'Nearby'}</p>
                </>
              ) : (
                <p className="mt-1 text-sm text-slate-500">No pending tasks</p>
              )}
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
