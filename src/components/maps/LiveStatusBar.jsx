import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';

export default function LiveStatusBar() {
  const { t } = useTranslation();
  const { wariStatus: s, activeDemo, weather } = useApp();
  const weatherText = weather ? `${weather.temperature}°C ${weather.condition}` : s.weather;
  const crowdDotColor = s.crowdStatus === 'High risk'
    ? 'bg-red-500'
    : s.crowdStatus === 'High'
      ? 'bg-orange-500'
      : s.crowdStatus === 'Moderate'
        ? 'bg-amber-400'
        : 'bg-emerald-500';
  const aiDotColor = s.aiStatus === 'Attention'
    ? 'bg-red-500'
    : s.aiStatus === 'Watch'
      ? 'bg-orange-500'
      : 'bg-emerald-500';

  return (
    <div className="relative z-[450] flex items-center gap-3 sm:gap-6 overflow-x-auto px-3 py-2 text-[11px] font-semibold text-slate-600 bg-white/90 border-b border-slate-100">
      <div className="flex items-center gap-1.5 shrink-0">
        <span>🛕</span>
        <span className="text-ink">Current:</span>
        <span className="text-saffron">{s.currentHalt}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-slate-300">↓</span>
        <span className="text-ink">Next:</span>
        <span>{s.nextHalt}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-slate-300">⏱</span>
        <span className="text-ink">ETA:</span>
        <span>{s.eta}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-slate-300">👥</span>
        <span className="text-ink">Pilgrims:</span>
        <span>{s.totalPilgrims}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-slate-300">🌤</span>
        <span>{weatherText}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${crowdDotColor}`} />
        <span>Crowd: {s.crowdStatus}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${aiDotColor}`} />
        <span>AI: {s.aiStatus}</span>
      </div>
      {activeDemo === 'crowd-simulation' && (
        <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Demo · Simulated Live</span>
        </div>
      )}
    </div>
  );
}
