/**
 * Enhanced Price Comparison Display
 *
 * Features:
 * - Price comparison with reliability badges
 * - Product images (mobile-optimized)
 * - Sorted by price (cheapest first)
 * - Action buttons (compare, history, alert, report)
 * - Clear statistics and metadata
 */

import { useState, useMemo } from 'react';
import ReliabilityBadge from '../price/ReliabilityBadge';
import ProductImage from '../product/ProductImage';
import PriceTrendBadge from '../price/PriceTrendBadge';
import { computePrediction } from '../../services/predictionService';
import type { EnhancedPriceComparison } from '../../types/enhancedPrice';

interface EnhancedComparisonDisplayProps {
  comparison: EnhancedPriceComparison;
  onCompareStores?: () => void;
  onViewHistory?: (ean: string) => void;
  onCreateAlert?: (ean: string) => void;
  onReportAnomaly?: (ean: string, storeId: string) => void;
}

export default function EnhancedComparisonDisplay({
  comparison,
  onCompareStores,
  onViewHistory,
  onCreateAlert,
  onReportAnomaly,
}: EnhancedComparisonDisplayProps) {
  const [expandedPriceIndex, setExpandedPriceIndex] = useState<number | null>(null);

  // Compute price trend prediction
  const pricePrediction = useMemo(() => {
    const observations = comparison.prices.map((p) => ({
      date: p.observedAt,
      price: p.price,
      store: p.storeName,
    }));
    return computePrediction(observations);
  }, [comparison.prices]);

  const togglePriceDetails = (index: number) => {
    setExpandedPriceIndex(expandedPriceIndex === index ? null : index);
  };

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
      };

      if (date.getFullYear() !== now.getFullYear()) {
        options.year = 'numeric';
      }

      return date.toLocaleDateString('fr-FR', options);
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-4">
            {/* Product Image */}
            <div className="flex-shrink-0">
              <ProductImage
                images={comparison.product.images}
                productName={comparison.product.name}
                size="card"
                className="rounded-lg w-32 h-32"
                loading="eager"
              />
            </div>

            {/* Product Info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{comparison.product.name}</h2>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">{comparison.product.brand}</span>
                <span>•</span>
                <span>{comparison.product.format.displayText}</span>
              </div>
              <div className="mt-1 text-sm text-gray-500">EAN: {comparison.product.ean}</div>
            </div>
          </div>

          {/* Badges Column */}
          <div className="flex flex-col gap-3">
            {/* Average Reliability Badge */}
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Fiabilité moyenne</div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
                <span>✓</span>
                <span>{comparison.metadata.averageReliability}%</span>
              </div>
            </div>

            {/* Price Trend Prediction */}
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Tendance de prix</div>
              <PriceTrendBadge prediction={pricePrediction} compact />
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <div className="text-xs text-gray-600 mb-1">Prix le plus bas</div>
            <div className="text-lg font-bold text-green-600">
              {comparison.statistics.cheapestPrice.toFixed(2)}€
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Prix moyen</div>
            <div className="text-lg font-bold text-gray-900">
              {comparison.statistics.averagePrice.toFixed(2)}€
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Prix le plus élevé</div>
            <div className="text-lg font-bold text-red-600">
              {comparison.statistics.mostExpensivePrice.toFixed(2)}€
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Écart de prix</div>
            <div className="text-lg font-bold text-orange-600">
              {comparison.statistics.priceRangePercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {onViewHistory && (
            <button
              onClick={() => onViewHistory(comparison.product.ean)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              📊 Voir l'évolution
            </button>
          )}
          {onCompareStores && (
            <button
              onClick={onCompareStores}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
            >
              🏪 Comparer magasins
            </button>
          )}
          {onCreateAlert && (
            <button
              onClick={() => onCreateAlert(comparison.product.ean)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
            >
              🔔 Créer une alerte
            </button>
          )}
        </div>
      </div>

      {/* Price List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Prix dans {comparison.metadata.totalStores} magasin
          {comparison.metadata.totalStores > 1 ? 's' : ''}
        </h3>

        {(comparison.pricesByStore || comparison.prices).map((priceData, index) => {
          const isExpanded = expandedPriceIndex === index;
          const isCheapest = index === 0;
          const isMostExpensive =
            index === (comparison.pricesByStore || comparison.prices).length - 1 &&
            (comparison.pricesByStore || comparison.prices).length > 1;
          const hasDistance = 'distance' in priceData && priceData.distance !== undefined;

          return (
            <div
              key={`${priceData.storeChain}-${priceData.storeName}-${index}`}
              className={`bg-white rounded-xl shadow border-2 transition-all ${
                isCheapest
                  ? 'border-green-300 shadow-green-100'
                  : isMostExpensive
                    ? 'border-red-300 shadow-red-100'
                    : 'border-gray-200'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Store Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold">#{priceData.rank}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{priceData.storeName}</h4>
                        <p className="text-sm text-gray-600">{priceData.storeChain}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <span>Observé {formatDate(priceData.observedAt)}</span>
                      {hasDistance && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                            📍 {(priceData.distance as number).toFixed(1)} km
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Price and Badge */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-3xl font-bold text-gray-900">
                      {priceData.price.toFixed(2)}€
                    </div>

                    <ReliabilityBadge
                      reliability={priceData.reliability}
                      source={priceData.source}
                      showDetails={false}
                      compact={true}
                    />

                    {/* Price Difference */}
                    {priceData.differenceFromCheapest.absolute > 0 && (
                      <div className="text-sm">
                        <span className="text-red-600 font-medium">
                          +{priceData.differenceFromCheapest.absolute.toFixed(2)}€
                        </span>
                        <span className="text-gray-500 ml-1">
                          (+{priceData.differenceFromCheapest.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    )}

                    {isCheapest && (
                      <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        ⭐ Meilleur prix
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => togglePriceDetails(index)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {isExpanded ? '▼ Masquer les détails' : '▶ Voir les détails'}
                  </button>

                  {onReportAnomaly && (
                    <button
                      onClick={() => onReportAnomaly(comparison.product.ean, priceData.storeName)}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      ⚠️ Signaler une anomalie
                    </button>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <ReliabilityBadge
                      reliability={priceData.reliability}
                      source={priceData.source}
                      showDetails={true}
                      compact={false}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Metadata Footer */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">Dernière mise à jour :</span>
          <span>{formatDate(comparison.metadata.mostRecentUpdate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Données collectées entre :</span>
          <span>
            {formatDate(comparison.metadata.oldestUpdate)} et{' '}
            {formatDate(comparison.metadata.mostRecentUpdate)}
          </span>
        </div>
        <div className="pt-2 border-t border-gray-300">
          <p className="text-xs italic">
            💡 Les prix affichés correspondent à des observations réelles vérifiées. La fiabilité
            indique la qualité et la fraîcheur des données.
          </p>
        </div>
      </div>
    </div>
  );
}
