import { motion, AnimatePresence } from 'framer-motion';

const layers = [
  { id: 'crowd', label: 'Crowd', emoji: '👥', defaultOn: true },
  { id: 'resources', label: 'Resources', emoji: '📦', defaultOn: true },
  { id: 'medical', label: 'Medical', emoji: '🏥', defaultOn: true },
  { id: 'police', label: 'Police', emoji: '👮', defaultOn: true },
  { id: 'parking', label: 'Parking', emoji: '🅿', defaultOn: false },
  { id: 'food', label: 'Food', emoji: '🍛', defaultOn: true },
  { id: 'toilets', label: 'Toilets', emoji: '🚻', defaultOn: false },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧', defaultOn: false },
  { id: 'palkhi', label: 'Palkhi', emoji: '🛕', defaultOn: true },
  { id: 'weather', label: 'Weather', emoji: '🌤', defaultOn: false },
];

export default function LayersPanel({ open, onClose, activeLayers, onToggleLayer }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="absolute left-4 top-4 z-[500] w-44 rounded-xl border border-slate-100 bg-white/95 p-3 shadow-lg backdrop-blur"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Layers</p>
            <button onClick={onClose} className="text-xs text-slate-400 hover:text-ink">✕</button>
          </div>
          <div className="space-y-1.5">
            {layers.map((layer) => {
              const isOn = activeLayers[layer.id] !== undefined ? activeLayers[layer.id] : layer.defaultOn;
              return (
                <label key={layer.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={() => onToggleLayer(layer.id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-saffron accent-saffron"
                  />
                  <span className="text-xs text-slate-600">{layer.emoji} {layer.label}</span>
                </label>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
