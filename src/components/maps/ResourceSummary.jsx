import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';

export default function ResourceSummary() {
  const { resources } = useApp();
  
  const resourceTypes = [
    { id: 'water', label: 'Water', emoji: '🚰', resourceId: 1, color: '#1976D2' },
    { id: 'medical', label: 'Medical', emoji: '🏥', resourceId: 3, color: '#E53935' },
    { id: 'food', label: 'Food', emoji: '🍛', resourceId: 2, color: '#F9A825' },
    { id: 'toilet', label: 'Toilet', emoji: '🚻', resourceId: 5, color: '#78909C' },
  ];

  return (
    <div className="absolute bottom-4 left-4 z-[500] flex flex-col gap-2">
      {resourceTypes.map((r, i) => {
        const resource = resources.find((res) => res.id === r.resourceId);
        if (!resource) return null;
        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-xl bg-white/95 p-2.5 shadow-lg backdrop-blur border border-slate-100 min-w-[170px]"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white text-sm" style={{ background: r.color }}>
              {r.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-ink">{r.label}</p>
                <span className="text-[10px] text-slate-400">{resource.distance}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>{resource.available}%</span>
                <span>·</span>
                <span>Queue: {resource.queue}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
