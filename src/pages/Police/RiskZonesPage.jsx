import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

const densityBadge = { LOW: 'green', MEDIUM: 'orange', HIGH: 'red', CRITICAL: 'red' };

export default function RiskZonesPage() {
  const { t } = useTranslation();
  const { crowdCells } = useApp();

  const highRiskZones = useMemo(
    () => crowdCells.filter((z) => (Number(z.risk_score) || 0) > 50).sort((a, b) => (Number(b.risk_score) || 0) - (Number(a.risk_score) || 0)),
    [crowdCells],
  );

  return (
    <>
      <PageHeader
        eyebrow={t('police.title', 'Security Console')}
        title={t('police.riskZones', 'High Risk Zones')}
        description={t('police.riskZonesDesc', 'Areas with elevated risk scores requiring increased attention.')}
      />
      {highRiskZones.length === 0 ? (
        <div className="surface flex flex-col items-center py-16 text-center">
          <ShieldExclamationIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-base font-bold text-slate-500">{t('police.allSafe', 'All zones within safe levels')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('police.noHighRisk', 'No zones currently exceed the risk threshold.')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highRiskZones.map((z) => (
            <div key={z.id} className="surface p-5">
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50">
                  <ShieldExclamationIcon className="h-5 w-5 text-red-500" />
                </div>
                <Badge tone={densityBadge[z.density] || 'slate'} dot>{(z.density || 'LOW').replace('_', ' ')}</Badge>
              </div>
              <p className="mt-3 text-sm font-bold text-ink">{z.name}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                <span>{t('police.riskScore', 'Risk')}: <strong className="text-ink">{z.risk_score}</strong></span>
                <span>{t('police.people', 'People')}: <strong className="text-ink">{Number(z.people_count || 0).toLocaleString()}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
