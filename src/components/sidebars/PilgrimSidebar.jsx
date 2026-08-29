import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ChartBarIcon, HomeIcon, MapIcon, ShieldExclamationIcon,
  UserGroupIcon, UserIcon, WrenchScrewdriverIcon, HeartIcon,
  MagnifyingGlassIcon, BuildingOffice2Icon, HomeModernIcon,
  BellIcon, TruckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/format';
import { useApp } from '../../context/AppContext';
import SidebarFooter from './SidebarFooter';

const journeyItems = [
  { labelKey: 'nav.crowd', to: '/crowd', icon: UserGroupIcon },
  { labelKey: 'nav.navigation', to: '/navigation', icon: MapIcon },
];

const servicesItems = [
  { labelKey: 'sidebar.resources', to: '/resources', icon: WrenchScrewdriverIcon },
  { labelKey: 'sidebar.healthCheck', to: '/health', icon: HeartIcon },
  { labelKey: 'sidebar.placesToStay', to: '/stay', icon: HomeModernIcon },
  { labelKey: 'sidebar.medicalCamps', to: '/emergency', icon: BuildingOffice2Icon },
  { labelKey: 'sidebar.myGroup', to: '/group', icon: UserGroupIcon },
  { labelKey: 'sidebar.familyAndPalkhi', to: '/tracking', icon: UserIcon },
];

const safetyItems = [
  { labelKey: 'sidebar.alerts', to: '/alerts', icon: BellIcon },
  { labelKey: 'nav.emergency', to: '/emergency', icon: ShieldExclamationIcon },
];

const ambulanceItems = [
  { labelKey: 'sidebar.ambulanceStatus', to: '/ambulance/status', icon: TruckIcon },
];

export default function PilgrimSidebar() {
  const { t } = useTranslation();
  const { groupSeparationActive } = useApp();

  const renderGroup = (label, items, layoutId) => (
    <div className="mb-6">
      <p className="label px-3 pb-2">{label}</p>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => cn('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-saffron-200 focus-visible:ring-offset-2 mt-1', isActive ? 'bg-saffron-50 text-saffron' : 'text-slate-500 hover:bg-slate-50 hover:text-ink')}>
          {({ isActive }) => (
            <>
              {isActive && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-xl bg-saffron-50" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
              <item.icon className="relative z-10 h-5 w-5" />
              <span className="relative z-10">{t(item.labelKey)}</span>
              {((item.to === '/emergency') || (item.to === '/group' && groupSeparationActive)) && (
                <span className="relative z-10 ml-auto h-2 w-2 rounded-full bg-red-500" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-slate-100 bg-white px-4 py-5 shadow-sidebar lg:flex">
      <NavLink to="/dashboard" className="flex items-center gap-3 px-2 outline-none focus-visible:ring-2 focus-visible:ring-saffron-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-xl">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-saffron text-lg font-bold text-white shadow-[0_8px_20px_rgba(255,122,0,.28)]">
          व
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight text-ink">{t('app.name')}</p>
          <p className="-mt-0.5 text-[10px] font-bold uppercase tracking-[.13em] text-forest">{t('app.tagline')}</p>
        </div>
      </NavLink>

      <nav className="mt-10 space-y-1">
        <div className="mb-2">
          <p className="label px-3 pb-2">{t('sidebar.myJourney')}</p>
          <NavLink to="/dashboard" className={({ isActive }) => cn('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-saffron-200 focus-visible:ring-offset-2 mt-1', isActive ? 'bg-saffron-50 text-saffron' : 'text-slate-500 hover:bg-slate-50 hover:text-ink')}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="pilgrim-dashboard" className="absolute inset-0 rounded-xl bg-saffron-50" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                <HomeIcon className="relative z-10 h-5 w-5" />
                <span className="relative z-10">{t('nav.dashboard')}</span>
              </>
            )}
          </NavLink>
        </div>

        {renderGroup(t('sidebar.journey'), journeyItems, 'pilgrim-journey')}
        {renderGroup(t('sidebar.ambulance'), ambulanceItems, 'pilgrim-ambulance')}
        {renderGroup(t('sidebar.servicesAndCamps'), servicesItems, 'pilgrim-services')}
        {renderGroup(t('sidebar.safetyCenter'), safetyItems, 'pilgrim-safety')}
      </nav>

      <SidebarFooter />
    </aside>
  );
}
