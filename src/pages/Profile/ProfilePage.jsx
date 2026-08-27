import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightOnRectangleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const roleColors = {
  pilgrim: 'bg-saffron-50 text-saffron',
  volunteer: 'bg-emerald-50 text-emerald-700',
  medical: 'bg-red-50 text-red-600',
  police: 'bg-blue-50 text-blue-700',
  municipality: 'bg-purple-50 text-purple-700',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, role, logout } = useAuth();
  const roleId = (typeof role === 'string' ? role : role?.id) || 'pilgrim';
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.name || 'User';
  const initial = displayName[0]?.toUpperCase() || '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
      <div className="surface overflow-hidden">
        <div className="bg-gradient-to-r from-saffron-50 to-forest-50 px-8 pb-20 pt-10">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-white text-3xl font-bold text-saffron shadow-lg">
            {initial}
          </div>
        </div>
        <div className="-mt-12 px-8 pb-8 text-center">
          <h1 className="text-2xl font-bold text-ink">{displayName}</h1>
          <p className="mt-1 text-sm text-slate-500">{user?.email || 'No email'}</p>
          <span className={`mt-3 inline-block rounded-full px-4 py-1 text-xs font-bold ${roleColors[roleId]}`}>
            {role || 'Pilgrim'}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="surface p-5">
          <p className="label mb-3">Contact</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-400">Phone</span><span className="font-medium text-ink">{profile?.phone || user?.phone || '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Email</span><span className="font-medium text-ink">{user?.email || '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Language</span><span className="font-medium text-ink">{profile?.language === 'mr' ? 'मराठी' : profile?.language === 'hi' ? 'हिंदी' : 'English'}</span></div>
          </div>
        </div>
        <div className="surface p-5">
          <p className="label mb-3">Emergency</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-400">Contact</span><span className="font-medium text-ink">{profile?.emergencyContact || '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">District</span><span className="font-medium text-ink">{profile?.district || '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Medical</span><span className="font-medium text-ink">{profile?.medicalConditions || 'None reported'}</span></div>
          </div>
        </div>
      </div>

      <div className="surface p-5">
        <p className="label mb-3">Accessibility</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink">Accessibility Mode</span>
          <span className={`rounded-lg px-3 py-1 text-xs font-bold ${profile?.accessibility ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{profile?.accessibility ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" icon={PencilIcon} onClick={() => navigate('/settings')}>Edit Profile</Button>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2">
          <span className="text-sm font-bold text-slate-500">Language:</span>
          <LanguageSwitcher />
        </div>
        <Button variant="danger" icon={ArrowRightOnRectangleIcon} onClick={handleLogout}>Sign Out</Button>
      </div>
    </motion.div>
  );
}
