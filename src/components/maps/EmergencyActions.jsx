import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const actions = [
  { id: 'medical', emoji: '🚑', route: '/emergency', color: 'bg-red-500' },
  { id: 'sos', emoji: '⚠', route: '/emergency', color: 'bg-orange-500' },
  { id: 'lost', emoji: '👨', route: '/emergency', color: 'bg-blue-500' },
  { id: 'contacts', emoji: '☎', route: '/emergency', color: 'bg-emerald-500' },
];

export default function EmergencyActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="absolute bottom-4 right-4 z-[500] flex flex-col gap-2">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(action.route)}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-lg ${action.color} hover:opacity-90 transition-opacity`}
        >
          <span className="text-sm">{action.emoji}</span>
          <span className="hidden sm:inline">{t(`map.emergencyActions.${action.id}`)}</span>
        </motion.button>
      ))}
    </div>
  );
}
