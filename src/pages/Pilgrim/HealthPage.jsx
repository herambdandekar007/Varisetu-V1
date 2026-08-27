import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import MetricCard from '../../components/cards/MetricCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { HeartIcon, ShieldExclamationIcon, BeakerIcon, BoltIcon, ArrowPathIcon, MapPinIcon } from '@heroicons/react/24/outline';

const riskTone = (level) => {
  if (level === 'HIGH') return 'red';
  if (level === 'MODERATE') return 'orange';
  return 'green';
};

const heatTone = (h) => {
  if (h === 'HIGH') return 'red';
  if (h === 'MODERATE') return 'orange';
  if (h === 'MILD') return 'saffron';
  return 'green';
};

const adviceIcon = {
  rest: '🪑',
  hydration: '💧',
  heat: '☀️',
  pace: '🐢',
  medical: '🏥',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HealthPage() {
  const { t } = useTranslation();
  const { latestHealth, healthSnapshots, weather } = useApp();

  const session = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('varisetu.health.session')) || {};
    } catch {
      return {};
    }
  }, [latestHealth]);

  const metrics = [
    { icon: MapPinIcon, label: t('Distance walked', 'Distance walked'), value: session.distanceM ? `${(session.distanceM / 1000).toFixed(1)} km` : '—', helper: 'Tracked from your GPS movement', tone: 'blue' },
    { icon: BoltIcon, label: t('Walking time', 'Walking time'), value: session.minutes ? `${Math.round(session.minutes)} min` : '—', helper: 'Continuous walking this session', tone: 'orange' },
    { icon: BeakerIcon, label: t('Hydration level', 'Hydration level'), value: latestHealth ? `${latestHealth.hydration_level}/10` : '—', helper: 'Higher means more attention needed', tone: 'green' },
    { icon: HeartIcon, label: t('Health snapshots', 'Health snapshots'), value: String(healthSnapshots.length), helper: 'Auto-saved as you walk', tone: 'red' },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t('health.eyebrow', 'Safety guidance')}
        title={t('health.title', 'Health Assistant')}
        description={t('health.description', 'Rule-based walking and heat guidance to keep your journey safe. This is safety information — never a medical diagnosis.')}
      />

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-float"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">{latestHealth ? (latestHealth.risk_score >= 60 ? '⚠️' : '✅') : '🏃'}</span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-emerald-50/60">Current guidance level</p>
                <p className="mt-0.5 text-2xl font-bold">
                  {latestHealth ? `${latestHealth.risk_level} · ${latestHealth.risk_score}/100` : 'Waiting for activity'}
                </p>
              </div>
            </div>
            {latestHealth && (
              <Badge tone={riskTone(latestHealth.risk_level)} dot>
                {latestHealth.risk_level}
              </Badge>
            )}
          </div>

          {latestHealth ? (
            <>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-50/60">Fatigue</p>
                  <p className="mt-1 text-xl font-bold">{latestHealth.fatigue_level}<span className="text-xs text-emerald-50/60">/10</span></p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-saffron transition-all" style={{ width: `${Math.min(100, latestHealth.fatigue_level * 10)}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-50/60">Hydration</p>
                  <p className="mt-1 text-xl font-bold">{latestHealth.hydration_level}<span className="text-xs text-emerald-50/60">/10</span></p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${Math.min(100, latestHealth.hydration_level * 10)}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-50/60">Heat stress</p>
                  <p className="mt-1 text-xl font-bold">{latestHealth.heat_stress || 'LOW'}</p>
                  <p className="mt-1 text-[10px] text-emerald-50/60">{weather?.temperature != null ? `${weather.temperature}°C ambient` : 'No temp data'}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-50/60">Pace</p>
                  <p className="mt-1 text-xl font-bold">{latestHealth.pace_kmh ?? '—'} <span className="text-xs text-emerald-50/60">km/h</span></p>
                  <p className="mt-1 text-[10px] text-emerald-50/60">{latestHealth.distance_km != null ? `${latestHealth.distance_km} km today` : 'No walk data'}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-emerald-50/60">Safety suggestions</p>
                {(latestHealth.advice || []).length === 0 ? (
                  <p className="mt-3 text-sm text-emerald-50/70">Conditions look comfortable — keep following posted directions.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {(latestHealth.advice || []).map((a, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-xl bg-white/10 p-3 text-sm">
                        <span className="text-base leading-5">{adviceIcon[a.level] || '•'}</span>
                        <span className="text-emerald-50/90">{a.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="mt-10 rounded-2xl bg-white/10 p-6 text-center">
              <p className="text-3xl">🏃</p>
              <p className="mt-2 text-sm text-emerald-50/80">Start moving or use the Developer Mode simulator to see guidance.</p>
              <p className="mt-1 text-xs text-emerald-50/60">Snapshots are created automatically as you walk.</p>
            </div>
          )}

          <p className="mt-6 border-t border-white/10 pt-4 text-xs text-emerald-50/50">
            Updated {latestHealth ? timeAgo(latestHealth.recorded_at) : '—'} · guidance auto-recalculates from distance, time and weather.
          </p>
        </motion.article>

        <div className="space-y-6">
          <motion.aside initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink">{t('health.ifUnwell', 'Not feeling well?')}</p>
              <ShieldExclamationIcon className="h-5 w-5 text-red-500" />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Reach out to a volunteer or the nearest medical camp. In an emergency this is not a diagnosis — get help immediately.
            </p>
            <Link to="/emergency" className="mt-4 block">
              <Button className="w-full" variant="danger">Open Emergency Center</Button>
            </Link>
          </motion.aside>

          <motion.aside initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink">{t('health.recent', 'Recent snapshots')}</p>
              <Badge tone="saffron">{healthSnapshots.length}</Badge>
            </div>
            {healthSnapshots.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No snapshots yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {healthSnapshots.slice(0, 6).map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.risk_level === 'HIGH' ? 'bg-red-500' : s.risk_level === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <div>
                        <p className="text-xs font-bold text-ink">{s.risk_level} · {s.risk_score}/100</p>
                        <p className="text-[10px] text-slate-400">{s.zone_name || 'On route'} · {timeAgo(s.recorded_at)}</p>
                      </div>
                    </div>
                    <ArrowPathIcon className="h-4 w-4 text-slate-300" />
                  </li>
                ))}
              </ul>
            )}
          </motion.aside>
        </div>
      </section>
    </>
  );
}