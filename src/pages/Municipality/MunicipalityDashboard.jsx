import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  BuildingOffice2Icon,
  TruckIcon,
  CloudIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import MetricCard from '../../components/cards/MetricCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function MunicipalityDashboard() {
  const { t } = useTranslation();
  const { camps, simulation, crowdCells, weather } = useApp();

  const avgStock = useMemo(() => {
    if (!camps.length) return 0;
    return Math.round(camps.reduce((s, c) => s + (Number(c.stock_pct) || 0), 0) / camps.length);
  }, [camps]);

  const supplyVehicles = useMemo(() => camps.filter((c) => c.type === 'AMBULANCE'), [camps]);

  const totalPilgrims = useMemo(() => {
    return crowdCells.reduce((s, z) => s + (Number(z.peopleCount) || 0), 0);
  }, [crowdCells]);

  const metrics = useMemo(() => [
    {
      icon: UserGroupIcon,
      label: 'Overall Crowd',
      value: totalPilgrims.toLocaleString('en-IN'),
      helper: `${crowdCells.length} active zones tracked`,
      trend: { label: simulation.running ? 'Simulating' : 'Live', direction: simulation.running ? 'alert' : 'up' },
      tone: simulation.riskScore > 75 ? 'red' : simulation.riskScore > 50 ? 'orange' : 'green',
    },
    {
      icon: BuildingOffice2Icon,
      label: 'Resource Health',
      value: `${avgStock}%`,
      helper: `Average across ${camps.length} resources`,
      trend: { label: avgStock > 70 ? 'Good' : 'Low', direction: avgStock > 70 ? 'up' : 'down' },
      tone: avgStock > 70 ? 'green' : avgStock > 50 ? 'orange' : 'red',
    },
    {
      icon: TruckIcon,
      label: 'Supply Vehicles',
      value: String(supplyVehicles.length),
      helper: `${supplyVehicles.filter((v) => v.status === 'OPEN' || v.status === 'SERVING').length} active, ${supplyVehicles.filter((v) => v.status === 'CLOSED' || v.status === 'MAINTENANCE').length} standby`,
      trend: { label: `${supplyVehicles.length} total`, direction: 'up' },
      tone: 'blue',
    },
    {
      icon: CloudIcon,
      label: 'Weather',
      value: `${weather?.temperature ?? simulation.temperature ?? 32}°C`,
      helper: weather?.condition || (simulation.running ? 'Simulation active' : 'Current conditions'),
      trend: { label: (weather?.temperature ?? simulation.temperature ?? 32) > 35 ? 'Hot' : 'Moderate', direction: 'up' },
      tone: 'violet',
    },
  ], [totalPilgrims, crowdCells, avgStock, camps, supplyVehicles, simulation, weather]);

  const resourceHealth = useMemo(() => {
    const types = [
      { key: 'WATER', name: 'Water Supply', color: 'bg-blue-500' },
      { key: 'FOOD', name: 'Food Distribution', color: 'bg-emerald-500' },
      { key: 'CAMP', name: 'Sanitation', color: 'bg-amber-500' },
      { key: 'REST', name: 'Power / Lighting', color: 'bg-violet-500' },
    ];
    return types.map((t) => {
      const items = camps.filter((c) => c.type === t.key);
      const pct = items.length ? Math.round(items.reduce((s, c) => s + (Number(c.stock_pct) || 0), 0) / items.length) : 0;
      return { ...t, pct, count: items.length };
    }).filter((t) => t.count > 0);
  }, [camps]);

  const forecastItems = useMemo(() => {
    const peakCrowd = simulation.predictedCrowdCount || simulation.currentCrowdCount;
    const waterNeeded = Math.round((simulation.currentCrowdCount || 14820) * 3.2);
    const foodNeeded = Math.round((simulation.currentCrowdCount || 14820) * 4.1);
    const campsOpen = camps.filter((c) => c.type === 'CAMP' || c.type === 'REST');
    const campPct = campsOpen.length
      ? Math.round(campsOpen.reduce((s, c) => s + (Number(c.available) || 0), 0) / campsOpen.length)
      : 0;
    return [
      { metric: 'Peak Crowd Today', value: peakCrowd.toLocaleString('en-IN') },
      { metric: 'Water Needed (24h)', value: `${waterNeeded.toLocaleString('en-IN')} L` },
      { metric: 'Food Required', value: `${foodNeeded.toLocaleString('en-IN')} meals` },
      { metric: 'Camp Occupancy', value: `${campPct}% capacity` },
    ];
  }, [simulation, camps]);

  return (
    <>
      <PageHeader
        eyebrow={t('municipality.eyebrow', 'Civic Command Center')}
        title={t('municipality.title', 'Municipality Dashboard')}
        description={t('municipality.description', 'Oversee resource health, supply logistics, and AI-driven crowd forecasts.')}
        actions={[
          <Link key="resources" to="/municipality/resources">
            <Button variant="outline" icon={BuildingOffice2Icon}>{t('municipality.resourceMap', 'Resource Map')}</Button>
          </Link>,
          <Link key="forecast" to="/municipality/forecast">
            <Button variant="primary" icon={ChartBarIcon}>{t('municipality.aiForecast', 'AI Forecast')}</Button>
          </Link>,
        ]}
      />
      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface p-5">
          <p className="label">AI Forecast</p>
          <div className="mt-4 space-y-3">
            {forecastItems.map((f) => (
              <div key={f.metric} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <p className="text-sm text-slate-500">{f.metric}</p>
                <p className="text-sm font-bold text-ink">{f.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface p-5">
          <p className="label">Resource Health</p>
          <div className="mt-4 space-y-4">
            {resourceHealth.map((r) => (
              <div key={r.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{r.name}</span>
                  <span className="font-bold text-slate-500">{r.pct}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
            {!resourceHealth.length && (
              <p className="text-sm text-slate-400">No resource data available</p>
            )}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface p-5">
          <p className="label">Supply Vehicles</p>
          <div className="mt-4 space-y-3">
            {supplyVehicles.length > 0 ? supplyVehicles.slice(0, 5).map((v) => (
              <div key={v.id} className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-ink">{v.name}</p>
                  <Badge tone={v.status === 'OPEN' || v.status === 'SERVING' ? 'green' : v.status === 'LOW_STOCK' ? 'orange' : 'slate'}>
                    {v.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{v.zone_name || 'Unassigned'}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-400">No supply vehicles registered</p>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
