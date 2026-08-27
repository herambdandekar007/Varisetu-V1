import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { TruckIcon } from '@heroicons/react/24/outline';

const statusTone = (s) => {
  if (s === 'OPEN' || s === 'SERVING') return 'green';
  if (s === 'LOW_STOCK') return 'orange';
  if (s === 'CLOSED' || s === 'MAINTENANCE') return 'slate';
  return 'slate';
};

export default function AmbulancesPage() {
  const { t } = useTranslation();
  const { camps } = useApp();
  const ambulances = useMemo(() => camps.filter((c) => c.type === 'AMBULANCE'), [camps]);

  return (
    <>
      <PageHeader
        eyebrow={t('Medical Command', 'Medical Command')}
        title={t('Ambulances', 'Ambulances')}
        description={t('Track ambulance locations and availability.', 'Track ambulance locations and availability.')}
      />
      {ambulances.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <TruckIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('No ambulances found', 'No ambulances found')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('No ambulance resources are registered.', 'No ambulance resources are registered.')}</p>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="divide-y divide-slate-100">
            {ambulances.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-bold text-ink">{a.name}</p>
                  <p className="text-xs text-slate-400">{a.zone_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={statusTone(a.status)} dot>{a.status}</Badge>
                  <span className="text-xs font-bold text-slate-400">{a.ambulance_available ? t('Available', 'Available') : t('Unavailable', 'Unavailable')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
