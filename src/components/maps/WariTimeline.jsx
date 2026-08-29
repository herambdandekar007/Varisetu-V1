import { useTranslation } from 'react-i18next';
import { routeStops } from '../../data/mockData';
import { cn } from '../../utils/format';

export default function WariTimeline() {
  const { t } = useTranslation();

  const statusColor = (status) => {
    switch (status) {
      case 'passed': return 'bg-emerald-500';
      case 'current': return 'bg-saffron';
      case 'next': return 'bg-slate-300';
      case 'planned': return 'bg-slate-200';
      default: return 'bg-slate-200';
    }
  };

  const statusLabelColor = (status) => {
    switch (status) {
      case 'passed': return 'text-emerald-600';
      case 'current': return 'text-saffron';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="overflow-x-auto px-3 py-3 bg-white border-b border-slate-100">
      <div className="flex items-center gap-0 min-w-max">
        {routeStops.map((stop, i) => (
          <div key={stop.name} className="flex items-center">
            <div className="flex flex-col items-center min-w-[80px]">
              <span className={cn('text-[10px] font-bold uppercase tracking-wider', statusLabelColor(stop.status))}>
                {stop.status === 'current' ? `● ${t('common.now')}` : stop.status === 'passed' ? '✓' : stop.time}
              </span>
              <div className={cn('mt-1 h-2.5 w-2.5 rounded-full ring-2 ring-white', statusColor(stop.status))} />
              <span className={cn(
                'mt-1 text-[11px] font-bold whitespace-nowrap',
                stop.status === 'current' ? 'text-ink' : stop.status === 'passed' ? 'text-emerald-600' : 'text-slate-400',
              )}>
                {stop.name}
              </span>
            </div>
            {i < routeStops.length - 1 && (
              <div className={cn(
                'h-0.5 w-6 sm:w-10',
                stop.status === 'passed' ? 'bg-emerald-400' : 'bg-slate-200',
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
