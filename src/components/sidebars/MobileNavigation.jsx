import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon, MapIcon, UserGroupIcon, WrenchScrewdriverIcon,
  ClipboardDocumentCheckIcon, PhoneIcon, HeartIcon, BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/format';

const navByRole = {
  pilgrim: [
    { nameKey: 'nav.dashboard', to: '/dashboard', icon: HomeIcon },
    { nameKey: 'nav.crowd', to: '/crowd', icon: UserGroupIcon },
    { nameKey: 'nav.navigation', to: '/navigation', icon: MapIcon },
    { nameKey: 'nav.resources', to: '/resources', icon: WrenchScrewdriverIcon },
  ],
  volunteer: [
    { nameKey: 'nav.dashboard', to: '/volunteer/dashboard', icon: HomeIcon },
    { nameKey: 'nav.tasks', to: '/volunteer/tasks', icon: ClipboardDocumentCheckIcon },
    { nameKey: 'nav.crowd', to: '/crowd', icon: UserGroupIcon },
    { nameKey: 'nav.emergency', to: '/volunteer/requests', icon: PhoneIcon },
  ],
  police: [
    { nameKey: 'nav.dashboard', to: '/controller/dashboard', icon: HomeIcon },
    { nameKey: 'nav.crowd', to: '/crowd', icon: UserGroupIcon },
    { nameKey: 'nav.emergency', to: '/controller/emergency', icon: PhoneIcon },
    { nameKey: 'nav.patrols', to: '/controller/patrols', icon: UserGroupIcon },
  ],
  medical: [
    { nameKey: 'nav.dashboard', to: '/medical/dashboard', icon: HomeIcon },
    { nameKey: 'nav.cases', to: '/medical/cases', icon: HeartIcon },
    { nameKey: 'nav.camps', to: '/medical/camps', icon: WrenchScrewdriverIcon },
    { nameKey: 'nav.ambulances', to: '/medical/ambulances', icon: PhoneIcon },
  ],
  municipality: [
    { nameKey: 'nav.dashboard', to: '/municipality/dashboard', icon: HomeIcon },
    { nameKey: 'nav.resources', to: '/municipality/resources', icon: BuildingStorefrontIcon },
    { nameKey: 'nav.weather', to: '/municipality/weather', icon: WrenchScrewdriverIcon },
    { nameKey: 'nav.crowd', to: '/crowd', icon: UserGroupIcon },
  ],
};

export default function MobileNavigation() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const roleId = role || 'pilgrim';
  const items = navByRole[roleId] || navByRole.pilgrim;

  return (
    <motion.nav
      initial={{ y: 70 }}
      animate={{ y: 0 }}
      className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around gap-1 rounded-2xl border border-white/60 bg-white/95 px-1 py-2 shadow-float backdrop-blur lg:hidden"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition-colors',
              isActive ? 'text-saffron' : 'text-slate-400 hover:text-slate-600',
            )
          }
        >
          <item.icon className="h-5 w-5" aria-hidden="true" />
          {t(item.nameKey).split(' ')[0]}
        </NavLink>
      ))}
    </motion.nav>
  );
}
