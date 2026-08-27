import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/format';

export default function Select({
  label,
  error,
  hint,
  options = [],
  placeholder,
  className,
  wrapperClassName,
  required,
  disabled,
  ...props
}) {
  const id = props.id || props.name;

  return (
    <div className={cn('space-y-1.5', wrapperClassName)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-bold text-ink">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            'block w-full appearance-none rounded-xl border bg-white px-4 py-2.5 pr-10 text-sm text-ink transition-all',
            'focus:outline-none focus:ring-4 focus:ring-saffron-200 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-slate-200 focus:border-saffron',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
          <ChevronDownIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-red-500" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}
