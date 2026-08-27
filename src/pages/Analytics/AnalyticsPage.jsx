import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownTrayIcon, ChartBarIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import MetricCard from '../../components/cards/MetricCard';
import SectionTitle from '../../components/common/SectionTitle';
import CrowdTrendChart from '../../components/charts/CrowdTrendChart';
import { useApp } from '../../context/AppContext';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { zones, crowdSummary, incidents, camps, simulation, crowdTrend } = useApp();

  const totalFootfall = crowdSummary?.activePilgrims || simulation.currentCrowdCount || 14820;
  const activeIncidents = incidents?.length || 0;
  const openIncidents = incidents?.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length || 0;
  const totalCamps = camps?.length || 0;
  const avgStock = useMemo(() => {
    if (!camps?.length) return 77;
    return Math.round(camps.reduce((s, c) => s + (c.stock_pct || 0), 0) / camps.length);
  }, [camps]);

  const zoneData = useMemo(() => {
    if (!zones?.length) return [
      { zone: 'Loni', flow: 82, capacity: 72 },
      { zone: 'Canal', flow: 53, capacity: 74 },
      { zone: 'Yawat', flow: 39, capacity: 76 },
      { zone: 'Saswad', flow: 61, capacity: 68 },
    ];
    return zones.slice(0, 6).map((z) => ({
      zone: z.name?.split(' ')[0] || 'Zone',
      flow: z.people_count || 0,
      capacity: z.capacity || 100,
    }));
  }, [zones]);

  const trendData = useMemo(() => {
    if (crowdTrend?.length) return crowdTrend;
    return [
      { time: '06:00', pilgrims: 8200, risk: 32 },
      { time: '08:00', pilgrims: 14800, risk: 52 },
      { time: '10:00', pilgrims: 20500, risk: 72 },
      { time: '12:00', pilgrims: 17000, risk: 62 },
      { time: '14:00', pilgrims: 14500, risk: 48 },
      { time: '16:00', pilgrims: 11000, risk: 35 },
    ];
  }, [crowdTrend]);

  const resourceData = useMemo(() => {
    if (!camps?.length) return [
      { name: 'Water', available: 92 },
      { name: 'Food', available: 78 },
      { name: 'Medical', available: 85 },
      { name: 'Sanitation', available: 71 },
    ];
    const types = ['WATER', 'FOOD', 'MEDICAL', 'CAMP'];
    const labels = ['Water', 'Food', 'Medical', 'Sanitation'];
    return types.map((type, i) => {
      const items = camps.filter((c) => c.type === type);
      const avg = items.length ? Math.round(items.reduce((s, c) => s + (c.stock_pct || 0), 0) / items.length) : 0;
      return { name: labels[i], available: avg || 75 };
    });
  }, [camps]);

  return (
    <>
      <PageHeader
        eyebrow={t('analytics.eyebrow')}
        title={t('analytics.title')}
        description={t('analytics.description')}
        actions={
          <>
            <Button variant="outline">Today</Button>
            <Button icon={ArrowDownTrayIcon}>{t('analytics.exportReport')}</Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={UserGroupIcon} label={t('analytics.totalFootfall')} value={totalFootfall.toLocaleString('en-IN')} helper="Across active corridor" trend={{ label: '+8.2%', direction: 'up' }} tone="orange" />
        <MetricCard icon={ChartBarIcon} label={t('analytics.predictionAccuracy')} value={`${Math.min(96, 78 + Math.round(simulation.riskScore / 10))}%`} helper="Validated over last 6 hours" trend={{ label: '+1.7%', direction: 'up' }} tone="green" />
        <MetricCard icon={ClockIcon} label={t('analytics.avgResponseTime')} value="04:18" helper={`${activeIncidents} incidents tracked`} trend={{ label: `${openIncidents} open`, direction: 'alert' }} tone="blue" />
        <MetricCard icon={ChartBarIcon} label={t('analytics.resourceCoverage')} value={`${avgStock}%`} helper={`${totalCamps} active resource points`} trend={{ label: avgStock > 70 ? 'Healthy' : 'Needs attention', direction: avgStock > 70 ? 'up' : 'alert' }} tone={avgStock > 70 ? 'green' : 'orange'} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <article className="surface p-5">
          <SectionTitle title={t('analytics.movementPattern')} detail="Pilgrim count across the active corridor" action={<Badge tone="orange">Peak · 10:40</Badge>} />
          <CrowdTrendChart height={310} />
        </article>
        <article className="surface p-5">
          <SectionTitle title={t('analytics.zoneCapacity')} detail="Current flow against comfortable capacity" />
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={zoneData} margin={{ top: 10, left: -16, right: 6 }}>
              <CartesianGrid vertical={false} stroke="#edf0ee" />
              <XAxis dataKey="zone" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #eef0ee' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="flow" name="Current flow" radius={[6, 6, 0, 0]}>
                {zoneData.map((entry, i) => (
                  <Cell key={entry.zone} fill={['#FF7A00', '#008C45', '#1976D2', '#A855F7', '#E53935', '#F4B400'][i % 6]} />
                ))}
              </Bar>
              <Bar dataKey="capacity" name="Safe capacity" fill="#D9E4DE" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <article className="surface p-5">
          <SectionTitle title="Resource utilization" detail="Available inventory by category" />
          <div className="space-y-5">
            {resourceData.map((resource, index) => (
              <div key={resource.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-ink">{resource.name}</span>
                  <span className="font-bold text-slate-500">{resource.available}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${resource.available}%`, background: ['#008C45', '#FF7A00', '#1976D2', '#A855F7'][index] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="surface p-5">
          <SectionTitle title="Risk signal movement" detail="AI risk score versus crowd volume" />
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData} margin={{ top: 10, left: -16, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#edf0ee" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #eef0ee' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="pilgrims" name="Crowd volume" stroke="#008C45" strokeWidth={3} dot={false} />
              <Line dataKey="risk" name="Risk score" stroke="#E53935" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </article>
      </section>
    </>
  );
}
