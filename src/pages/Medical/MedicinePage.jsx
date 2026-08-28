import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { BeakerIcon } from '@heroicons/react/24/outline';

export default function MedicinePage() {
  const { t } = useTranslation();
  const { camps, campInventory } = useApp();

  // Get all medicine inventory items
  const medicineItems = useMemo(() =>
    (campInventory || []).filter((item) => item.category === 'MEDICINE'),
    [campInventory]
  );

  const statusTone = (status) => {
    if (status === 'OUT') return 'red';
    if (status === 'LOW') return 'orange';
    return 'green';
  };

  return (
    <>
      <PageHeader
        eyebrow={t('Medical Command', 'Medical Command')}
        title={t('Medicine Stock', 'Medicine Stock')}
        description={t('Current inventory levels across all camps.', 'Current inventory levels across all camps.')}
      />
      {medicineItems.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <BeakerIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('No medicine stock found', 'No medicine stock found')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('No medicine inventory is registered.', 'No medicine inventory is registered.')}</p>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Medicine Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Camp Location</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicineItems.map((item) => {
                  const camp = camps.find((c) => c.id === item.resource_id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-ink">{item.item_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">{item.purpose || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">{camp?.name || item.zone_name || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-ink">
                          {Number(item.quantity || 0).toLocaleString()} {item.unit}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
