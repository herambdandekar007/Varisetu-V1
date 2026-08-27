import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { HeartIcon } from '@heroicons/react/24/outline';

const severityTone = (s) => {
  if (s === 'CRITICAL') return 'red';
  if (s === 'HIGH') return 'orange';
  if (s === 'MEDIUM') return 'blue';
  return 'green';
};

const statusTone = (s) => {
  if (s === 'OPEN') return 'red';
  if (s === 'ACKNOWLEDGED' || s === 'IN_PROGRESS' || s === 'RESPONDING') return 'blue';
  if (s === 'RESOLVED' || s === 'CLOSED') return 'green';
  return 'slate';
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CasesPage() {
  const { t } = useTranslation();
  const { incidents } = useApp();
  const medicalCases = useMemo(() => [...incidents].filter((i) => i.type === 'MEDICAL').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [incidents]);

  return (
    <>
      <PageHeader
        eyebrow={t('Medical Command', 'Medical Command')}
        title={t('Active Cases', 'Active Cases')}
        description={t('Track all active medical cases on the route.', 'Track all active medical cases on the route.')}
      />
      {medicalCases.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <HeartIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('No medical cases found', 'No medical cases found')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('No medical incidents have been reported yet.', 'No medical incidents have been reported yet.')}</p>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="divide-y divide-slate-100">
            {medicalCases.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-bold text-ink">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.pilgrim_name || 'Unknown'} · {c.zone_name} · {timeAgo(c.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={severityTone(c.severity)} dot>{c.severity}</Badge>
                  <Badge tone={statusTone(c.status)}>{c.status?.replace('_', ' ')}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
