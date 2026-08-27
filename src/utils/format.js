export const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(value);

export const formatDistance = (value) => `${value.toFixed(1)} km`;

export const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const formatPercent = (value) => `${Math.round(value)}%`;

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const getUrgencyColor = (level) => {
  const map = { high: 'red', medium: 'orange', low: 'green', critical: 'red' };
  return map[level] || 'slate';
};

export const getDensityColor = (density) => {
  const map = {
    high: 'bg-saffron text-white',
    moderate: 'bg-yellow-400 text-ink',
    low: 'bg-forest text-white',
    rising: 'bg-orange-500 text-white',
  };
  return map[density] || 'bg-slate-100 text-slate-600';
};
