import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Bell, LogOut, HelpCircle, Circle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const roleColors = {
  pilgrim: 'bg-saffron-50 text-saffron',
  volunteer: 'bg-emerald-50 text-emerald-700',
  medical: 'bg-red-50 text-red-600',
  police: 'bg-blue-50 text-blue-700',
  municipality: 'bg-purple-50 text-purple-700',
  ambulance_driver: 'bg-red-50 text-red-600',
};

export default function ProfileMenu() {
  const navigate = useNavigate();
  const { user, profile, role, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayName = user?.name || profile?.fullName || 'User';
  const initial = displayName[0]?.toUpperCase() || '?';
  const roleId = role || 'pilgrim';
  const roleLabel = { pilgrim: 'Pilgrim', volunteer: 'Volunteer', medical: 'Medical', police: 'Controller', municipality: 'Municipality', ambulance_driver: 'Ambulance Driver' }[roleId] || 'Pilgrim';

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Profile', icon: User, onClick: () => { setOpen(false); navigate('/profile'); } },
    { label: 'Settings', icon: Settings, onClick: () => { setOpen(false); navigate('/settings'); } },
    { label: 'Notifications', icon: Bell, onClick: () => { setOpen(false); } },
    { label: 'Help', icon: HelpCircle, onClick: () => { setOpen(false); } },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative grid h-9 w-9 place-items-center rounded-full bg-saffron text-xs font-bold text-white shadow-sm transition hover:bg-saffron/90 active:scale-95"
      >
        {initial.toUpperCase()}
        <span className="absolute -bottom-0.5 -right-0.5">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-1 ring-white" />
          </span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 w-56 rounded-2xl border border-slate-100 bg-white shadow-lg"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-saffron text-xs font-bold text-white">
                  {initial.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{displayName}</p>
                  <span className={`inline-block mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-bold ${roleColors[roleId]}`}>
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-1.5">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <item.icon className="h-4 w-4 text-slate-400" />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 p-1.5">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
