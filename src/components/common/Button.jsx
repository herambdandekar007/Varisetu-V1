import { motion } from 'framer-motion';
import { cn } from '../../utils/format';

const variants = {
  primary:
    'bg-saffron text-white shadow-[0_8px_20px_rgba(255,122,0,.25)] hover:bg-saffron-600 active:bg-saffron-700',
  secondary:
    'bg-forest text-white shadow-[0_8px_20px_rgba(0,140,69,.2)] hover:bg-forest-600 active:bg-forest-700',
  soft: 'bg-saffron-50 text-saffron hover:bg-saffron-100 active:bg-saffron-200',
  outline:
    'border border-slate-200 bg-white text-slate-700 hover:border-saffron hover:text-saffron active:bg-saffron-50',
  ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  danger:
    'bg-red-600 text-white shadow-[0_8px_20px_rgba(220,38,38,.2)] hover:bg-red-700 active:bg-red-800',
};

export default function Button({
  children,
  className,
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled = false,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { y: -1 } : {}}
      whileTap={!isDisabled ? { scale: 0.97 } : {}}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all outline-none',
        'focus-visible:ring-4 focus-visible:ring-saffron-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        isDisabled && 'cursor-not-allowed opacity-50 hover:!transform-none',
        variants[variant],
        className,
      )}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : Icon ? (
        <Icon className="h-4 w-4" aria-hidden="true" />
      ) : null}
      {children}
    </motion.button>
  );
}
