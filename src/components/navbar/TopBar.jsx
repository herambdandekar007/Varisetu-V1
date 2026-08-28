import { BellIcon, MagnifyingGlassIcon, SignalIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/format';
import LanguageSwitcher from '../common/LanguageSwitcher';
import ProfileMenu from '../common/ProfileMenu';

const roleBadgeLabels = {
  pilgrim: 'Pilgrim',
  volunteer: 'Volunteer',
  medical: 'Medical',
  police: 'Controller',
  municipality: 'Municipality',
  ambulance_driver: 'Ambulance Driver',
};

const roleBadgeColors = {
  pilgrim: 'bg-saffron-50 text-saffron',
  volunteer: 'bg-emerald-50 text-emerald-700',
  medical: 'bg-red-50 text-red-600',
  police: 'bg-blue-50 text-blue-700',
  municipality: 'bg-purple-50 text-purple-700',
  ambulance_driver: 'bg-red-50 text-red-600',
};

export default function TopBar() {
  const { t } = useTranslation();
  const { setIsNotificationOpen } = useApp();
  const { role } = useAuth();
  const roleId = role || 'pilgrim';
  const roleLabel = roleBadgeLabels[roleId] || 'Pilgrim';

  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-3 border-b border-slate-100 bg-cloud/90 px-4 backdrop-blur-xl shadow-topbar sm:px-6 lg:px-8">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-saffron font-bold text-white" aria-hidden="true">
          व
        </div>
        <p className="text-base font-bold text-ink">{t('app.name')}</p>
      </div>

      {/* Search */}
      <div className="relative hidden max-w-xs flex-1 md:block lg:max-w-sm">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          aria-label={t('topbar.searchPlaceholder')}
          placeholder={t('topbar.searchPlaceholder')}
          className={cn(
            'w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm',
            'outline-none transition-all duration-200 placeholder:text-slate-400',
            'focus:border-saffron focus:ring-4 focus:ring-saffron-100',
            'hover:border-slate-300',
          )}
        />
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Status badge */}
        <div className="hidden items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-forest sm:flex">
          <SignalIcon className="h-4 w-4" aria-hidden="true" />
          {t('topbar.allSystemsLive')}
        </div>

        {/* Notifications */}
        <button
          onClick={() => setIsNotificationOpen(true)}
          aria-label={t('topbar.notifications')}
          className="relative grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-600 shadow-sm transition-all duration-200 hover:text-saffron hover:shadow-md focus-visible:ring-4 focus-visible:ring-saffron-200 focus-visible:outline-none"
        >
          <BellIcon className="h-5 w-5" aria-hidden="true" />
          <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden="true" />

        {/* Role badge */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${roleBadgeColors[roleId]}`}>
            {roleLabel}
          </span>
        </div>
        <ProfileMenu />
      </div>
    </header>
  );
}
