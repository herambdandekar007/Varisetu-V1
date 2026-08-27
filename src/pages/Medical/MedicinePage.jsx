import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import { BeakerIcon } from '@heroicons/react/24/outline';

const stockColor = (pct) => (pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-red-500');

export default function MedicinePage() {
  const { t } = useTranslation();
  const { camps } = useApp();
  const medicines = useMemo(() => camps.filter((c) => c.type === 'MEDICINE'), [camps]);

  return (
    <>
      <PageHeader
        eyebrow={t('Medical Command', 'Medical Command')}
        title={t('Medicine Stock', 'Medicine Stock')}
        description={t('Current inventory levels across all camps.', 'Current inventory levels across all camps.')}
      />
      {medicines.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <BeakerIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('No medicine stock found', 'No medicine stock found')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('No medicine resources are registered.', 'No medicine resources are registered.')}</p>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="divide-y divide-slate-100">
            {medicines.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.zone_name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-2.5 w-40 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${stockColor(item.stock_pct ?? 0)}`}
                      style={{ width: `${item.stock_pct ?? 0}%` }}
                    />
                  </div>
                  <p className="w-20 text-right text-sm font-bold text-ink">{item.available ?? 0}/{item.capacity ?? 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
