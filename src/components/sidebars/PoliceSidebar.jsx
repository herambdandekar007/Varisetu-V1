import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon, ShieldExclamationIcon, MapIcon, PhoneIcon,
  BoltIcon, ExclamationTriangleIcon, SignalIcon, UsersIcon, HeartIcon,
  ArrowPathIcon, MagnifyingGlassIcon, VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/format';
import SidebarFooter from './SidebarFooter';

const overviewItems = [
  { label: 'Command Center', to: '/controller/dashboard', icon: HomeIcon },
  { label: 'Live Map', to: '/crowd', icon: MapIcon },
  { label: 'Wari Live', to: '/wari-live', icon: VideoCameraIcon },
];

const crowdItems = [
  { label: 'Crowd Management', to: '/controller/risk-zones', icon: ShieldExclamationIcon },
  { label: 'AI Forecast', to: '/analytics', icon: BoltIcon },
];

const operationsItems = [
  { label: 'Emergency Calls', to: '/controller/emergency', icon: PhoneIcon },
  { label: 'Patrols', to: '/controller/patrols', icon: UsersIcon },
  { label: 'Barricades', to: '/controller/barricades', icon: HeartIcon },
  { label: 'Lost Persons', to: '/controller/lost-persons', icon: MagnifyingGlassIcon },
];

const decisionItems = [
  { label: 'Route Management', to: '/navigation', icon: ArrowPathIcon },
  { label: 'Broadcast Alerts', to: '/controller/dashboard', icon: SignalIcon },
];

export default function PoliceSidebar() {
  const { t } = useTranslation();

  const renderGroup = (label, items, layoutId) => (
    <div className="mb-6">
      <p className="label px-3 pb-2">{label}</p>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => cn('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 mt-1', isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-ink')}>
          {({ isActive }) => (
            <>
              {isActive && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-xl bg-blue-50" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
              <item.icon className="relative z-10 h-5 w-5" />
              <span className="relative z-10">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-slate-100 bg-white px-4 py-5 shadow-sidebar lg:flex">
      <NavLink to="/controller/dashboard" className="flex items-center gap-3 px-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-xl">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,.28)]">
          <BoltIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight text-ink">VariSetu</p>
          <p className="-mt-0.5 text-[10px] font-bold uppercase tracking-[.13em] text-blue-600">Controller</p>
        </div>
      </NavLink>
      <nav className="mt-10 space-y-1">
        {renderGroup('Overview', overviewItems, 'ctrl-nav-overview')}
        {renderGroup('Crowd', crowdItems, 'ctrl-nav-crowd')}
        {renderGroup('Operations', operationsItems, 'ctrl-nav-ops')}
        {renderGroup('Decision', decisionItems, 'ctrl-nav-decision')}
      </nav>
      <SidebarFooter />
    </aside>
  );
}
