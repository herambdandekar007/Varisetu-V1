import { useTranslation } from 'react-i18next';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/format';

const languages = [
  { code: 'mr', label: 'मराठी' },
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-4 focus-visible:ring-saffron-200 focus-visible:outline-none"
        aria-label="Switch language"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <GlobeAltIcon className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{currentLang.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-36 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-float" role="menu">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setIsOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors',
                lang.code === i18n.language
                  ? 'bg-saffron-50 text-saffron'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
              role="menuitem"
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
