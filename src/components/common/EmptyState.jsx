import { cn } from '../../utils/format';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title = 'No data available',
  description = 'There is nothing to display here yet.',
  action,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {Icon && (
        <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {action && (
        <div className="mt-6">
          <Button variant="soft" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
