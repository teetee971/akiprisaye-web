/**
 * ② COMPARAISON VISUELLE "AVANT / APRÈS PRIX"
 * Montre la différence de prix de manière visuelle et impactante
 */

import { GlassCard } from "../ui/glass-card";

interface ComparisonProps {
  productName: string;
  currentPrice: number;
  bestPrice: number;
  bestStore: string;
}

export function BeforeAfterComparison({ 
  productName = "Jus de citron 1L",
  currentPrice = 3.20,
  bestPrice = 2.45,
  bestStore = "Carrefour Destreland"
}: Partial<ComparisonProps>) {
  const savings = currentPrice - bestPrice;
  const currentBarWidth = 100;
  const bestBarWidth = (bestPrice / currentPrice) * 100;

  return (
    <GlassCard className="bg-blue-900/10 border-blue-500/30">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2 text-blue-300">
            🧾 Produit scanné : {productName}
          </h3>
        </div>

        {/* Prix actuel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Votre prix constaté :</span>
            <span className="text-xl font-bold text-red-400">❌ {currentPrice.toFixed(2)} €</span>
          </div>
          <div className="w-full h-8 bg-slate-800/50 rounded-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-end pr-3"
              style={{ width: `${currentBarWidth}%` }}
            >
              <span className="text-xs font-semibold text-white">{currentPrice.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Meilleur prix */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Meilleur prix autour de vous :</span>
            <span className="text-xl font-bold text-green-400">✅ {bestPrice.toFixed(2)} €</span>
          </div>
          <div className="w-full h-8 bg-slate-800/50 rounded-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-end pr-3"
              style={{ width: `${bestBarWidth}%` }}
            >
              <span className="text-xs font-semibold text-white">{bestPrice.toFixed(2)} €</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 text-center">
            ({bestStore})
          </div>
        </div>

        {/* Économie */}
        <div className="text-center p-4 bg-green-900/20 border border-green-500/40 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">👉 Économie potentielle :</div>
          <div className="text-3xl font-bold text-green-400">
            {savings.toFixed(2)} €
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
