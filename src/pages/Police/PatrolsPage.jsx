import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { UserGroupIcon } from '@heroicons/react/24/outline';

const statusBadge = { PENDING: 'slate', ACCEPTED: 'blue', IN_PROGRESS: 'orange', COMPLETED: 'green' };
const priorityBadge = { LOW: 'slate', MEDIUM: 'orange', HIGH: 'red', CRITICAL: 'red' };

export default function PatrolsPage() {
  const { t } = useTranslation();
  const { tasks } = useApp();

  const activePatrols = useMemo(
    () => tasks.filter((task) => task.status !== 'COMPLETED').sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
    }),
    [tasks],
  );

  return (
    <>
      <PageHeader
        eyebrow={t('police.title', 'Security Console')}
        title={t('police.activePatrols', 'Active Patrols')}
        description={t('police.activePatrolsDesc', 'Currently deployed patrol units and assignments.')}
      />
      {activePatrols.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <UserGroupIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('police.noActivePatrols', 'No active patrols')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('police.noActivePatrolsDesc', 'All patrol tasks have been completed.')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activePatrols.map((p) => (
            <div key={p.id} className="surface p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50">
                  <UserGroupIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{p.title}</p>
                  <p className="truncate text-xs text-slate-400">{p.zone_name || t('police.unknownZone', 'Unknown zone')}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={statusBadge[p.status] || 'slate'} dot>{(p.status || 'PENDING').replace('_', ' ')}</Badge>
                <Badge tone={priorityBadge[p.priority] || 'slate'}>{p.priority}</Badge>
              </div>
              {p.assigned_to_name && (
                <p className="mt-2 text-xs text-slate-400">{t('police.assignedTo', 'Assigned')}: <strong className="text-ink">{p.assigned_to_name}</strong></p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
