import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveBasketToHistory } from '../services/tiPanieService';
import PriceBadge from '../components/PriceBadge';

export default function BasketCard({ basket }) {
  const navigate = useNavigate();
  const { user } = useAuth();

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

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewOnMap();
          }}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-sm"
        >
          📍 Voir sur la carte
        </button>
      </div>
    </div>
  );
}
