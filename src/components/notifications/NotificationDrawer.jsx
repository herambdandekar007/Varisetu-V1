import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppContext';

export default function NotificationDrawer() {
  const { t } = useTranslation();
  const { isNotificationOpen, setIsNotificationOpen, notifications } = useApp();

  return (
    <AnimatePresence>
      {isNotificationOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsNotificationOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications drawer"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="eyebrow">{t('notifications.eyebrow')}</p>
                <h2 className="text-xl font-bold text-ink">{t('notifications.title')}</h2>
              </div>
              <button
                onClick={() => setIsNotificationOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 focus-visible:ring-4 focus-visible:ring-saffron-200 focus-visible:outline-none"
                aria-label={t('common.close')}
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 space-y-2 overflow-y-auto px-6 py-5">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BellIcon className="h-10 w-10 text-slate-300" aria-hidden="true" />
                  <p className="mt-4 text-sm font-bold text-slate-500">{t('notifications.allCaughtUp')}</p>
                  <p className="mt-1 text-xs text-slate-400">{t('notifications.noNewNotifications')}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <article
                    key={notification.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-saffron-50 text-saffron">
                        <BellIcon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-bold text-ink">{notification.title}</h3>
                          <time className="shrink-0 whitespace-nowrap text-[11px] text-slate-400">
                            {notification.time}
                          </time>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {notification.text}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
