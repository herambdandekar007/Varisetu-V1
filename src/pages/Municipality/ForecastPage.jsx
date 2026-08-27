import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';

export default function ForecastPage() {
  const { t } = useTranslation();
  const { simulation, crowdCells, camps } = useApp();

  const totalPilgrims = useMemo(() => {
    return crowdCells.reduce((s, z) => s + (Number(z.peopleCount) || 0), 0);
  }, [crowdCells]);

  const peakCrowd = simulation.predictedCrowdCount || totalPilgrims;

  const waterNeeded = useMemo(() => Math.round(totalPilgrims * 3.2), [totalPilgrims]);
  const foodNeeded = useMemo(() => Math.round(totalPilgrims * 4.1), [totalPilgrims]);

  const campData = useMemo(() => {
    const campItems = camps.filter((c) => c.type === 'CAMP' || c.type === 'REST');
    const totalBeds = campItems.reduce((s, c) => s + (Number(c.capacity) || 0), 0);
    const availableBeds = campItems.reduce((s, c) => s + (Number(c.available) || 0), 0);
    const occupancyPct = totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0;
    const atCapacity = campItems.filter((c) => (Number(c.available) || 0) === 0).length;
    const available = campItems.filter((c) => (Number(c.available) || 0) > 0).length;
    return { totalBeds, availableBeds, occupancyPct, atCapacity, available, count: campItems.length };
  }, [camps]);

  const highestRisk = useMemo(() => {
    if (!crowdCells.length) return null;
    return [...crowdCells].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))[0];
  }, [crowdCells]);

  return (
    <>
      <PageHeader
        eyebrow={t('forecast.eyebrow', 'Civic Console')}
        title={t('forecast.title', 'AI Forecast')}
        description={t('forecast.description', 'AI-driven predictions for crowd, resource, and logistics planning.')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface p-5">
          <p className="label">Peak Crowd Today</p>
          <p className="mt-2 text-2xl font-bold text-ink">{peakCrowd.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-sm text-slate-400">
            {highestRisk ? `Highest risk: ${highestRisk.zoneName || highestRisk.name} (${highestRisk.riskScore}%)` : 'No risk data available'}
          </p>
        </div>
        <div className="surface p-5">
          <p className="label">Water Needed (24h)</p>
          <p className="mt-2 text-2xl font-bold text-ink">{waterNeeded.toLocaleString('en-IN')} L</p>
          <p className="mt-1 text-sm text-slate-400">Based on {totalPilgrims.toLocaleString('en-IN')} pilgrims + weather</p>
        </div>
        <div className="surface p-5">
          <p className="label">Food Required</p>
          <p className="mt-2 text-2xl font-bold text-ink">{foodNeeded.toLocaleString('en-IN')} meals</p>
          <p className="mt-1 text-sm text-slate-400">Based on current pilgrim count estimates</p>
        </div>
        <div className="surface p-5">
          <p className="label">Camp Occupancy</p>
          <p className="mt-2 text-2xl font-bold text-ink">{campData.occupancyPct}%</p>
          <p className="mt-1 text-sm text-slate-400">
            {campData.atCapacity} at capacity, {campData.available} available ({campData.count} camps)
          </p>
        </div>
      </div>

      <div className="mt-6 surface p-5">
        <p className="label">Zone Risk Overview</p>
        {crowdCells.length > 0 ? (
          <div className="mt-4 space-y-3">
            {crowdCells.slice(0, 8).map((z) => (
              <div key={z.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-bold text-ink">{z.zoneName || z.name}</p>
                  <p className="text-xs text-slate-400">{(z.peopleCount || 0).toLocaleString('en-IN')} pilgrims</p>
                </div>
                <Badge
                  tone={z.riskScore >= 80 ? 'red' : z.riskScore >= 60 ? 'orange' : z.riskScore >= 35 ? 'slate' : 'green'}
                >
                  {z.riskScore}%
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">No zone data available</p>
        )}
      </div>
    </>
  );
}
