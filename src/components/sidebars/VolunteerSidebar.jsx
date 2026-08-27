import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ClipboardDocumentListIcon, HeartIcon, HomeIcon, MapPinIcon, UserIcon, UserGroupIcon,
  ExclamationTriangleIcon, ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/format';
import SidebarFooter from './SidebarFooter';

const fieldItems = [
  { label: 'My Tasks', to: '/volunteer/tasks', icon: ClipboardDocumentCheckIcon },
  { label: 'Incident Map', to: '/volunteer/zone', icon: MapPinIcon },
  { label: 'Nearby Pilgrims', to: '/volunteer/pilgrims', icon: UserGroupIcon },
  { label: 'Emergency Requests', to: '/volunteer/requests', icon: ExclamationTriangleIcon },
];

const accountItems = [
  { label: 'Profile', to: '/profile', icon: UserIcon },
];

export default function VolunteerSidebar() {
  const { t } = useTranslation();

  const renderGroup = (label, items, layoutId) => (
    <div className="mb-6">
      <p className="label px-3 pb-2">{label}</p>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => cn('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 mt-1', isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-ink')}>
          {({ isActive }) => (
            <>
              {isActive && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-xl bg-emerald-50" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
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
      <NavLink to="/volunteer/dashboard" className="flex items-center gap-3 px-2 outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-xl">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 text-lg font-bold text-white shadow-[0_8px_20px_rgba(0,140,69,.28)]">
          <HeartIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight text-ink">VariSetu</p>
          <p className="-mt-0.5 text-[10px] font-bold uppercase tracking-[.13em] text-emerald-600">Volunteer</p>
        </div>
      </NavLink>

      <nav className="mt-10 space-y-1">
        <div className="mb-2">
          <p className="label px-3 pb-2">Dashboard</p>
          <NavLink to="/volunteer/dashboard" className={({ isActive }) => cn('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 mt-1', isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-ink')}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="vol-dashboard" className="absolute inset-0 rounded-xl bg-emerald-50" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                <HomeIcon className="relative z-10 h-5 w-5" />
                <span className="relative z-10">Dashboard</span>
              </>
            )}
          </NavLink>
        </div>

        {renderGroup('Field Operations', fieldItems, 'vol-field')}
        {renderGroup('Account', accountItems, 'vol-account')}
      </nav>

      <SidebarFooter />
    </aside>
  );
}
