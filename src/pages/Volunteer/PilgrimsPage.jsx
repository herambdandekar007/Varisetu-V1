import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function PilgrimsPage() {
  const { t } = useTranslation();
  const { crowdCells, pilgrimLocation } = useApp();

  const totalPilgrims = useMemo(() => {
    return crowdCells.reduce((s, z) => s + (Number(z.peopleCount) || 0), 0);
  }, [crowdCells]);

  const zoneName = pilgrimLocation?.zoneName || 'Unknown Zone';

  const sortedZones = useMemo(() => {
    return [...crowdCells].sort((a, b) => (Number(b.peopleCount) || 0) - (Number(a.peopleCount) || 0));
  }, [crowdCells]);

  return (
    <>
      <PageHeader
        eyebrow={t('pilgrims.eyebrow', 'Volunteer Console')}
        title={t('pilgrims.title', 'Nearby Pilgrims')}
        description={t('pilgrims.description', 'Pilgrims in your assigned zone who may need assistance.')}
        actions={
          <Button variant="outline" icon={UserGroupIcon}>
            View All
          </Button>
        }
      />
      <div className="surface p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50">
          <UserGroupIcon className="h-7 w-7 text-emerald-600" />
        </div>
        <p className="mt-4 text-lg font-bold text-ink">{totalPilgrims.toLocaleString('en-IN')} Pilgrims</p>
        <p className="mt-1 text-sm text-slate-400">Across {crowdCells.length} zones</p>
        <p className="mt-1 text-sm text-slate-500">Your zone: {zoneName}</p>
      </div>

      {sortedZones.length > 0 && (
        <div className="mt-6 surface overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-sm font-bold text-ink">Crowd by Zone</p>
          </div>
          <div className="divide-y divide-slate-100">
            {sortedZones.map((z) => (
              <div key={z.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-bold text-ink">{z.zoneName || z.name}</p>
                  <p className="text-xs text-slate-400">
                    Risk: {z.riskScore || 0}% · {z.density || 'LOW'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-ink">{(Number(z.peopleCount) || 0).toLocaleString('en-IN')}</p>
                  <Badge
                    tone={
                      z.riskScore >= 80
                        ? 'red'
                        : z.riskScore >= 60
                          ? 'orange'
                          : z.riskScore >= 35
                            ? 'slate'
                            : 'green'
                    }
                  >
                    {z.density || 'LOW'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
