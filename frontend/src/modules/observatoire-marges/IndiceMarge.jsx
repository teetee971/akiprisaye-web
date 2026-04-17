/**
 * Indice Marge Badge
 * Visual indicator for price differential
 * Uses neutral color coding: 🟢 < 20%, 🟡 20-50%, 🔴 > 50%
 * @param {number} value - Margin percentage value
 */
export function IndiceMarge({ value = 0 }) {
  const getMarginColor = (val) => {
    if (val < 20) return 'bg-green-100 text-green-800 border-green-300';
    if (val < 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getMarginLabel = (val) => {
    if (val < 20) return 'Faible';
    if (val < 50) return 'Modéré';
    return 'Élevé';
  };

  const getMarginIcon = (val) => {
    if (val < 20) return '🟢';
    if (val < 50) return '🟡';
    return '🔴';
  };

  return (
    <div
      className={`inline-flex items-center rounded-lg border px-3 py-1 ${getMarginColor(value)}`}
    >
      <span className="mr-2">{getMarginIcon(value)}</span>
      <div className="text-center">
        <p className="text-xs font-medium">Différentiel</p>
        <p className="text-lg font-bold">
          {value > 0 ? '+' : ''}
          {value.toFixed(1)}%
        </p>
        <p className="text-xs font-semibold">{getMarginLabel(value)}</p>
      </div>
    </div>
  );
}
