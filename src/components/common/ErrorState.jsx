import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/format';
import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-500">
        <ExclamationTriangleIcon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
