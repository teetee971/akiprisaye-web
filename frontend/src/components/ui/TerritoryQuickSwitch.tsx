/**
 * TerritoryQuickSwitch — Dropdown compact pour changer de territoire sans reload
 * Module 24 — Territoire dynamique
 */

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, Globe } from 'lucide-react';
import { useTerritory } from '../../context/TerritoryContext';
import { getActiveTerritories } from '../../constants/territories';
import type { TerritoryCode } from '../../constants/territories';

const TERRITORIES = getActiveTerritories();

export function TerritoryQuickSwitch({ className = '' }: { className?: string }) {
  const { territory, setTerritory } = useTerritory();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = TERRITORIES.find((t) => t.code === territory) ?? TERRITORIES[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(code: TerritoryCode) {
    const selected = TERRITORIES.find((t) => t.code === code);
    setTerritory(code);
    setOpen(false);
    if (selected) {
      toast.success(`Territoire changé : ${selected.flag} ${selected.name}`);
    }
  }

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="w-4 h-4 text-gray-400" />
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.name}</span>
        <span className="sm:hidden">{current.code.toUpperCase()}</span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-72 overflow-y-auto"
        >
          {TERRITORIES.map((t) => (
            <li key={t.code}>
              <button
                type="button"
                role="option"
                aria-selected={t.code === territory}
                onClick={() => handleSelect(t.code as TerritoryCode)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                  t.code === territory ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
              >
                <span className="text-base">{t.flag}</span>
                <span className="flex-1">{t.name}</span>
                <span className="text-xs text-gray-400 uppercase">{t.type}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
