import { useMemo, useState } from 'react';

type StorePrice = {
  store: string;
  price: number;
};

type ProductComparison = {
  name: string;
  category: string;
  prices: StorePrice[];
};

const stores = ['Carrefour', 'E.Leclerc', 'Super U'] as const;

const territoryOptions = [
  { value: 'guadeloupe', label: 'Guadeloupe', enabled: true },
  { value: 'martinique', label: 'Martinique (bientôt)', enabled: false },
  { value: 'guyane', label: 'Guyane (bientôt)', enabled: false },
  { value: 'reunion', label: 'La Réunion (bientôt)', enabled: false },
  { value: 'mayotte', label: 'Mayotte (bientôt)', enabled: false },
];

const mockComparisons: ProductComparison[] = [
  {
    name: 'Riz 1kg',
    category: 'Épicerie',
    prices: [
      { store: 'Carrefour', price: 3.45 },
      { store: 'E.Leclerc', price: 3.15 },
      { store: 'Super U', price: 3.3 },
    ],
  },
  {
    name: 'Lait 1L',
    category: 'Produits laitiers',
    prices: [
      { store: 'Carrefour', price: 1.7 },
      { store: 'E.Leclerc', price: 1.55 },
      { store: 'Super U', price: 1.62 },
    ],
  },
  {
    name: 'Huile 1L',
    category: 'Épicerie',
    prices: [
      { store: 'Carrefour', price: 4.25 },
      { store: 'E.Leclerc', price: 3.95 },
      { store: 'Super U', price: 4.1 },
    ],
  },
];

export default function Comparateurs() {
  const [territory, setTerritory] = useState('guadeloupe');

  const comparisons = useMemo(() => mockComparisons, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Comparer les prix</h1>
          <p className="text-white/70">Données indicatives – territoires ultramarins</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 mb-8">
          <label className="block text-sm font-medium text-white/80 mb-2">
            Territoire
          </label>
          <select
            value={territory}
            onChange={(event) => setTerritory(event.target.value)}
            className="w-full sm:w-72 bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {territoryOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={!option.enabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-white/50 mt-2">
            Les données sont des estimations locales à usage informatif.
          </p>
        </div>

        <div className="overflow-x-auto bg-slate-900/40 border border-slate-800 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900">
              <tr>
                <th className="text-left px-4 py-3 text-white/80">Produit</th>
                <th className="text-left px-4 py-3 text-white/80">Catégorie</th>
                {stores.map((store) => (
                  <th key={store} className="text-left px-4 py-3 text-white/80">
                    {store}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisons.map((product) => {
                const minPrice = Math.min(...product.prices.map((price) => price.price));
                return (
                  <tr key={product.name} className="border-t border-slate-800">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-white/60">{product.category}</td>
                    {stores.map((store) => {
                      const priceEntry = product.prices.find((price) => price.store === store);
                      if (!priceEntry) {
                        return (
                          <td key={store} className="px-4 py-3 text-white/50">
                            —
                          </td>
                        );
                      }
                      const isBest = priceEntry.price === minPrice;
                      return (
                        <td
                          key={store}
                          className={`px-4 py-3 font-semibold ${
                            isBest ? 'text-emerald-300' : 'text-white'
                          }`}
                        >
                          {priceEntry.price.toFixed(2)} €
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-slate-800 text-white/70 cursor-not-allowed"
            disabled
          >
            Scanner un ticket (bientôt)
          </button>
        </div>
      </div>
    </div>
  );
}
