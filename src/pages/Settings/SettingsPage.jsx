import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Toggle from '../../components/common/Toggle';
import Button from '../../components/common/Button';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { isAccessibilityMode, setIsAccessibilityMode } = useApp();
  const [notifications, setNotifications] = useState({
    email: true, push: true, sms: false, emergency: true,
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">Manage your preferences and account settings.</p>
      </div>

      <div className="surface p-5">
        <p className="label mb-4">Language</p>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </div>

      <div className="surface p-5">
        <Toggle
          label="Accessibility Mode"
          description="Larger touch targets, high contrast, screen reader support"
          checked={isAccessibilityMode}
          onChange={setIsAccessibilityMode}
        />
      </div>

      <div className="surface p-5">
        <p className="label mb-4">Notification Preferences</p>
        <div className="space-y-4">
          <Toggle
            label="Email Notifications"
            description="Receive updates via email"
            checked={notifications.email}
            onChange={(v) => setNotifications((p) => ({ ...p, email: v }))}
          />
          <Toggle
            label="Push Notifications"
            description="Receive real-time alerts on your device"
            checked={notifications.push}
            onChange={(v) => setNotifications((p) => ({ ...p, push: v }))}
          />
          <Toggle
            label="SMS Alerts"
            description="Critical updates via text message"
            checked={notifications.sms}
            onChange={(v) => setNotifications((p) => ({ ...p, sms: v }))}
          />
          <Toggle
            label="Emergency Alerts"
            description="Instant notifications for emergencies"
            checked={notifications.emergency}
            onChange={(v) => setNotifications((p) => ({ ...p, emergency: v }))}
          />
        </div>
      </div>

      <div className="surface p-5">
        <p className="label mb-3">Privacy</p>
        <p className="text-sm text-slate-500">
          Your data is stored locally on this device. No information is shared with external servers.
          You can clear all data by signing out.
        </p>
        <div className="mt-4">
          <Button variant="danger" onClick={() => { logout(); navigate('/login'); toast.success('Signed out successfully.'); }}>Clear All Local Data</Button>
        </div>
      </div>
    </motion.div>
  );
}
