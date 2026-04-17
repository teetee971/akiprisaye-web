/**
 * Panier Timeline Component
 * Shows price evolution over time using pure SVG/CSS
 * @param {Array} history - Array of historical data points
 */
export function PanierTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution du panier</h3>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">Données d'évolution non encore disponibles</p>
          <p className="text-sm text-gray-400 mt-2">
            L'historique des prix sera affiché ici prochainement
          </p>
        </div>
      </div>
    );
  }

  // Calculate min/max for scaling
  const values = history.map((h) => h.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  // Use 10% of value as minimum range to avoid flat lines when values are identical
  const valueRange = maxValue - minValue || Math.max(maxValue * 0.1, 1);

  const width = 600;
  const height = 200;
  const padding = 40;

  // Create SVG path
  const points = history.map((point, index) => {
    const x = padding + (index / (history.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - ((point.value - minValue) / valueRange) * (height - 2 * padding);
    return { x, y, ...point };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
    .join(' ');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution du panier</h3>

      {/* Period selector */}
      <div className="flex space-x-2 mb-4">
        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          7 jours
        </button>
        <button className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
          30 jours
        </button>
        <button className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
          6 mois
        </button>
      </div>

      {/* SVG Chart */}
      <div className="bg-gray-50 rounded-lg p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ maxHeight: '250px' }}
        >
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = padding + (i * (height - 2 * padding)) / 4;
            return (
              <line
                key={`grid-${i}`}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            );
          })}

          {/* Line chart */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
            />
          ))}

          {/* Y-axis labels */}
          {[minValue, maxValue].map((value, index) => {
            const y = index === 0 ? height - padding : padding;
            return (
              <text
                key={`label-${index}`}
                x={padding - 10}
                y={y}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {value.toFixed(2)}€
              </text>
            );
          })}
        </svg>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Évolution du coût total du panier anti-crise sur la période sélectionnée
      </p>
    </div>
  );
}
