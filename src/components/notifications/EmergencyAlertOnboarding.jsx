import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

/**
 * Critical/permission onboarding for emergency alerts.
 *
 * IMPORTANT PLATFORM LIMITATION (kept in code on purpose):
 *  - Real device push (FCM + NotificationChannel(IMPORTANCE_HIGH, custom sound)
 *    on Android, or Apple's Critical Alerts entitlement — UNNotificationSound
 *    .defaultCriticalSound — on iOS) requires a native app + platform approval.
 *    This codebase is a web SPA with no native shell and no FCM configured, so
 *    we cannot satisfy "alerts even when the phone is silent/DND" here.
 *  - What we CAN do on the web is request the browser Notification permission
 *    and show in-app realtime banners. We never change the device system
 *    volume or silent-mode setting.
 *
 * To reach full silent-mode bypass later: integrate a native wrapper with a
 * high-priority NotificationChannel (Android) and Apple Critical Alerts
 * entitlement (requires formal Apple approval — cannot be "turned on").
 */
export default function EmergencyAlertOnboarding() {
  const [show, setShow] = useState(() => {
    try { return !localStorage.getItem('variEmergencyOnboarded'); } catch { return true; }
  });

  const handleAllow = async () => {
    try {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') toast.success('Emergency alerts enabled.');
        else toast('Emergency alerts limited (permission not granted).');
      } else {
        toast('Notification permission not supported in this browser — in-app alerts will still work.');
      }
    } catch (_e) { toast('In-app emergency alerts will still work.'); }
    dismiss();
  };

  const dismiss = () => {
    try { localStorage.setItem('variEmergencyOnboarded', '1'); } catch {}
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="fixed inset-0 z-[1200] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <button
              onClick={dismiss}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              aria-label="Dismiss"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
              <BellIcon className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-center text-lg font-bold text-ink">
              🚨 Allow WariSetu Emergency Alerts
            </h2>
            <p className="mt-3 text-center text-sm leading-6 text-slate-500">
              WariSetu emergency alerts keep you safe when an ambulance is approaching your
              route. We need permission to show these alerts even when your phone is
              set to silent or Do-Not-Disturb.
            </p>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              While in this web app, alerts appear as in-app banners + browser notifications
              when permitted. Full silent/DND bypass requires a native build with your
              platform's critical-alert approval.
            </p>
            <button
              onClick={handleAllow}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(220,38,38,.25)] transition hover:bg-red-700"
            >
              ALLOW EMERGENCY ALERTS
            </button>
            <button
              onClick={dismiss}
              className="mt-2 w-full rounded-xl py-2 text-center text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
