import { cn } from '../../utils/format';

function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />;
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn('surface p-5', className)}>
      <div className="flex items-start justify-between">
        <Skeleton className="h-11 w-11 rounded-2xl" />
        <Skeleton className="h-4 w-16 rounded-lg" />
      </div>
      <Skeleton className="mt-5 h-8 w-32 rounded-lg" />
      <Skeleton className="mt-2 h-4 w-24 rounded-lg" />
      <Skeleton className="mt-4 h-px w-full" />
      <Skeleton className="mt-3 h-3 w-40 rounded-lg" />
    </div>
  );
}

export function SkeletonMetric({ className }) {
  return (
    <div className={cn('surface p-5', className)}>
      <div className="flex items-start justify-between">
        <Skeleton className="h-11 w-11 rounded-2xl" />
        <Skeleton className="h-4 w-14 rounded-lg" />
      </div>
      <Skeleton className="mt-5 h-8 w-24 rounded-lg" />
      <Skeleton className="mt-2 h-4 w-20 rounded-lg" />
      <Skeleton className="mt-3 h-3 w-36 rounded-lg" />
    </div>
  );
}

export function SkeletonChart({ className }) {
  return (
    <div className={cn('surface p-5', className)}>
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-4 w-28 rounded-lg" />
          <Skeleton className="mt-1 h-3 w-20 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-[250px] w-full rounded-2xl" />
    </div>
  );
}

export function SkeletonTable({ rows = 4, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-4">
        <Skeleton className="h-4 flex-1 rounded-lg" />
        <Skeleton className="h-4 w-20 rounded-lg" />
        <Skeleton className="h-4 w-24 rounded-lg" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-20 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-1/2 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage({ className }) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="mt-2 h-8 w-72 rounded-lg" />
          <Skeleton className="mt-2 h-4 w-56 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonMetric key={i} />
        ))}
      </div>
      <div className="grid gap-6 2xl:grid-cols-[1.35fr_0.65fr]">
        <SkeletonChart />
        <SkeletonCard />
      </div>
    </div>
  );
}

export default Skeleton;
