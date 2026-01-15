/**
 * Score Anti-Crise Badge
 * Displays the anti-crisis score with trend indicator
 * @param {number} score - Score value (0-100)
 * @param {string} trend - Trend indicator (up, down, stable)
 */
export function ScoreAntiCrise({ score = 0, trend = 'stable' }) {
  const getScoreColor = (value) => {
    if (value >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (value >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (value >= 40) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getScoreLabel = (value) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Bon';
    if (value >= 40) return 'Moyen';
    return 'Faible';
  };

  const getTrendIcon = (trendType) => {
    switch (trendType) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '=';
    }
  };

  const getTrendColor = (trendType) => {
    switch (trendType) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`inline-flex items-center rounded-lg border-2 px-4 py-2 ${getScoreColor(score)}`}>
      <div className="text-center">
        <div className="flex items-center space-x-2">
          <div>
            <p className="text-sm font-medium">Score Anti-Crise</p>
            <p className="text-3xl font-bold">{score}</p>
          </div>
          <span className={`text-2xl font-bold ${getTrendColor(trend)}`}>
            {getTrendIcon(trend)}
          </span>
        </div>
        <p className="text-xs font-semibold mt-1">
          {getScoreLabel(score)}
        </p>
      </div>
    </div>
  );
}
