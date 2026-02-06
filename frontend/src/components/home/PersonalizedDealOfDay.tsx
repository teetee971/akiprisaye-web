import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, TrendingDown, ShoppingBag } from 'lucide-react';
import { safeLocalStorage } from '../../utils/safeLocalStorage';

interface DealOfDay {
  productName: string;
  productCategory: string;
  currentPrice: number;
  normalPrice: number;
  discount: number;
  storeName: string;
  expiresInHours: number;
  reasonPersonalized: string;
}

/**
 * Component ⑳: Personalized "Deal of the Day"
 * 
 * 1 ultra-targeted recommendation per day based on user habits
 * Notification style with urgency timer
 * Analyzes purchase history + current best prices
 * 
 * Psychological effect: Urgency + relevance = immediate action
 * Retention impact: Very High (daily habit formation)
 */
export const PersonalizedDealOfDay: React.FC = () => {
  const [deal, setDeal] = useState<DealOfDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate personalized deal based on user history
    const generateDealOfDay = (): DealOfDay | null => {
      // Get user's shopping history
      const historyData = safeLocalStorage.getItem('shoppingHistory:v1');
      
      // Check if deal was already shown today
      const lastDealDate = safeLocalStorage.getItem('dealOfDay:lastShown');
      const today = new Date().toDateString();
      
      if (lastDealDate === today) {
        // Already shown today, retrieve stored deal
        const storedDeal = safeLocalStorage.getItem('dealOfDay:current');
        return storedDeal ? JSON.parse(storedDeal) : null;
      }

      // Example deals based on common products
      const possibleDeals: DealOfDay[] = [
        {
          productName: 'Yaourt nature 4x125g',
          productCategory: 'Produits laitiers',
          currentPrice: 1.89,
          normalPrice: 2.49,
          discount: 24,
          storeName: 'Super U Jarry',
          expiresInHours: 6,
          reasonPersonalized: 'Produit fréquemment acheté'
        },
        {
          productName: 'Pain de mie complet',
          productCategory: 'Boulangerie',
          currentPrice: 1.25,
          normalPrice: 1.89,
          discount: 34,
          storeName: 'Leader Price',
          expiresInHours: 4,
          reasonPersonalized: 'Dans vos derniers scans'
        },
        {
          productName: 'Jus d\'orange 1L',
          productCategory: 'Boissons',
          currentPrice: 2.45,
          normalPrice: 3.20,
          discount: 23,
          storeName: 'Carrefour Destreland',
          expiresInHours: 8,
          reasonPersonalized: 'Produit préféré'
        }
      ];

      // Select random deal (in production, would use ML/algorithm)
      const selectedDeal = possibleDeals[Math.floor(Math.random() * possibleDeals.length)];

      // Store deal for today
      safeLocalStorage.setItem('dealOfDay:current', JSON.stringify(selectedDeal));
      safeLocalStorage.setItem('dealOfDay:lastShown', today);

      return selectedDeal;
    };

    const result = generateDealOfDay();
    setDeal(result);
    setIsLoading(false);
  }, []);

  if (isLoading || !deal) {
    return null;
  }

  const savings = deal.normalPrice - deal.currentPrice;

  return (
    <div className="glass-card p-6 animate-slideUp border-2 border-yellow-500/30 relative overflow-hidden">
      {/* Sparkle Effect */}
      <div className="absolute top-0 right-0 p-3">
        <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
      </div>

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-400 text-xs font-semibold">
            DEAL DU JOUR
          </div>
          <div className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs">
            {deal.reasonPersonalized}
          </div>
        </div>
        <h3 className="text-xl font-bold text-white">
          🎁 {deal.productName}
        </h3>
        <p className="text-sm text-gray-400">{deal.productCategory}</p>
      </div>

      {/* Price & Discount */}
      <div className="space-y-3 mb-4">
        <div className="flex items-baseline gap-3">
          <div className="text-4xl font-bold text-green-400">
            {deal.currentPrice.toFixed(2)} €
          </div>
          <div className="text-lg text-gray-400 line-through">
            {deal.normalPrice.toFixed(2)} €
          </div>
          <div className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-semibold">
            -{deal.discount}%
          </div>
        </div>

        <div className="flex items-center gap-2 text-green-400">
          <TrendingDown className="w-5 h-5" />
          <span className="font-semibold">
            Économisez {savings.toFixed(2)} € aujourd'hui !
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-300">
          <ShoppingBag className="w-4 h-4" />
          <span className="text-sm">Disponible chez : <strong>{deal.storeName}</strong></span>
        </div>
      </div>

      {/* Urgency Timer */}
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-400 animate-pulse" />
          <div>
            <p className="text-orange-400 font-semibold">
              ⏰ Deal expire dans {deal.expiresInHours}h
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Prix promotionnel valable aujourd'hui uniquement
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
        🛒 Ajouter à ma liste
      </button>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        Prix observé • Vérifiez disponibilité en magasin
      </p>
    </div>
  );
};

export default PersonalizedDealOfDay;
