import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreSelection } from '../context/StoreSelectionContext';
import { getEffectiveSelection } from '../modules/store/storeSelection';
import { getPromos, sortPromos, type PromoSort } from '../services/promosService';
import type { PromoCategory, TerritoryCode } from '../types/market';

import { SEOHead } from '../components/ui/SEOHead';
const categoryLabels: Record<PromoCategory, string> = {
  bebe: 'Bébé',
  hygiene: 'Hygiène',
  epicerie: 'Épicerie',
};

const territoryLabels: Record<TerritoryCode, string> = {
  gp: 'Guadeloupe',
  mq: 'Martinique',
  fr: 'France hexagonale',
  gf: 'Guyane',
  re: 'La Réunion',
  yt: 'Mayotte',
};

const storeLabels: Record<string, string> = {
  'gp-leclerc-bas-du-fort': 'E.Leclerc Bas du Fort',
  'gp-carrefour-pliane': 'Carrefour Pliane',
};

export default function PromosPage() {
  const { selection } = useStoreSelection();
  const effectiveSelection = selection ?? getEffectiveSelection('gp');

  const [territory, setTerritory] = useState<TerritoryCode>(effectiveSelection.territory as TerritoryCode);
  const [category, setCategory] = useState<PromoCategory | 'all'>('all');
  const [brand, setBrand] = useState('all');
  const [onlyMyStore, setOnlyMyStore] = useState(Boolean(effectiveSelection.storeId));
  const [sortBy, setSortBy] = useState<PromoSort>('discountDesc');

  const basePromos = useMemo(
    () => getPromos({ territory, storeId: onlyMyStore ? effectiveSelection.storeId : undefined, mode: effectiveSelection.serviceMode }),
    [effectiveSelection.serviceMode, effectiveSelection.storeId, onlyMyStore, territory],
  );

  const brands = useMemo(
    () => Array.from(new Set(basePromos.map((promo) => promo.brand).filter(Boolean))).sort(),
    [basePromos],
  );

  const promos = useMemo(() => {
    const filtered = basePromos.filter((promo) => {
      if (category !== 'all' && promo.category !== category) return false;
      if (brand !== 'all' && promo.brand !== brand) return false;
      return true;
    });

    return sortPromos(filtered, sortBy);
  }, [basePromos, brand, category, sortBy]);

  return (
    <>
      <SEOHead
        title="Promotions Outre-mer — Meilleures offres du moment"
        description="Retrouvez toutes les promotions et bons plans du moment dans les supermarchés des DOM-TOM."
        canonical="https://teetee971.github.io/akiprisaye-web/promos"
      />
    <div className="max-w-6xl mx-auto px-4 py-4 text-slate-100">
      <h1 className="text-2xl font-bold mb-2">Promos & catalogues</h1>
      <p className="text-sm text-slate-400 mb-6">
        Offres locales en mode {effectiveSelection.serviceMode ?? 'inStore'} · territoire {territoryLabels[territory]}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <select className="bg-slate-800 border border-slate-700 rounded-lg p-2" value={territory} onChange={(e) => setTerritory(e.target.value as TerritoryCode)}>
          {Object.entries(territoryLabels).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>

        <select className="bg-slate-800 border border-slate-700 rounded-lg p-2" value={category} onChange={(e) => setCategory(e.target.value as PromoCategory | 'all')}>
          <option value="all">Toutes catégories</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select className="bg-slate-800 border border-slate-700 rounded-lg p-2" value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="all">Toutes marques</option>
          {brands.map((brandName) => (
            <option key={brandName} value={brandName}>{brandName}</option>
          ))}
        </select>

        <select className="bg-slate-800 border border-slate-700 rounded-lg p-2" value={sortBy} onChange={(e) => setSortBy(e.target.value as PromoSort)}>
          <option value="discountDesc">Tri: remise la plus forte</option>
          <option value="endDateAsc">Tri: fin la plus proche</option>
        </select>
      </div>

      <label className="inline-flex items-center gap-2 mb-6 text-sm text-slate-200">
        <input
          type="checkbox"
          className="accent-blue-500"
          checked={onlyMyStore}
          disabled={!effectiveSelection.storeId}
          onChange={(e) => setOnlyMyStore(e.target.checked)}
        />
        Uniquement mon magasin {effectiveSelection.storeId ? `(${storeLabels[effectiveSelection.storeId] ?? effectiveSelection.storeId})` : '(non sélectionné)'}
      </label>

      <div className="grid gap-4">
        {promos.map((promo) => (
          <article key={promo.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-blue-300 uppercase tracking-wide">{categoryLabels[promo.category]}</p>
                <h2 className="font-semibold text-base mt-1">{promo.title}</h2>
                <p className="text-sm text-slate-400">{promo.brand ?? 'Marque locale'} · {storeLabels[promo.storeId ?? ''] ?? 'Magasin du territoire'}</p>
              </div>
              {promo.discountPct ? <span className="text-sm font-bold text-emerald-300">-{promo.discountPct}%</span> : null}
            </div>

            <div className="text-sm mt-3 mb-4">
              <p>
                {typeof promo.price === 'number' ? `${promo.price.toFixed(2)} €` : 'Prix variable'}
                {typeof promo.oldPrice === 'number' ? <span className="text-slate-500 line-through ml-2">{promo.oldPrice.toFixed(2)} €</span> : null}
              </p>
              <p className="text-slate-400">Valable du {promo.validFrom ?? 'N/A'} au {promo.validTo ?? 'N/A'}</p>
            </div>

            <button type="button" className="inline-flex px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm">
              Créer alerte
            </button>
          </article>
        ))}
      </div>

      {promos.length === 0 && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">
          Aucune promo disponible pour ces filtres.
        </div>
      )}

      <Link to="/comparateur" className="inline-block mt-6 text-sm text-blue-400 underline">
        Retour au comparateur
      </Link>
    </div>
    </>
  );
}
