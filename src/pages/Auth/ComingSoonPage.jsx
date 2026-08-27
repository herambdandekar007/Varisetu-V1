import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';

const roleLabels = {
  volunteer: 'Volunteer',
  medical: 'Medical',
  police: 'Police / Security',
  municipality: 'Municipality',
};

export default function ComingSoonPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { logout } = useAuth();
  const role = params.get('role') || 'volunteer';
  const label = roleLabels[role] || role;

  return (
    <AuthLayout
      title={`${label} Portal`}
      subtitle="This role is coming soon — we're building it for Wari 2026."
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm"
      >
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-saffron/10">
          <Construction className="h-7 w-7 text-saffron" />
        </div>
        <h3 className="mt-5 text-lg font-bold text-ink">Under Construction</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          The {label.toLowerCase()} experience is being designed. You'll get access as soon as it's ready.
        </p>

        <div className="mt-8 space-y-3 w-full">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(249,115,22,.35)] transition hover:bg-saffron/90"
          >
            Continue as Pilgrim
          </button>
          <button
            type="button"
            onClick={() => { logout(); navigate('/'); }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
