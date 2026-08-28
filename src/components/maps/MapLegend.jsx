import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const items = [
  { group: 'Crowd', items: [
    { label: 'Low', color: '#008C45' },
    { label: 'Moderate', color: '#F4B400' },
    { label: 'High', color: '#E85D04' },
    { label: 'Severe', color: '#B71C1C' },
  ]},
  { group: 'Resources', items: [
    { label: 'Water', emoji: '🚰' },
    { label: 'Medical', emoji: '🏥' },
    { label: 'Food', emoji: '🍛' },
    { label: 'Toilet', emoji: '🚻' },
    { label: 'Parking', emoji: '🅿' },
    { label: 'Rest', emoji: '🏕' },
  ]},
  { group: 'Safety', items: [
    { label: 'Police', emoji: '👮' },
    { label: 'Ambulance', emoji: '🚑' },
    { label: 'Emergency', emoji: '⚠' },
  ]},
  { group: 'Route', items: [
    { label: 'Palkhi', emoji: '🛕' },
    { label: 'Family', emoji: '👨‍👩‍👧' },
    { label: 'Safe Route', color: '#008C45' },
  ]},
];

export default function MapLegend() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="absolute bottom-4 left-4 z-[400] max-h-[calc(100%-8rem)]">
      <motion.div
        animate={{ width: collapsed ? 36 : 190 }}
        className="rounded-xl border border-slate-100 bg-white/95 shadow-lg backdrop-blur overflow-hidden"
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400 hover:text-ink transition-colors"
          title={collapsed ? 'Show legend' : 'Hide legend'}
        >
          {!collapsed && <span>Legend</span>}
          <span className="text-xs">{collapsed ? '🏷' : '−'}</span>
        </button>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-3 pb-3 space-y-2 max-h-[50vh] overflow-y-auto"
            >
              {items.map((group) => (
                <div key={group.group}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">{group.group}</p>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    {group.items.map((item) => (
                      <span key={item.label} className="flex items-center gap-1 text-[10px] text-slate-500">
                        {item.emoji ? (
                          <span className="text-xs">{item.emoji}</span>
                        ) : (
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        )}
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
