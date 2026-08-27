import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { MapIcon } from '@heroicons/react/24/outline';

const statusBadge = { OPEN: 'green', CLOSED: 'slate', MAINTENANCE: 'orange' };
const statusLabel = { OPEN: 'Active', CLOSED: 'Inactive', MAINTENANCE: 'Maintenance' };

export default function BarricadesPage() {
  const { t } = useTranslation();
  const { resources } = useApp();

  const barricades = useMemo(
    () => resources.filter((r) => (r.type || r.icon || '').toUpperCase() === 'BARRICADE' || (r.name || '').toLowerCase().includes('barricade')),
    [resources],
  );

  return (
    <>
      <PageHeader
        eyebrow={t('police.title', 'Security Console')}
        title={t('police.barricades', 'Barricades')}
        description={t('police.barricadesDesc', 'All active barricades and checkpoints.')}
      />
      {barricades.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <MapIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('police.noBarricades', 'No barricades found')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('police.noBarricadesDesc', 'There are currently no barricades registered in the system.')}</p>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="divide-y divide-slate-100">
            {barricades.map((b) => {
              const st = (b.status || 'OPEN').toUpperCase();
              return (
                <div key={b.id} className="flex items-center justify-between px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{b.name}</p>
                    <p className="text-xs text-slate-400">{b.area || t('police.unknownZone', 'Unknown zone')}</p>
                  </div>
                  <Badge tone={statusBadge[st] || 'slate'} dot>{statusLabel[st] || st}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
