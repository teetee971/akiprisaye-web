/**
 * PriceDifferenceIndicator Component
 * Visual indicator for price differences
 */

interface PriceDifferenceIndicatorProps {
  basePrice: number;
  comparePrice: number;
  showPercentage?: boolean;
}

export function PriceDifferenceIndicator({ 
  basePrice, 
  comparePrice, 
  showPercentage = true 
}: PriceDifferenceIndicatorProps) {
  const diff = comparePrice - basePrice;
  const diffPercent = ((diff / basePrice) * 100).toFixed(1);
  const isHigher = diff > 0;
  // Use constant from constants.ts for consistency
  const SIGNIFICANT_THRESHOLD = 20;
  const isSignificant = Math.abs(parseFloat(diffPercent)) > SIGNIFICANT_THRESHOLD;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${
      isHigher 
        ? isSignificant ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
        : 'bg-green-500/10 text-green-400'
    }`}>
      <span className="text-lg">{isHigher ? '📈' : '📉'}</span>
      <span className="font-semibold">
        {isHigher ? '+' : ''}{diff.toFixed(2)}€
      </span>
      {showPercentage && (
        <span className="text-sm">
          ({isHigher ? '+' : ''}{diffPercent}%)
        </span>
      )}
      {isSignificant && (
        <span className="text-lg" title="Écart important (>20%)">⚠️</span>
      )}
    </div>
  );
}
