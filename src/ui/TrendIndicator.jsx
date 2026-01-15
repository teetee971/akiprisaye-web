

/**
 * TrendIndicator - Display price trend with icon and color
 * 
 * Shows trend direction for basket prices over time
 * Only displays if trend data is available
 * 
 * @param {Object} props
 * @param {'up'|'down'|'stable'|'unknown'} props.direction - Trend direction ('up', 'down', 'stable', 'unknown')
 * @param {number} props.percentageChange - Percentage change value
 * @param {string} props.period - Time period analyzed ('day', 'week', 'month')
 * @param {boolean} props.showPercentage - Whether to show percentage (default: false)
 */
export default function TrendIndicator({ 
  direction, 
  percentageChange, 
  period, 
  showPercentage = false 
}) {
  // Don't render if no valid trend data
  if (!direction || direction === 'unknown') {
    return null;
  }

  const getTrendConfig = () => {
    switch (direction) {
      case 'up':
        return {
          icon: '↑',
          color: 'text-red-400',
          bg: 'bg-red-900/20',
          border: 'border-red-700/30',
          label: 'Hausse',
        };
      case 'down':
        return {
          icon: '↓',
          color: 'text-green-400',
          bg: 'bg-green-900/20',
          border: 'border-green-700/30',
          label: 'Baisse',
        };
      case 'stable':
        return {
          icon: '→',
          color: 'text-slate-400',
          bg: 'bg-slate-800/20',
          border: 'border-slate-700/30',
          label: 'Stable',
        };
      default:
        return null;
    }
  };

  const config = getTrendConfig();
  if (!config) return null;

  const periodLabel = {
    day: '24h',
    week: '7j',
    month: '30j',
  }[period] || period;

  const absPercentage = Math.abs(percentageChange).toFixed(1);

  return (
    <div 
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium
        ${config.bg} ${config.border} ${config.color} border
      `}
      title={`Tendance sur ${periodLabel}: ${config.label}`}
    >
      <span className="text-sm font-bold">{config.icon}</span>
      <span>{config.label}</span>
      {showPercentage && percentageChange !== 0 && (
        <span className="font-semibold">
          {absPercentage}%
        </span>
      )}
      <span className="opacity-70">({periodLabel})</span>
    </div>
  );
}
