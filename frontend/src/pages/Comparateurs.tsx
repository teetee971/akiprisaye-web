import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type StorePrice = {
  store: string;
  price: number;
};

type ProductComparison = {
  name: string;
  category: string;
  prices: StorePrice[];
};

// Prix par territoire (données indicatives, sources locales)
type TerritoryKey = 'guadeloupe' | 'martinique' | 'guyane' | 'reunion' | 'mayotte';

const storesByTerritory: Record<TerritoryKey, readonly string[]> = {
  guadeloupe: ['Carrefour', 'E.Leclerc', 'Super U'],
  martinique:  ['Carrefour', 'E.Leclerc', 'Super U'],
  guyane:      ['Hyper Casino', 'Leader Price', 'Cora'],
  reunion:     ['Carrefour', 'E.Leclerc', 'Jumbo Score'],
  mayotte:     ['Jumbo', 'Score', 'Sodifram'],
};

// Coefficient de cherté par territoire (Guadeloupe = base 1.0)
const prixCoeff: Record<TerritoryKey, number> = {
  guadeloupe: 1.00,
  martinique:  1.02,
  guyane:      1.08,
  reunion:     0.98,
  mayotte:     1.12,
};

const baseComparisons: ProductComparison[] = [
  { name: 'Riz 1 kg',      category: 'Épicerie',          prices: [{ store: 'Carrefour', price: 3.45 }, { store: 'E.Leclerc', price: 3.15 }, { store: 'Super U', price: 3.30 }] },
  { name: 'Lait 1 L',      category: 'Produits laitiers', prices: [{ store: 'Carrefour', price: 1.70 }, { store: 'E.Leclerc', price: 1.55 }, { store: 'Super U', price: 1.62 }] },
  { name: 'Huile 1 L',     category: 'Épicerie',          prices: [{ store: 'Carrefour', price: 4.25 }, { store: 'E.Leclerc', price: 3.95 }, { store: 'Super U', price: 4.10 }] },
  { name: 'Poulet entier', category: 'Viande',             prices: [{ store: 'Carrefour', price: 8.90 }, { store: 'E.Leclerc', price: 8.20 }, { store: 'Super U', price: 8.55 }] },
  { name: 'Pâtes 500 g',   category: 'Épicerie',          prices: [{ store: 'Carrefour', price: 1.45 }, { store: 'E.Leclerc', price: 1.25 }, { store: 'Super U', price: 1.35 }] },
  { name: 'Bananes 1 kg',  category: 'Fruits & Légumes',  prices: [{ store: 'Carrefour', price: 1.80 }, { store: 'E.Leclerc', price: 1.60 }, { store: 'Super U', price: 1.70 }] },
  { name: 'Pain de mie',   category: 'Boulangerie',        prices: [{ store: 'Carrefour', price: 2.30 }, { store: 'E.Leclerc', price: 2.05 }, { store: 'Super U', price: 2.20 }] },
  { name: 'Sucre 1 kg',    category: 'Épicerie',          prices: [{ store: 'Carrefour', price: 1.55 }, { store: 'E.Leclerc', price: 1.40 }, { store: 'Super U', price: 1.48 }] },
];

const territoryOptions: { value: TerritoryKey; label: string; flag: string }[] = [
  { value: 'guadeloupe', label: 'Guadeloupe',  flag: '🇬🇵' },
  { value: 'martinique', label: 'Martinique',  flag: '🇲🇶' },
  { value: 'guyane',     label: 'Guyane',      flag: '🇬🇫' },
  { value: 'reunion',    label: 'La Réunion',  flag: '🇷🇪' },
  { value: 'mayotte',    label: 'Mayotte',     flag: '🇾🇹' },
];

export default function Comparateurs() {
  const [territory, setTerritory] = useState<TerritoryKey>('guadeloupe');

  const stores = storesByTerritory[territory];
  const coeff  = prixCoeff[territory];

  const comparisons = useMemo<ProductComparison[]>(() =>
    baseComparisons.map((product) => ({
      ...product,
      prices: stores.map((store, i) => ({
        store,
        price: parseFloat((product.prices[i % product.prices.length].price * coeff).toFixed(2)),
      })),
    })),
  [territory, stores, coeff]);

  const totalMin = comparisons.reduce((sum, p) => sum + Math.min(...p.prices.map((s) => s.price)), 0);
  const totalMax = comparisons.reduce((sum, p) => sum + Math.max(...p.prices.map((s) => s.price)), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Comparer les prix</h1>
          <p className="text-white/70">Données indicatives – territoires ultramarins • {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Sélecteur territoire */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-6">
          <label className="block text-sm font-medium text-white/80 mb-3">Territoire</label>
          <div className="flex flex-wrap gap-2">
            {territoryOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTerritory(opt.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  territory === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <span>{opt.flag}</span>{opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/40 mt-3">
            📌 Données indicatives à usage informatif. Prix moyens observés sur les enseignes locales.
          </p>
        </div>

        {/* Économies potentielles */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Panier min.</p>
            <p className="text-xl font-bold text-green-400">{totalMin.toFixed(2)} €</p>
          </div>
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Panier max.</p>
            <p className="text-xl font-bold text-red-400">{totalMax.toFixed(2)} €</p>
          </div>
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Économie possible</p>
            <p className="text-xl font-bold text-blue-400">{(totalMax - totalMin).toFixed(2)} €</p>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900">
              <tr>
                <th className="text-left px-4 py-3 text-white/80">Produit</th>
                <th className="text-left px-4 py-3 text-white/60">Catégorie</th>
                {stores.map((store) => (
                  <th key={store} className="text-left px-4 py-3 text-white/80">{store}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisons.map((product) => {
                const minPrice = Math.min(...product.prices.map((p) => p.price));
                return (
                  <tr key={product.name} className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-white/50">{product.category}</td>
                    {stores.map((store) => {
                      const entry = product.prices.find((p) => p.store === store);
                      if (!entry) return <td key={store} className="px-4 py-3 text-white/30">—</td>;
                      const isBest = entry.price === minPrice;
                      return (
                        <td key={store} className={`px-4 py-3 font-semibold ${isBest ? 'text-emerald-300' : 'text-white'}`}>
                          {isBest && <span className="mr-1">🏆</span>}
                          {entry.price.toFixed(2)} €
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">Prix estimés. Pour des prix en temps réel, utilisez le comparateur avancé.</p>
          <div className="flex gap-3">
            <Link to="/scanner?mode=ticket"
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium transition-colors">
              📱 Scanner un ticket
            </Link>
            <Link to="/comparaison-enseignes"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white/70 text-sm transition-colors">
              Comparateur avancé →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
