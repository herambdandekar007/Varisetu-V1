import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon, BuildingOffice2Icon, TruckIcon, CloudIcon, ChartBarIcon, VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/format';
import SidebarFooter from './SidebarFooter';

const navItems = [
  { label: 'Dashboard', to: '/municipality/dashboard', icon: HomeIcon },
  { label: 'Resource Health', to: '/municipality/resources', icon: BuildingOffice2Icon },
  { label: 'Supply Vehicles', to: '/municipality/supply', icon: TruckIcon },
  { label: 'Weather', to: '/municipality/weather', icon: CloudIcon },
  { label: 'AI Forecast', to: '/municipality/forecast', icon: ChartBarIcon },
  { label: 'Wari Live', to: '/wari-live', icon: VideoCameraIcon },
];

export default function MunicipalitySidebar() {
  const { t } = useTranslation();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-slate-100 bg-white px-4 py-5 shadow-sidebar lg:flex">
      <NavLink to="/municipality/dashboard" className="flex items-center gap-3 px-2 outline-none focus-visible:ring-2 focus-visible:ring-purple-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-xl">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-600 text-lg font-bold text-white shadow-[0_8px_20px_rgba(147,51,234,.28)]">ना</div>
        <div>
          <p className="text-lg font-bold tracking-tight text-ink">VariSetu</p>
          <p className="-mt-0.5 text-[10px] font-bold uppercase tracking-[.13em] text-purple-600">Municipality</p>
        </div>
      </NavLink>
      <nav className="mt-10 space-y-1">
        <p className="label px-3 pb-2">Civic Console</p>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => cn('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-purple-200 focus-visible:ring-offset-2', isActive ? 'bg-purple-50 text-purple-700' : 'text-slate-500 hover:bg-slate-50 hover:text-ink')}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="mun-nav" className="absolute inset-0 rounded-xl bg-purple-50" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                <item.icon className="relative z-10 h-5 w-5" />
                <span className="relative z-10">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <SidebarFooter />
    </aside>
  );
}
