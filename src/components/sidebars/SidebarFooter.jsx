import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/format';

export default function SidebarFooter() {
  const { t } = useTranslation();

  return (
    <NavLink
      to="/accessibility"
      className={({ isActive }) =>
        cn(
          'mt-auto rounded-2xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-saffron-200 focus-visible:ring-offset-2',
          isActive ? 'bg-forest-50 ring-2 ring-forest-200' : 'bg-[#EEF7F0] hover:bg-[#e2f1e6]',
        )
      }
    >
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-forest">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-white" aria-hidden="true">Aa</span>
          {t('nav.accessibility')}
        </div>
        <p className="mt-2 text-xs leading-5 text-emerald-700/75">
          {t('nav.accessibilityDesc')}
        </p>
      </div>
    </NavLink>
  );
}
