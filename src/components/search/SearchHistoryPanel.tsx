import { useState } from 'react';
import type { SearchHistoryEntry } from '../../hooks/useSearchHistory';

interface SearchHistoryPanelProps {
  entries: SearchHistoryEntry[];
  onReplay: (entry: SearchHistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const typeBadge: Record<SearchHistoryEntry['type'], string> = {
  text: 'Texte',
  barcode: 'EAN',
  ocr: 'OCR',
};

export default function SearchHistoryPanel({
  entries,
  onReplay,
  onRemove,
  onClear,
}: SearchHistoryPanelProps) {
  const [open, setOpen] = useState(true);

  return (
    <section className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 space-y-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="flex flex-col">
          <span className="text-base font-semibold">🕘 Historique ({entries.length})</span>
          <span className="text-xs text-slate-400">Consultés récemment</span>
        </span>
        <span className="text-sm text-slate-400">{open ? 'Masquer' : 'Afficher'}</span>
      </button>

      {entries.length === 0 && (
        <p className="text-xs text-slate-500">
          Vos produits apparaissent ici après chaque recherche.
        </p>
      )}
      <p className="text-[11px] text-slate-500">🔒 Aucune donnée n’est envoyée vers un serveur.</p>

      <div
        className={`transition-all duration-200 ${
          open ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        } overflow-hidden`}
      >
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-2 bg-slate-950/70 border border-slate-800 rounded-xl p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{entry.label}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{typeBadge[entry.type]}</span>
                    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
                      Consulté
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(entry.id)}
                  className="text-xs text-slate-400 hover:text-red-300"
                  aria-label="Supprimer l'entrée"
                >
                  ❌
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => onReplay(entry)}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-sm rounded-lg font-semibold"
                >
                  🔄 Relancer la recherche
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="pt-3">
          <button
            type="button"
            onClick={onClear}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm rounded-lg font-semibold"
          >
            🗑️ Effacer l'historique
          </button>
        </div>
      </div>
    </section>
  );
}
