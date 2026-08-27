import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { PhoneIcon } from '@heroicons/react/24/outline';

const emergencyTypes = new Set(['SOS', 'MEDICAL', 'CROWD_SURGE', 'ROAD_BLOCK']);
const severityBadge = { LOW: 'green', MEDIUM: 'orange', HIGH: 'red', CRITICAL: 'red' };
const statusBadge = { OPEN: 'red', ACKNOWLEDGED: 'orange', IN_PROGRESS: 'blue', RESPONDING: 'blue', RESOLVED: 'green', CLOSED: 'green' };

function timeSince(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function EmergencyCallsPage() {
  const { t } = useTranslation();
  const { incidents } = useApp();

  const emergencyCalls = useMemo(
    () => incidents.filter((i) => emergencyTypes.has(i.type)).sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    }),
    [incidents],
  );

  return (
    <>
      <PageHeader
        eyebrow={t('police.title', 'Security Console')}
        title={t('police.emergencyCalls', 'Emergency Calls')}
        description={t('police.emergencyCallsDesc', 'Incoming emergency incidents requiring dispatch.')}
      />
      {emergencyCalls.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <PhoneIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('police.noEmergencyCalls', 'No emergency calls')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('police.noEmergencyCallsDesc', 'There are currently no active emergency incidents.')}</p>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="divide-y divide-slate-100">
            {emergencyCalls.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{c.title || c.type.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-400">
                    {c.zone_name || t('police.unknownZone', 'Unknown zone')}
                    {c.created_at && <> · {timeSince(c.created_at)}</>}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <Badge tone={severityBadge[c.severity] || 'slate'} dot>{c.severity}</Badge>
                  <Badge tone={statusBadge[c.status] || 'slate'}>{(c.status || 'OPEN').replace('_', ' ')}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
