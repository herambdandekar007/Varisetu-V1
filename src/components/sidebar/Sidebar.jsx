import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ChartBarIcon,
  FireIcon,
  HeartIcon,
  HomeIcon,
  MapIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/format';

const primaryNavigation = [
  { nameKey: 'nav.dashboard', to: '/dashboard', icon: HomeIcon },
  { nameKey: 'nav.crowd', to: '/crowd', icon: UserGroupIcon },
  { nameKey: 'nav.navigation', to: '/navigation', icon: MapIcon },
  { nameKey: 'nav.resources', to: '/resources', icon: WrenchScrewdriverIcon },
  { nameKey: 'nav.tracking', to: '/tracking', icon: UserIcon },
  { nameKey: 'nav.wariLive', to: '/wari-live', icon: VideoCameraIcon },
];

const controlNavigation = [
  { nameKey: 'nav.emergency', to: '/emergency', icon: ShieldExclamationIcon },
  { nameKey: 'nav.analytics', to: '/analytics', icon: ChartBarIcon },
  { nameKey: 'nav.admin', to: '/admin', icon: FireIcon },
  { nameKey: 'nav.volunteer', to: '/volunteer', icon: HeartIcon },
];

function NavItems({ items, t }) {
  return items.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
          'outline-none focus-visible:ring-2 focus-visible:ring-saffron-200 focus-visible:ring-offset-2',
          isActive
            ? 'bg-saffron-50 text-saffron'
            : 'text-slate-500 hover:bg-slate-50 hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-xl bg-saffron-50"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <item.icon className="relative z-10 h-5 w-5" aria-hidden="true" />
          <span className="relative z-10">{t(item.nameKey)}</span>
          {item.nameKey === 'nav.emergency' && (
            <span className="relative z-10 ml-auto h-2 w-2 rounded-full bg-red-500" aria-label="Active alerts" />
          )}
        </>
      )}
    </NavLink>
  ));
}

export default function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-slate-100 bg-white px-4 py-5 shadow-sidebar lg:flex"
      aria-label={t('nav.pilgrimServices')}
    >
      <NavLink
        to="/"
        className="flex items-center gap-3 px-2 outline-none focus-visible:ring-2 focus-visible:ring-saffron-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-xl"
      >
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-saffron text-lg font-bold text-white shadow-[0_8px_20px_rgba(255,122,0,.28)]" aria-hidden="true">
          व
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight text-ink">{t('app.name')}</p>
          <p className="-mt-0.5 text-[10px] font-bold uppercase tracking-[.13em] text-forest">{t('app.tagline')}</p>
        </div>
      </NavLink>

      <nav className="mt-10 space-y-1" aria-label={t('nav.pilgrimServices')}>
        <p className="label px-3 pb-2">{t('nav.pilgrimServices')}</p>
        <NavItems items={primaryNavigation} t={t} />
      </nav>

      <nav className="mt-7 space-y-1" aria-label={t('nav.controlRoom')}>
        <p className="label px-3 pb-2">{t('nav.controlRoom')}</p>
        <NavItems items={controlNavigation} t={t} />
      </nav>

      <NavLink
        to="/accessibility"
        className={({ isActive }) =>
          cn(
            'mt-auto rounded-2xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-saffron-200 focus-visible:ring-offset-2',
            isActive ? 'bg-forest-50 ring-2 ring-forest-200' : 'bg-[#EEF7F0] hover:bg-[#e2f1e6]',
          )
        }
      >
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-forest">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white" aria-hidden="true">Aa</span>
            {t('nav.accessibility')}
          </div>
          <p className="mt-2 text-xs leading-5 text-emerald-700/75">
            {t('nav.accessibilityDesc')}
          </p>
        </div>
      </NavLink>
    </aside>
  );
}

export function MobileNavigation() {
  const { t } = useTranslation();

  return (
    <motion.nav
      initial={{ y: 70 }}
      animate={{ y: 0 }}
      className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around gap-1 rounded-2xl border border-white/60 bg-white/95 px-1 py-2 shadow-float backdrop-blur lg:hidden"
      aria-label={t('nav.pilgrimServices')}
    >
      {primaryNavigation.slice(0, 4).map((item) => (
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
