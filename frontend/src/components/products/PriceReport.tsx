/**
 * PriceReport Component
 * Allows users to report prices with geolocation
 * 
 * Features:
 * - Price input with validation
 * - Store selection
 * - Automatic geolocation (with permission)
 * - Date/time capture
 * - Promo/special offer flag
 * 
 * Citizen Contribution:
 * - Helps build real-time price database
 * - Transparent source attribution
 * - Moderation before publication
 */

import { useState, useEffect } from 'react';

// Configuration constants
const MAX_PRICE_LIMIT = 10000; // Maximum reasonable price in euros

interface PriceReportProps {
  productEan: string;
  productName: string;
  onReportSuccess?: (reportId: string) => void;
  onCancel?: () => void;
}

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export default function PriceReport({
  productEan,
  productName,
  onReportSuccess,
  onCancel,
}: PriceReportProps) {
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('');
  const [isPromo, setIsPromo] = useState(false);
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  /**
   * Request geolocation on component mount
   */
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setLocationError(null);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setLocationError('Impossible d\'obtenir votre position. Veuillez l\'activer dans vos paramètres.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError('Géolocalisation non disponible sur cet appareil');
    }
  }, []);

  /**
   * Validate price input
   */
  const validatePrice = (value: string): boolean => {
    if (!value) {
      return false;
    }
    
    const priceNum = parseFloat(value.replace(',', '.'));
    return !isNaN(priceNum) && priceNum > 0 && priceNum < MAX_PRICE_LIMIT;
  };

  /**
   * Handle price submission
   */
  const handleSubmit = async () => {
    // Validation
    if (!validatePrice(price)) {
      setError('Veuillez entrer un prix valide (ex: 3.50)');
      return;
    }
    
    if (!store.trim()) {
      setError('Veuillez sélectionner ou saisir le nom du magasin');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would:
      // 1. Send price report to API
      // 2. Include geolocation data
      // 3. Create pending observation for moderation
      // 4. Return observation ID
      
      const reportData = {
        productEan,
        productName,
        price: parseFloat(price.replace(',', '.')),
        store: store.trim(),
        isPromo,
        comment: comment.trim() || null,
        location,
        reportedAt: new Date().toISOString(),
        source: 'observation_citoyenne',
      };
      
      console.log('Price report submitted:', reportData);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const mockReportId = `report-${Date.now()}`;
      
      setSuccess(true);
      
      // Call success callback after a brief delay
      setTimeout(() => {
        onReportSuccess?.(mockReportId);
      }, 1000);
      
    } catch (err) {
      console.error('Report submission error:', err);
      setError('Erreur lors de l\'envoi du signalement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Prix signalé avec succès !
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400">
            Merci pour votre contribution. Votre signalement sera vérifié puis publié.
          </p>
          
          <button
            onClick={onCancel}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Signaler un prix
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Product info */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Produit
          </p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {productName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            EAN: {productEan}
          </p>
        </div>

        {/* Price input */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Prix observé <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="3.50"
              className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              €
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Exemple : 3.50 ou 12.99
          </p>
        </div>

        {/* Store input */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Magasin <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="Ex: Carrefour, Leader Price, etc."
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Promo checkbox */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPromo}
            onChange={(e) => setIsPromo(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            🏷️ Ce prix est en promotion
          </span>
        </label>

        {/* Comment */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Commentaire (optionnel)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Informations complémentaires..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {comment.length}/500 caractères
          </p>
        </div>

        {/* Geolocation status */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="flex-1 text-sm">
              {location ? (
                <p className="text-gray-700 dark:text-gray-300">
                  📍 Position enregistrée (précision: {Math.round(location.accuracy)}m)
                </p>
              ) : locationError ? (
                <p className="text-orange-700 dark:text-orange-300">
                  ⚠️ {locationError}
                </p>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  📡 Récupération de votre position...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              {error}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!price || !store || loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Envoi en cours...
              </>
            ) : (
              'Envoyer le signalement'
            )}
          </button>
        </div>

        {/* Info message */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Vos signalements aident à maintenir une base de prix à jour pour tous les utilisateurs.
        </p>
      </div>
    </div>
  );
}
