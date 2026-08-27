import { cn } from '../../utils/format';

function Radio({ label, description, name, value, checked, onChange, disabled }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all',
        'hover:border-saffron hover:bg-saffron-50',
        checked
          ? 'border-saffron bg-saffron-50 ring-1 ring-saffron'
          : 'border-slate-200 bg-white',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 shrink-0 appearance-none rounded-full border-2 border-slate-300 bg-white transition-all checked:border-[5px] checked:border-saffron checked:bg-white focus:outline-none focus:ring-4 focus:ring-saffron-200"
      />
      <div>
        {label && (
          <span className="block text-sm font-bold text-ink">{label}</span>
        )}
        {description && (
          <span className="mt-0.5 block text-xs text-slate-400">{description}</span>
        )}
      </div>
    </label>
  );
}

function RadioGroup({ name, value, onChange, options = [], direction = 'vertical', className }) {
  return (
    <div
      className={cn(
        'flex gap-3',
        direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className,
      )}
      role="radiogroup"
    >
      {options.map((opt) => (
        <Radio
          key={opt.value}
          name={name}
          value={opt.value}
          label={opt.label}
          description={opt.description}
          checked={value === opt.value}
          disabled={opt.disabled}
          onChange={() => onChange?.(opt.value)}
        />
      ))}
    </div>
  );
}

export { Radio, RadioGroup };
