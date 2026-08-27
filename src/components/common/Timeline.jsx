import { cn } from '../../utils/format';

export default function Timeline({ items, compact = false }) {
  if (!items || items.length === 0) return null;

  return (
    <ol className={cn('relative border-l border-slate-200', compact ? 'ml-2 space-y-4' : 'ml-3 space-y-5')}>
      {items.map((item, index) => {
        const key = item.title || item.name || index;
        return (
          <li className="ml-5" key={`${key}-${index}`}>
            <span
              className={cn(
                'absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white',
                item.tone || 'bg-saffron',
              )}
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">{item.title || item.name}</p>
              {item.time && (
                <time className="text-xs font-semibold text-slate-400">{item.time}</time>
              )}
            </div>
            {(item.detail || item.status) && (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {item.detail || item.status}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
