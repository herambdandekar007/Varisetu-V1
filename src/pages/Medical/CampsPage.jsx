import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import SectionTitle from '../../components/common/SectionTitle';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';

const statusTone = (s) => {
  if (s === 'OPEN' || s === 'SERVING') return 'green';
  if (s === 'LOW_STOCK') return 'orange';
  if (s === 'CLOSED' || s === 'MAINTENANCE') return 'slate';
  return 'slate';
};

export default function CampsPage() {
  const { t } = useTranslation();
  const { camps } = useApp();
  const medicalCamps = useMemo(() => camps.filter((c) => c.type === 'MEDICAL' || c.type === 'CAMP'), [camps]);

  return (
    <>
      <PageHeader
        eyebrow={t('Medical Command', 'Medical Command')}
        title={t('Medical Camps', 'Medical Camps')}
        description={t('Overview of all medical camps on the route.', 'Overview of all medical camps on the route.')}
      />
      {medicalCamps.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <BuildingOffice2Icon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('No medical camps found', 'No medical camps found')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('No medical or camp resources are registered.', 'No medical or camp resources are registered.')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {medicalCamps.map((camp) => (
            <div key={camp.id} className="surface p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50"><BuildingOffice2Icon className="h-5 w-5 text-red-500" /></div>
                <div>
                  <p className="text-sm font-bold text-ink">{camp.name}</p>
                  <Badge tone={statusTone(camp.status)}>{camp.status}</Badge>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">{camp.zone_name}</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-ink">{camp.beds_available ?? 0}/{camp.beds_total ?? 0}</p>
                  <p className="label">{t('Beds', 'Beds')}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-ink">{camp.doctors ?? 0}</p>
                  <p className="label">{t('Doctors', 'Doctors')}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-ink">{camp.beds_total ? Math.round(((camp.beds_total - (camp.beds_available ?? 0)) / camp.beds_total) * 100) : 0}%</p>
                  <p className="label">{t('Occupied', 'Occupied')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
