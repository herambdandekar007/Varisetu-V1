import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const items = [
  { groupKey: 'crowd', items: [
    { labelKey: 'low', color: '#008C45' },
    { labelKey: 'moderate', color: '#F4B400' },
    { labelKey: 'high', color: '#E85D04' },
    { labelKey: 'severe', color: '#B71C1C' },
  ]},
  { groupKey: 'resources', items: [
    { labelKey: 'water', emoji: '🚰' },
    { labelKey: 'medical', emoji: '🏥' },
    { labelKey: 'food', emoji: '🍛' },
    { labelKey: 'toilet', emoji: '🚻' },
    { labelKey: 'parking', emoji: '🅿' },
    { labelKey: 'rest', emoji: '🏕' },
  ]},
  { groupKey: 'safety', items: [
    { labelKey: 'police', emoji: '👮' },
    { labelKey: 'ambulance', emoji: '🚑' },
    { labelKey: 'emergency', emoji: '⚠' },
  ]},
  { groupKey: 'route', items: [
    { labelKey: 'palkhi', emoji: '🛕' },
    { labelKey: 'family', emoji: '👨‍👩‍👧' },
    { labelKey: 'safeRoute', color: '#008C45' },
  ]},
];

export default function MapLegend() {
  const { t } = useTranslation();
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
          title={t(collapsed ? 'map.showLegend' : 'map.hideLegend')}
        >
          {!collapsed && <span>{t('map.legend')}</span>}
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
                <div key={group.groupKey}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t(`map.legendGroups.${group.groupKey}`)}</p>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    {group.items.map((item) => (
                      <span key={item.labelKey} className="flex items-center gap-1 text-[10px] text-slate-500">
                        {item.emoji ? (
                          <span className="text-xs">{item.emoji}</span>
                        ) : (
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        )}
                        {t(`map.legendItems.${item.labelKey}`)}
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
