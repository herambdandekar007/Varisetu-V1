import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BuildingOffice2Icon, BeakerIcon, CakeIcon, MapPinIcon, BoltIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import SectionTitle from '../../components/common/SectionTitle';

const CATEGORY_CONFIG = [
  { type: 'WATER', label: 'Water Supply', icon: BeakerIcon, color: 'bg-blue-500' },
  { type: 'FOOD', label: 'Food Distribution', icon: CakeIcon, color: 'bg-emerald-500' },
  { type: 'CAMP', label: 'Sanitation', icon: MapPinIcon, color: 'bg-amber-500' },
  { type: 'REST', label: 'Power / Lighting', icon: BoltIcon, color: 'bg-violet-500' },
];

const statusBadge = (status) => {
  const map = {
    OPEN: { tone: 'green', label: 'Operational' },
    SERVING: { tone: 'blue', label: 'Serving' },
    LOW_STOCK: { tone: 'orange', label: 'Low Stock' },
    CLOSED: { tone: 'red', label: 'Closed' },
    MAINTENANCE: { tone: 'slate', label: 'Maintenance' },
  };
  const s = map[status] || { tone: 'slate', label: status };
  return <Badge tone={s.tone}>{s.label}</Badge>;
};

export default function ResourcesPage() {
  const { t } = useTranslation();
  const { camps } = useApp();

  const categories = useMemo(() => {
    return CATEGORY_CONFIG.map((cat) => {
      const items = camps.filter((c) => c.type === cat.type);
      const avgPct = items.length ? Math.round(items.reduce((s, c) => s + (Number(c.stock_pct) || 0), 0) / items.length) : 0;
      return { ...cat, items, avgPct };
    }).filter((cat) => cat.items.length > 0);
  }, [camps]);

  return (
    <>
      <PageHeader
        eyebrow={t('resources.eyebrow', 'Civic Console')}
        title={t('resources.title', 'Resource Health')}
        description={t('resources.description', 'Real-time status of civic resources across the Wari route.')}
      />
      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.type}>
            <SectionTitle title={cat.label} detail={`${cat.items.length} resource${cat.items.length !== 1 ? 's' : ''} · ${cat.avgPct}% avg health`} />
            <div className="grid gap-4 sm:grid-cols-2">
              {cat.items.map((r) => (
                <div key={r.id} className="surface p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-ink">{r.name}</p>
                    {statusBadge(r.status)}
                  </div>
                  <div className="mt-3">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${(Number(r.stock_pct) || 0) > 80 ? 'bg-emerald-500' : (Number(r.stock_pct) || 0) > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Number(r.stock_pct) || 0}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{r.zone_name || 'Unassigned'} · {Number(r.stock_pct) || 0}% health</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!categories.length && (
          <div className="surface flex flex-col items-center py-16 text-center">
            <BuildingOffice2Icon className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-base font-bold text-slate-500">No resources found</p>
            <p className="mt-1 text-sm text-slate-400">Resource data will appear here once registered.</p>
          </div>
        )}
      </div>
    </>
  );
}
