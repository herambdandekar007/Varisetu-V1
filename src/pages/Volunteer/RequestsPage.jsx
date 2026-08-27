import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

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

export default function RequestsPage() {
  const { t } = useTranslation();
  const { tasks } = useApp();

  const openRequests = useMemo(() => {
    return tasks.filter((tk) => tk.status === 'PENDING' || tk.status === 'ACCEPTED');
  }, [tasks]);

  return (
    <>
      <PageHeader
        eyebrow={t('requests.eyebrow', 'Volunteer Console')}
        title={t('requests.title', 'Open Requests')}
        description={t('requests.description', 'Track and respond to pilgrim assistance requests.')}
        actions={
          <Button variant="primary" icon={ClipboardDocumentListIcon}>
            New Request
          </Button>
        }
      />
      {openRequests.length > 0 ? (
        <div className="surface overflow-hidden">
          <div className="divide-y divide-slate-100">
            {openRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-bold text-ink">{r.title}</p>
                  <p className="text-xs text-slate-400">
                    {r.zone_name || 'Unassigned'}
                    {r.category ? ` · ${r.category}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {priorityBadge(r.priority)}
                  {statusBadge(r.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="surface flex flex-col items-center py-16 text-center">
          <ClipboardDocumentListIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">No open requests</p>
          <p className="mt-1 text-sm text-slate-400">New task requests will appear here when assigned.</p>
        </div>
      )}
    </>
  );
}
