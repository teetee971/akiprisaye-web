/**
 * Language Selector Component
 * Allows users to select their preferred language
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, Language } from '../../i18n/languages';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'list' | 'compact';
  showNative?: boolean;
  onChange?: (language: Language) => void;
}

export function LanguageSelector({
  variant = 'dropdown',
  showNative = true,
  onChange,
}: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = async (lang: Language) => {
    await i18n.changeLanguage(lang.code);
    localStorage.setItem('akiprisaye-language', lang.code);
    setIsOpen(false);
    onChange?.(lang);
  };

  if (variant === 'list') {
    return (
      <div className="language-list space-y-2">
        <h3 className="font-semibold mb-4">{t('language.select')}</h3>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
              lang.code === i18n.language
                ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => changeLanguage(lang)}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{lang.flag}</span>
              <div className="text-left">
                <div className="font-medium">{lang.native}</div>
                {showNative && lang.code !== 'fr' && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">{lang.name}</div>
                )}
              </div>
            </div>
            {lang.code === i18n.language && <span className="text-blue-500 text-xl">✓</span>}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        className="language-compact p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('language.select')}
      >
        <span className="text-2xl">{currentLang.flag}</span>
      </button>
    );
  }

  return (
    <div className="language-selector relative" ref={dropdownRef}>
      <button
        className="language-trigger flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-xl">{currentLang.flag}</span>
        <span className="font-medium">{currentLang.code.toUpperCase()}</span>
        <span className="text-sm">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          className="language-dropdown absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          role="listbox"
          aria-label="Sélectionner une langue"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              role="option"
              aria-selected={lang.code === i18n.language}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                lang.code === i18n.language
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => changeLanguage(lang)}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="font-medium">{lang.native}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
