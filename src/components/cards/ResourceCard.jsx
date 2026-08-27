import { BeakerIcon, BuildingStorefrontIcon, HeartIcon, HomeModernIcon } from '@heroicons/react/24/outline';
import Badge from '../common/Badge';
import { cn } from '../../utils/format';

const icons = {
  water: BeakerIcon,
  food: BuildingStorefrontIcon,
  medical: HeartIcon,
  rest: HomeModernIcon,
};

const colors = {
  blue: 'bg-blue-50 text-blue-600',
  orange: 'bg-saffron-50 text-saffron',
  red: 'bg-red-50 text-red-600',
  green: 'bg-emerald-50 text-forest',
};

export default function ResourceCard({ resource, compact = false }) {
  const Icon = icons[resource?.icon] || BeakerIcon;
  const isLow = resource?.available < 55;

  return (
    <article className={cn(
      'transition-shadow duration-300 hover:shadow-card-hover',
      compact
        ? 'rounded-2xl border border-slate-100 bg-white p-4 hover:border-slate-200'
        : 'surface p-5',
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
          colors[resource?.tone] || colors.blue,
        )}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-ink">{resource?.name}</h3>
              <p className="mt-0.5 text-xs text-slate-400">{resource?.area}</p>
            </div>
            <Badge tone={isLow ? 'orange' : 'green'}>{resource?.available}%</Badge>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn('h-full rounded-full transition-all duration-500', isLow ? 'bg-saffron' : 'bg-forest')}
              style={{ width: `${resource?.available || 0}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">{resource?.amount}</span>
            <span className="text-slate-400">{resource?.note}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
