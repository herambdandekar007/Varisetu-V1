import { motion } from 'framer-motion';
import { cn } from '../../utils/format';

export default function Toggle({
  label,
  description,
  checked = false,
  onChange,
  disabled,
  className,
  ...props
}) {
  const id = props.id || props.name;

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-saffron-200 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-saffron' : 'bg-slate-200',
        )}
      >
        <motion.span
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="inline-block h-5 w-5 rounded-full bg-white shadow-sm"
        />
      </button>
      {(label || description) && (
        <div className="select-none">
          {label && (
            <label
              htmlFor={id}
              className="text-sm font-bold text-ink"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-slate-400">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
