/**
 * ⑫ 🧭 PLAN D'ACTION : OÙ ALLER POUR ÉCONOMISER MAINTENANT
 * Transforme l'analyse en action concrète
 */
import { Link } from 'react-router-dom';

import { GlassCard } from '../ui/glass-card';

interface Product {
  name: string;
  bestStore: string;
  bestPrice: number;
  currentPrice?: number;
}

interface StoreOption {
  stores: string[];
  totalSavings: number;
  productsCount: number;
}

interface SavingsActionPlanProps {
  products: Product[];
  className?: string;
}

export function SavingsActionPlan({ products, className = '' }: SavingsActionPlanProps) {
  if (!products || products.length === 0) return null;

  const { optionA, optionB } = calculateBestOptions(products);

  const handleCopyList = () => {
    const text = generateShoppingList(products, optionB);
    navigator.clipboard.writeText(text).then(() => {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: '✅ Liste copiée dans le presse-papier',
          type: 'success',
        },
      });
      window.dispatchEvent(event);
    });
  };

  return (
    <GlassCard className={`bg-green-900/10 border-green-500/30 ${className}`}>
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-green-300 mb-2">✅ Plan d'action</h3>
          <p className="text-sm text-gray-400">Où aller pour économiser maintenant</p>
        </div>

        {/* Option A - 1 magasin */}
        <div className="p-4 bg-slate-800/50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="font-bold text-white">Option A</span>
              <span className="text-xs text-gray-400">(plus rapide)</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                {optionA.totalSavings.toFixed(2)} €
              </div>
              <div className="text-xs text-gray-400">économies</div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-gray-300">
              <span className="font-semibold">Allez chez :</span> {optionA.stores[0]}
            </div>
            <div className="text-xs text-gray-400">
              {optionA.productsCount} produit{optionA.productsCount > 1 ? 's' : ''} sur{' '}
              {products.length} y {optionA.productsCount > 1 ? 'sont' : 'est'} moins cher
              {optionA.productsCount > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Option B - 2 magasins si meilleure */}
        {optionB.stores.length > 1 && optionB.totalSavings > optionA.totalSavings && (
          <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <span className="font-bold text-green-300">Option B</span>
                <span className="text-xs text-gray-400">(plus rentable)</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {optionB.totalSavings.toFixed(2)} €
                </div>
                <div className="text-xs text-gray-400">économies</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-gray-300">
                <span className="font-semibold">2 magasins :</span>
              </div>
              {optionB.stores.map((store, idx) => (
                <div key={idx} className="text-xs text-gray-400 pl-4">
                  • {store}
                </div>
              ))}
              <div className="text-xs text-green-400 pt-1">
                +{(optionB.totalSavings - optionA.totalSavings).toFixed(2)} € de plus qu'option A
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopyList}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-all"
          >
            <span>📋</span>
            <span>Copier la liste</span>
          </button>
          <Link
            to="/carte"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-all transform hover:scale-105"
          >
            <span>🗺️</span>
            <span>Voir l'itinéraire</span>
          </Link>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 text-center">
          Calculé sur la base des prix actuels observés
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Calcule les meilleures options (1 ou 2 magasins)
 */
function calculateBestOptions(products: Product[]): {
  optionA: StoreOption;
  optionB: StoreOption;
} {
  // Compter les occurrences de chaque magasin
  const storeCounts = new Map<string, { count: number; savings: number }>();

  products.forEach((product) => {
    const savings = product.currentPrice ? product.currentPrice - product.bestPrice : 0;

    const existing = storeCounts.get(product.bestStore) || { count: 0, savings: 0 };
    storeCounts.set(product.bestStore, {
      count: existing.count + 1,
      savings: existing.savings + savings,
    });
  });

  // Option A : meilleur magasin unique
  let bestStore = '';
  let bestStoreSavings = 0;
  let bestStoreCount = 0;

  storeCounts.forEach((data, store) => {
    if (data.savings > bestStoreSavings) {
      bestStore = store;
      bestStoreSavings = data.savings;
      bestStoreCount = data.count;
    }
  });

  const optionA: StoreOption = {
    stores: [bestStore],
    totalSavings: bestStoreSavings,
    productsCount: bestStoreCount,
  };

  // Option B : combiner 2 magasins
  const sortedStores = Array.from(storeCounts.entries())
    .sort((a, b) => b[1].savings - a[1].savings)
    .slice(0, 2);

  if (sortedStores.length >= 2) {
    const optionB: StoreOption = {
      stores: sortedStores.map((s) => s[0]),
      totalSavings: sortedStores.reduce((sum, s) => sum + s[1].savings, 0),
      productsCount: sortedStores.reduce((sum, s) => sum + s[1].count, 0),
    };
    return { optionA, optionB };
  }

  return { optionA, optionB: optionA };
}

/**
 * Génère une liste de courses formatée
 */
function generateShoppingList(products: Product[], option: StoreOption): string {
  let text = '📝 Ma liste de courses économique\n\n';

  option.stores.forEach((store) => {
    text += `🏪 ${store}\n`;

    products
      .filter((p) => p.bestStore === store)
      .forEach((p) => {
        text += `  • ${p.name} - ${p.bestPrice.toFixed(2)} €\n`;
      });

    text += '\n';
  });

  text += `💰 Économies totales : ${option.totalSavings.toFixed(2)} €\n`;
  text += `\nGénéré par A KI PRI SA YÉ - Observatoire citoyen`;

  return text;
}
