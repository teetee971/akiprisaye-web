import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveBasketToHistory } from '../services/tiPanieService';
import { compareBasketAcrossTerritories } from '../utils/priceAnalysis';
import { saveBasketSnapshot, getTrend } from '../utils/priceHistory';
import PriceBadge from '../components/PriceBadge';
import BasketTerritoryComparison from './BasketTerritoryComparison';
import TrendIndicator from './TrendIndicator';

export default function BasketCard({ basket, selectedTerritories }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Automatically save price snapshot when basket is displayed
  useEffect(() => {
    if (basket && basket.id && basket.price) {
      // Save snapshot for each selected territory
      if (selectedTerritories && selectedTerritories.length > 0) {
        selectedTerritories.forEach(territoryId => {
          const price = basket.prices?.[territoryId] || basket.price;
          saveBasketSnapshot(String(basket.id), territoryId, price);
        });
      } else {
        // Fallback: save for basket's default territory
        const territoryId = basket.territory || 'GP';
        saveBasketSnapshot(String(basket.id), territoryId, basket.price);
      }
    }
  }, [basket, selectedTerritories]);

  const handleViewOnMap = () => {
    // Navigate to map with the basket's location
    navigate(`/carte?lat=${basket.lat}&lon=${basket.lon}`);
  };

  const handleCardClick = async () => {
    // Save to history if user is logged in
    if (user) {
      await saveBasketToHistory(user.uid, basket);
    }
  };

  // Calculate territory comparison if multiple territories selected
  let territoryComparison = null;
  if (selectedTerritories && selectedTerritories.length > 1) {
    // Build price map from basket data
    // Assuming basket has prices per territory or we use the same price for all
    const priceMap = {};
    selectedTerritories.forEach(territoryId => {
      // If basket has territory-specific prices, use them
      // Otherwise use the base price (same for all territories)
      priceMap[territoryId] = basket.prices?.[territoryId] || basket.price || 0;
    });

    territoryComparison = compareBasketAcrossTerritories(priceMap, selectedTerritories);
  }

  // Get trend for primary territory (first selected or basket's territory)
  const primaryTerritory = selectedTerritories?.[0] || basket.territory || 'GP';
  const trend = getTrend(primaryTerritory, 'week', String(basket.id));

  return (
    <div
      onClick={handleCardClick}
      className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden hover:border-blue-500 transition cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-48 bg-slate-800">
        <img
          src={basket.image}
          alt={basket.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext fill="%2394a3b8" x="50" y="50" text-anchor="middle" dy=".3em"%3E🧺%3C/text%3E%3C/svg%3E';
          }}
        />
        {/* Savings Badge */}
        <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
          -{basket.savings}%
        </div>
        {/* Stock Status */}
        {!basket.stock && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Épuisé
          </div>
        )}
        {basket.stock > 0 && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            En stock
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-100 mb-2">
          {basket.name}
        </h3>
        
        <p className="text-slate-400 text-sm mb-3">
          {basket.description}
        </p>

        {/* Store Info */}
        <div className="flex items-center text-slate-300 text-sm mb-2">
          <span className="mr-2">🏪</span>
          <span>{basket.store}</span>
        </div>

        {/* Time Slot */}
        <div className="flex items-center text-slate-300 text-sm mb-3">
          <span className="mr-2">🕐</span>
          <span>{basket.timeSlot}</span>
        </div>

        {/* Price with AI indicator */}
        <div className="mb-3">
          <PriceBadge
            price={basket.price}
            originalPrice={basket.originalPrice || basket.estimatedValue}
            aiAdjustedAt={basket.aiAdjustedAt}
            showSavings={true}
          />
        </div>

        {/* Trend Indicator (only if historical data available) */}
        {trend && trend.direction !== 'unknown' && (
          <div className="mb-3">
            <TrendIndicator
              direction={trend.direction}
              percentageChange={trend.percentageChange}
              period="week"
              showPercentage={true}
            />
          </div>
        )}

        {/* Territory Comparison (only if multiple territories selected) */}
        {territoryComparison && territoryComparison.length > 1 && (
          <BasketTerritoryComparison comparison={territoryComparison} basket={basket} />
        )}

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewOnMap();
          }}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-sm mt-3"
        >
          📍 Voir sur la carte
        </button>
      </div>
    </div>
  );
}
