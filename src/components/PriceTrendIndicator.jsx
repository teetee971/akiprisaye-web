import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * PriceTrendIndicator - Non-AI transparent price trend analysis
 * Based on simple statistical calculations from historical public data
 */
export default function PriceTrendIndicator({ productId, productName, historicalPrices = [] }) {
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    if (historicalPrices && historicalPrices.length >= 2) {
      calculateTrend(historicalPrices);
    }
  }, [historicalPrices]);

  /**
   * Simple trend calculation based on linear regression
   * No black-box AI - just transparent math
   */
  const calculateTrend = (prices) => {
    // Sort by date (most recent last)
    const sortedPrices = [...prices].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get recent data (last 30 days or last 10 entries, whichever is smaller)
    const recentPrices = sortedPrices.slice(-10);
    
    if (recentPrices.length < 2) {
      setTrend({ direction: 'stable', confidence: 'low', change: 0 });
      return;
    }

    // Calculate simple moving average trend
    const n = recentPrices.length;
    const firstHalf = recentPrices.slice(0, Math.floor(n / 2));
    const secondHalf = recentPrices.slice(Math.floor(n / 2));
    
    const avgFirst = firstHalf.reduce((sum, p) => sum + p.price, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, p) => sum + p.price, 0) / secondHalf.length;
    
    const changePercent = ((avgSecond - avgFirst) / avgFirst) * 100;
    
    // Determine trend direction with thresholds
    let direction = 'stable';
    if (changePercent > 2) {
      direction = 'up';
    } else if (changePercent < -2) {
      direction = 'down';
    }
    
    // Confidence based on data consistency
    const variance = calculateVariance(recentPrices.map(p => p.price));
    const confidence = variance < 1 ? 'high' : variance < 5 ? 'medium' : 'low';

    setTrend({
      direction,
      confidence,
      change: changePercent,
      dataPoints: recentPrices.length,
      avgPrice: avgSecond,
      oldestDate: recentPrices[0].date,
      newestDate: recentPrices[recentPrices.length - 1].date
    });
  };

  const calculateVariance = (values) => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!trend) {
    return (
      <div className="bg-white/[0.05] backdrop-blur-[14px] border border-white/[0.12] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Tendance de prix</h3>
        <p className="text-gray-400 text-sm">Données insuffisantes pour calculer une tendance</p>
      </div>
    );
  }

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'text-red-400';
      case 'down':
        return 'text-green-400';
      default:
        return 'text-blue-400';
    }
  };

  const getTrendLabel = () => {
    switch (trend.direction) {
      case 'up':
        return 'Hausse';
      case 'down':
        return 'Baisse';
      default:
        return 'Stable';
    }
  };

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white/[0.05] backdrop-blur-[14px] border border-white/[0.12] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Tendance de prix</h3>
      
      {/* Trend Display */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`${getTrendColor()}`}>
          {getTrendIcon()}
        </div>
        <div>
          <div className={`text-2xl font-bold ${getTrendColor()}`}>
            {getTrendLabel()}
          </div>
          <div className="text-sm text-gray-400">
            {Math.abs(trend.change).toFixed(1)}% {trend.direction === 'up' ? 'en hausse' : trend.direction === 'down' ? 'en baisse' : 'de variation'}
          </div>
        </div>
      </div>

      {/* Methodology */}
      <div className="space-y-3 mb-4">
        <div className="text-sm text-gray-300">
          <span className="font-semibold text-gray-400">Période analysée:</span> {formatDate(trend.oldestDate)} au {formatDate(trend.newestDate)}
        </div>
        <div className="text-sm text-gray-300">
          <span className="font-semibold text-gray-400">Points de données:</span> {trend.dataPoints} relevés de prix
        </div>
        <div className="text-sm text-gray-300">
          <span className="font-semibold text-gray-400">Prix moyen récent:</span> {trend.avgPrice.toFixed(2)}€
        </div>
        <div className="text-sm text-gray-300">
          <span className="font-semibold text-gray-400">Fiabilité:</span>{' '}
          <span className={`font-semibold ${
            trend.confidence === 'high' ? 'text-green-400' :
            trend.confidence === 'medium' ? 'text-yellow-400' :
            'text-orange-400'
          }`}>
            {trend.confidence === 'high' ? 'Élevée' : trend.confidence === 'medium' ? 'Moyenne' : 'Faible'}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <p className="text-xs text-yellow-300 font-semibold mb-2">Méthodologie transparente</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Cette estimation est basée sur une analyse statistique simple (moyenne mobile) des prix publics collectés. 
          <strong className="text-yellow-300"> Ce n&apos;est pas une prédiction garantie</strong> et ne repose sur aucune intelligence artificielle.
          Les prix peuvent varier selon les magasins et les promotions.
        </p>
      </div>

      {/* Source Attribution */}
      <div className="mt-4 pt-4 border-t border-white/[0.12]">
        <p className="text-xs text-gray-500">
          <span className="font-semibold">Sources:</span> Données historiques collectées à partir de relevés citoyens, 
          tickets de caisse partagés, et bases de données publiques (INSEE, DGCCRF).
        </p>
      </div>
    </div>
  );
}

PriceTrendIndicator.propTypes = {
  productId: PropTypes.string,
  productName: PropTypes.string,
  historicalPrices: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired
    })
  )
};
