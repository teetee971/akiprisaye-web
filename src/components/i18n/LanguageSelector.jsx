import { useEffect, useState } from 'react';

const LANGUAGES = [
  { code: 'fr', label: 'FR' },
  { code: 'gcf', label: 'KR' },
];

export default function LanguageSelector() {
  const [language, setLanguage] = useState(() => localStorage.getItem('akiprisaye-language') || 'fr');

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('akiprisaye-language', language);
  }, [language]);

  return (
    <label className="flex items-center gap-2 text-xs text-slate-200">
      <span className="sr-only">Langue</span>
      <select
        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-xs"
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label="Sélection de la langue"
      >
        {LANGUAGES.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
