import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, User, Radio, ShieldCheck, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getHomeRoute } from '../../routes/roleRoutes';
import AuthLayout from './AuthLayout';

const roles = [
  {
    id: 'pilgrim', label: 'Pilgrim',
    desc: 'Track your route, find resources, stay safe throughout the Wari.',
    icon: User, color: 'bg-orange-50 text-saffron',
  },
  {
    id: 'police', label: 'Controller',
    desc: 'See risk across the Wari, make decisions, and coordinate field response.',
    icon: Radio, color: 'bg-emerald-50 text-forest',
  },
  {
    id: 'volunteer', label: 'Volunteer',
    desc: 'Accept field tasks, respond to incidents, and report action on the route.',
    icon: ShieldCheck, color: 'bg-emerald-50 text-forest',
  },
  {
    id: 'ambulance_driver', label: 'Ambulance Driver',
    desc: 'Drive emergency ambulances, set your status, and route to hospitals during the Wari.',
    icon: Truck, color: 'bg-red-50 text-red-600',
  },
];

export default function SelectRolePage() {
  const navigate = useNavigate();
  const { selectRole, role } = useAuth();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role) {
      navigate(getHomeRoute(role), { replace: true });
    }
  }, [role, navigate]);

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    selectRole(selected.id);
    setLoading(false);
    navigate(getHomeRoute(selected.id));
  };

  const progress = 100;

  return (
    <AuthLayout title="Choose your role" subtitle="Select how you'll experience the Wari">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="text-saffron">Registration</span>
          <span className="text-saffron">Profile</span>
          <span className="text-saffron">Role</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-saffron transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {roles.map((role, i) => {
          const isSelected = selected?.id === role.id;
          const Icon = role.icon;
          return (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              type="button"
              onClick={() => setSelected(role)}
              className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition ${
                isSelected
                  ? 'border-saffron bg-saffron/5 shadow-[0_0_0_3px_rgba(249,115,22,.12)]'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${role.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">{role.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{role.desc}</p>
              </div>
              {isSelected && (
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-saffron">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <p className="mt-6 px-2 text-center text-xs leading-relaxed text-slate-400">
        Medical, police and municipality modules are preserved for later operational integration.
      </p>

      <button
        type="button" disabled={!selected || loading}
        onClick={handleSubmit}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron py-3.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(249,115,22,.35)] transition hover:bg-saffron/90 disabled:opacity-60"
      >
        {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>Get Started <ArrowRight className="h-4 w-4" /></>}
      </button>
    </AuthLayout>
  );
}
