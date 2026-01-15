/**
 * Badge Variation Component
 * Visual indicator for price variation
 * Uses neutral color coding: gray (stable), blue (notable), purple (important)
 * @param {number} value - Variation percentage
 */
export function BadgeVariation({ value = 0 }) {
  const getVariationColor = (val) => {
    const absVal = Math.abs(val);
    if (absVal < 10) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (absVal < 30) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-purple-100 text-purple-800 border-purple-300';
  };

  const getVariationLabel = (val) => {
    const absVal = Math.abs(val);
    if (absVal < 10) return 'Stable';
    if (absVal < 30) return 'Hausse notable';
    return 'Hausse importante';
  };

  const getVariationIcon = (val) => {
    if (val > 0) return '↗';
    if (val < 0) return '↘';
    return '→';
  };

  return (
    <div className={`inline-flex items-center rounded-lg border px-3 py-1 ${getVariationColor(value)}`}>
      <span className="text-xl mr-2">{getVariationIcon(value)}</span>
      <div className="text-center">
        <p className="text-xs font-medium">Variation</p>
        <p className="text-lg font-bold">
          {value > 0 ? '+' : ''}{value.toFixed(1)}%
        </p>
        <p className="text-xs font-semibold">{getVariationLabel(value)}</p>
      </div>
    </div>
  );
}
