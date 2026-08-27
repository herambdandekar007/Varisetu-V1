import { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import MetricCard from '../../components/cards/MetricCard';
import Button from '../../components/common/Button';
import SectionTitle from '../../components/common/SectionTitle';
import Badge from '../../components/common/Badge';
import { healthService } from '../../services/healthService';
import { HeartIcon, UserGroupIcon, TruckIcon, BuildingOffice2Icon, BeakerIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

const severityColor = (s) => {
  if (s === 'CRITICAL') return 'red';
  if (s === 'HIGH') return 'orange';
  if (s === 'MEDIUM') return 'blue';
  return 'green';
};

const stockColor = (pct) => (pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-red-500');

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MedicalDashboard() {
  const { t } = useTranslation();
  const { incidents, camps } = useApp();
  const [corridorHealth, setCorridorHealth] = useState([]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const rows = await healthService.getCorridorHealth();
      if (active) setCorridorHealth(rows);
    };
    refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const medicalIncidents = useMemo(() => incidents.filter((i) => i.type === 'MEDICAL'), [incidents]);
  const doctors = useMemo(() => camps.filter((c) => c.type === 'DOCTOR'), [camps]);
  const ambulances = useMemo(() => camps.filter((c) => c.type === 'AMBULANCE'), [camps]);
  const medicalCamps = useMemo(() => camps.filter((c) => c.type === 'MEDICAL'), [camps]);
  const medicineStock = useMemo(() => camps.filter((c) => c.type === 'MEDICINE'), [camps]);
  const recentCases = useMemo(() => [...medicalIncidents].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5), [medicalIncidents]);

  const criticalCount = medicalIncidents.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = medicalIncidents.filter((i) => i.severity === 'HIGH').length;
  const otherCount = medicalIncidents.length - criticalCount - highCount;

  const metrics = [
    { icon: HeartIcon, label: t('Active Cases', 'Active Cases'), value: String(medicalIncidents.length), helper: `${criticalCount} critical, ${highCount} high, ${otherCount} other`, tone: 'red' },
    { icon: UserGroupIcon, label: t('Available Doctors', 'Available Doctors'), value: String(doctors.length), helper: doctors.length ? `${doctors.filter((d) => d.status === 'OPEN').length} available` : 'No doctors registered', tone: 'green' },
    { icon: TruckIcon, label: t('Ambulances', 'Ambulances'), value: String(ambulances.length), helper: `${ambulances.filter((a) => a.ambulance_available).length} available`, tone: 'blue' },
    { icon: BuildingOffice2Icon, label: t('Medical Camps', 'Medical Camps'), value: String(medicalCamps.length), helper: medicalCamps.length ? 'Operational' : 'No camps registered', tone: 'violet' },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t('Medical Command Center', 'Medical Command Center')}
        title={t('Medical Dashboard', 'Medical Dashboard')}
        description={t('Track cases, allocate ambulances, and monitor camp readiness.', 'Track cases, allocate ambulances, and monitor camp readiness.')}
        actions={[
          <Button key="cases" variant="outline" icon={HeartIcon}>{t('View Cases', 'View Cases')}</Button>,
          <Button key="alert" variant="danger" icon={TruckIcon}>{t('Dispatch Ambulance', 'Dispatch Ambulance')}</Button>,
        ]}
      />
      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface p-5 lg:col-span-2">
          <SectionTitle title={t('Medicine Stock', 'Medicine Stock')} detail={`${medicineStock.length} items tracked`} />
          {medicineStock.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t('No medicine stock data available.', 'No medicine stock data available.')}</p>
          ) : (
            <div className="space-y-3">
              {medicineStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${stockColor(item.stock_pct)}`} style={{ width: `${item.stock_pct ?? 0}%` }} />
                    </div>
                    <p className="w-16 text-right text-xs font-bold text-slate-500">{item.available}/{item.capacity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface p-5">
          <SectionTitle title={t('Recent Cases', 'Recent Cases')} detail={`${medicalIncidents.length} total`} />
          {recentCases.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">{t('No medical cases recorded.', 'No medical cases recorded.')}</p>
          ) : (
            <div className="space-y-3">
              {recentCases.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-bold text-ink">{c.title}</p>
                    <p className="text-xs text-slate-400">{c.zone_name} · {timeAgo(c.created_at)}</p>
                  </div>
                  <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${severityColor(c.severity) === 'red' ? 'bg-red-50 text-red-600' : severityColor(c.severity) === 'orange' ? 'bg-amber-50 text-amber-600' : severityColor(c.severity) === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{c.severity}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 surface p-5">
        <SectionTitle
          title={t('Corridor Health Watch', 'Corridor Health Watch')}
          detail={t('Recent pilgrim health snapshots across zones', 'Recent pilgrim health snapshots across zones · rule-based guidance, not diagnosis')}
          action={corridorHealth.length > 0 && <Badge tone={corridorHealth.some((r) => r.high_risk_count > 0) ? 'red' : 'green'} dot>{corridorHealth.some((r) => r.high_risk_count > 0) ? 'Attention' : 'Monitoring'}</Badge>}
        />
        {corridorHealth.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">{t('No health snapshots yet.', 'No health snapshots yet — guidance appears as pilgrims walk.')}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {corridorHealth.map((r) => (
              <div key={r.zone_name} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-ink">{r.zone_name}</p>
                  <ShieldExclamationIcon className="h-4 w-4 text-slate-300" />
                </div>
                <p className="mt-2 text-2xl font-bold text-ink">
                  {r.avg_risk}<span className="text-xs font-semibold text-slate-400">/100 avg</span>
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">{r.sample_count} snapshot{r.sample_count === 1 ? '' : 's'}</span>
                  <span className={r.high_risk_count > 0 ? 'text-red-600' : 'text-emerald-600'}>
                    {r.high_risk_count} high risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
}
