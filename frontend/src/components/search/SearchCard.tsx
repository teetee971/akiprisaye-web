import { TerritorySelect } from './TerritorySelect';
import type { TerritoryCode } from '../../utils/territory';

interface SearchCardProps {
  query: string;
  setQuery: (v: string) => void;
  territory: string;
  setTerritory: (v: TerritoryCode) => void;
  retailer: string;
  setRetailer: (v: string) => void;
  loading?: boolean;
  onScan?: () => void;
  onSubmit: () => void;
}

export function SearchCard({
  query,
  setQuery,
  territory,
  setTerritory,
  retailer,
  setRetailer,
  loading,
  onScan,
  onSubmit,
}: SearchCardProps) {
  return (
    <div className="min-h-[420px] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] backdrop-blur-xl p-6">
      <div className="mb-4 text-lg font-semibold text-white">Comparer les prix</div>
      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom du produit ou code-barres…"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-emerald-400/40"
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        />
        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-zinc-500">Territoire</div>
          <TerritorySelect value={territory} onChange={setTerritory} />
        </div>
        <input
          type="text"
          value={retailer}
          onChange={(e) => setRetailer(e.target.value)}
          placeholder="Enseigne (optionnel)"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-white/20"
        />
        <div className="flex gap-3">
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 rounded-xl bg-emerald-500 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? 'Recherche…' : 'Comparer'}
          </button>
          {onScan && (
            <button
              onClick={onScan}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-zinc-300 transition hover:bg-white/10"
            >
              Scanner
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
