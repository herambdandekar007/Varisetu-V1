import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TruckIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';

const statusBadge = (status) => {
  const map = {
    OPEN: { tone: 'green', label: 'Available' },
    SERVING: { tone: 'blue', label: 'En route' },
    LOW_STOCK: { tone: 'orange', label: 'Low stock' },
    CLOSED: { tone: 'slate', label: 'Offline' },
    MAINTENANCE: { tone: 'red', label: 'Maintenance' },
  };
  const s = map[status] || { tone: 'slate', label: status };
  return <Badge tone={s.tone}>{s.label}</Badge>;
};

export default function SupplyPage() {
  const { t } = useTranslation();
  const { camps } = useApp();

  const ambulances = useMemo(() => camps.filter((c) => c.type === 'AMBULANCE'), [camps]);

  return (
    <>
      <PageHeader
        eyebrow={t('supply.eyebrow', 'Civic Console')}
        title={t('supply.title', 'Supply Vehicles')}
        description={t('supply.description', 'Track supply vehicle locations and status.')}
      />
      {ambulances.length > 0 ? (
        <div className="surface overflow-hidden">
          <div className="divide-y divide-slate-100">
            {ambulances.map((v) => (
              <div key={v.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-50">
                    <TruckIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{v.name}</p>
                    <p className="text-xs text-slate-400">{v.zone_name || 'Unassigned'}</p>
                  </div>
                </div>
                <div className="text-right">
                  {statusBadge(v.status)}
                  {v.ambulance_available != null && (
                    <p className="mt-0.5 text-xs font-bold text-slate-400">
                      {v.ambulance_available ? 'Unit available' : 'Unit deployed'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="surface flex flex-col items-center py-16 text-center">
          <TruckIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">No supply vehicles found</p>
          <p className="mt-1 text-sm text-slate-400">Ambulance and supply resources will appear here once registered.</p>
        </div>
      )}
    </>
  );
}
