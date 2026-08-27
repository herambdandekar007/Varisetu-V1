import { motion } from 'framer-motion';
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/solid';
import { cn } from '../../utils/format';
import Skeleton from '../common/Skeleton';

const tints = {
  orange: 'bg-saffron-50 text-saffron',
  green: 'bg-emerald-50 text-forest',
  blue: 'bg-blue-50 text-blue-600',
  red: 'bg-red-50 text-red-600',
  violet: 'bg-violet-50 text-violet-600',
};

const trendColors = {
  up: 'text-forest',
  down: 'text-slate-500',
  alert: 'text-red-600',
};

export default function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  trend,
  tone = 'orange',
  index = 0,
  loading = false,
  className,
}) {
  if (loading) {
    return (
      <div className={cn('surface p-5', className)}>
        <div className="flex items-start justify-between">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <Skeleton className="h-4 w-14 rounded-lg" />
        </div>
        <Skeleton className="mt-5 h-8 w-24 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-20 rounded-lg" />
        {helper && <Skeleton className="mt-3 h-3 w-36 rounded-lg" />}
      </div>
    );
  }

  const isPositive = trend?.direction !== 'down';

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className={cn('surface p-5 transition-shadow duration-300 hover:shadow-card-hover', className)}
    >
      <div className="flex items-start justify-between">
        <div className={cn('grid h-11 w-11 place-items-center rounded-2xl', tints[tone])}>
          {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold',
              trend.direction === 'alert'
                ? 'bg-red-50 text-red-600'
                : isPositive
                  ? 'bg-emerald-50 text-forest'
                  : 'bg-slate-50 text-slate-500',
            )}
          >
            {trend.direction === 'down' ? (
              <ArrowTrendingDownIcon className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ArrowTrendingUpIcon className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {trend.label}
          </span>
        )}
      </div>
      <p className="mt-5 text-2xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
      {helper && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-400">
          {helper}
        </p>
      )}
    </motion.article>
  );
}
