import { forwardRef } from 'react';
import { cn } from '../../utils/format';

const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    hint,
    maxLength,
    showCount,
    className,
    wrapperClassName,
    required,
    disabled,
    value = '',
    ...props
  },
  ref,
) {
  const id = props.id || props.name;

  return (
    <div className={cn('space-y-1.5', wrapperClassName)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-bold text-ink">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          'block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-ink transition-all',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-4 focus:ring-saffron-200 focus:ring-offset-0',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
          'min-h-[100px] resize-y',
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
            : 'border-slate-200 focus:border-saffron',
          className,
        )}
        value={value}
        {...props}
      />
      <div className="flex items-center justify-between">
        <div>
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
        {showCount && maxLength && (
          <p className="text-xs text-slate-400">
            {String(value).length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

export default Textarea;
