import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { UserGroupIcon } from '@heroicons/react/24/outline';

const statusTone = (s) => {
  if (s === 'OPEN' || s === 'SERVING') return 'green';
  if (s === 'LOW_STOCK') return 'orange';
  if (s === 'CLOSED' || s === 'MAINTENANCE') return 'slate';
  return 'slate';
};

export default function DoctorsPage() {
  const { t } = useTranslation();
  const { camps } = useApp();
  const doctors = useMemo(() => camps.filter((c) => c.type === 'DOCTOR'), [camps]);

  return (
    <>
      <PageHeader
        eyebrow={t('Medical Command', 'Medical Command')}
        title={t('Available Doctors', 'Available Doctors')}
        description={t('Medical personnel currently on duty.', 'Medical personnel currently on duty.')}
      />
      {doctors.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <UserGroupIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('No doctors found', 'No doctors found')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('No doctor resources are registered yet.', 'No doctor resources are registered yet.')}</p>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="divide-y divide-slate-100">
            {doctors.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-sm font-bold text-red-500">{d.name?.charAt(0) || 'D'}</div>
                  <div>
                    <p className="text-sm font-bold text-ink">{d.name}</p>
                    <p className="text-xs text-slate-400">{d.zone_name}</p>
                  </div>
                </div>
                <Badge tone={statusTone(d.status)} dot>{d.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
