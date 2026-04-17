/**
 * Price badge component with AI adjustment indicator
 * Shows price with optional AI adjustment timestamp
 */
export default function PriceBadge({ price, aiAdjustedAt, originalPrice, showSavings = true }) {
  const hasAiAdjustment = aiAdjustedAt && aiAdjustedAt !== null;
  const savings = originalPrice && price ? ((originalPrice - price) / originalPrice) * 100 : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-blue-400">
          {typeof price === 'number' ? price.toFixed(2) : price}€
        </span>

        {originalPrice && originalPrice > price && (
          <span className="text-sm text-slate-500 line-through">{originalPrice.toFixed(2)}€</span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {hasAiAdjustment && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 italic">
            <span className="text-base">🤖</span>
            IA ajusté {new Date(aiAdjustedAt).toLocaleDateString('fr-FR')}
          </span>
        )}

        {showSavings && savings > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-600 text-white">
            -{savings.toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
}
