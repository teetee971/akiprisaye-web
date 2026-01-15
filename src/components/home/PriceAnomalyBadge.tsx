/**
 * ④ BADGE "ANOMALIE DE PRIX"
 * Détecte et affiche les prix anormalement élevés
 */

interface AnomalyBadgeProps {
  percentageAboveAverage: number;
  className?: string;
  showTooltip?: boolean;
}

export function PriceAnomalyBadge({ 
  percentageAboveAverage,
  className = "",
  showTooltip = true 
}: AnomalyBadgeProps) {
  if (percentageAboveAverage < 15) return null;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 bg-red-900/30 border border-red-500/50 rounded-lg ${className}`}>
      <span className="text-xl">⚠️</span>
      <div className="text-left">
        <div className="text-sm font-bold text-red-300">Prix inhabituellement élevé</div>
        <div className="text-xs text-red-400">+{percentageAboveAverage}% au-dessus de la moyenne locale</div>
        {showTooltip && (
          <div className="text-xs text-gray-400 mt-1">
            Signalement automatique basé sur les données publiques
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Exemple d'utilisation dans une card produit/enseigne
 */
export function ProductCardWithAnomaly() {
  return (
    <div className="p-4 bg-slate-800/50 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Lait UHT 1L</h4>
        <span className="text-lg font-bold">3,85 €</span>
      </div>
      
      <PriceAnomalyBadge percentageAboveAverage={27} />
      
      <div className="text-xs text-gray-400">
        Prix moyen observé : 2,99 €
      </div>
    </div>
  );
}
