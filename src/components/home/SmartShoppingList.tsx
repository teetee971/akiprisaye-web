/**
 * ⑯ Smart Shopping List - Personalized Repurchase Suggestions
 * 
 * Analyzes recently scanned/viewed products and suggests when to rebuy
 * based on favorable prices.
 * 
 * Psychological effect: "The app knows my habits" → Very high retention
 * 
 * Features:
 * - Recently viewed/scanned products
 * - "Buy now?" alerts when price is favorable
 * - Savings vs last purchase
 * - Quick add to shopping list
 * - Price trend indicators
 * 
 * Data: 100% safeLocalStorage (GDPR-compliant)
 */

import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/glass-card';
import { safeLocalStorage } from '../../utils/safeLocalStorage';

interface ProductSuggestion {
  id: string;
  name: string;
  category: string;
  lastPurchasePrice: number;
  currentPrice: number;
  lowestPrice: number;
  lastPurchaseDate: string;
  daysSinceLastPurchase: number;
  priceAlert: 'favorable' | 'normal' | 'high';
  savings: number;
  savingsPercent: number;
  store: string;
}

export function SmartShoppingList() {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'favorable' | 'due'>('all');

  useEffect(() => {
    loadSmartSuggestions();
  }, []);

  const loadSmartSuggestions = () => {
    // Load from safeLocalStorage
    const recentProducts = safeLocalStorage.getItem('recentProducts:v1');
    const purchaseHistory = safeLocalStorage.getItem('purchaseHistory:v1');

    if (recentProducts && purchaseHistory) {
      const recent = JSON.parse(recentProducts);
      const history = JSON.parse(purchaseHistory);
      
      const analyzed = analyzeRepurchaseSuggestions(recent, history);
      setSuggestions(analyzed);
    } else {
      // Example data for demo
      const exampleSuggestions: ProductSuggestion[] = [
        {
          id: 'prod-1',
          name: 'Lait demi-écrémé 1L',
          category: 'Produits laitiers',
          lastPurchasePrice: 1.45,
          currentPrice: 1.25,
          lowestPrice: 1.20,
          lastPurchaseDate: '2026-01-01',
          daysSinceLastPurchase: 6,
          priceAlert: 'favorable',
          savings: 0.20,
          savingsPercent: 13.8,
          store: 'Super U Jarry'
        },
        {
          id: 'prod-2',
          name: 'Pain de mie complet',
          category: 'Boulangerie',
          lastPurchasePrice: 2.10,
          currentPrice: 1.95,
          lowestPrice: 1.85,
          lastPurchaseDate: '2026-01-03',
          daysSinceLastPurchase: 4,
          priceAlert: 'favorable',
          savings: 0.15,
          savingsPercent: 7.1,
          store: 'Carrefour Destreland'
        },
        {
          id: 'prod-3',
          name: 'Jus d\'orange 1L',
          category: 'Boissons',
          lastPurchasePrice: 2.50,
          currentPrice: 2.80,
          lowestPrice: 2.35,
          lastPurchaseDate: '2025-12-28',
          daysSinceLastPurchase: 10,
          priceAlert: 'high',
          savings: -0.30,
          savingsPercent: -12.0,
          store: 'Leader Price'
        },
        {
          id: 'prod-4',
          name: 'Riz basmati 1kg',
          category: 'Épicerie',
          lastPurchasePrice: 3.20,
          currentPrice: 3.20,
          lowestPrice: 2.95,
          lastPurchaseDate: '2025-12-20',
          daysSinceLastPurchase: 18,
          priceAlert: 'normal',
          savings: 0,
          savingsPercent: 0,
          store: 'Super U'
        }
      ];
      setSuggestions(exampleSuggestions);
    }
    
    setLoading(false);
  };

  const analyzeRepurchaseSuggestions = (recent: any[], history: any[]): ProductSuggestion[] => {
    // Analyze purchase patterns and current prices
    // In real implementation, this would use actual pricing data
    return [];
  };

  const addToShoppingList = (productId: string) => {
    const existingList = safeLocalStorage.getItem('shoppingList:v1');
    const list = existingList ? JSON.parse(existingList) : [];
    
    const product = suggestions.find(p => p.id === productId);
    if (product && !list.find((item: any) => item.id === productId)) {
      list.push({
        id: product.id,
        name: product.name,
        targetStore: product.store,
        targetPrice: product.currentPrice,
        addedAt: new Date().toISOString()
      });
      safeLocalStorage.setItem('shoppingList:v1', JSON.stringify(list));
      
      // Show feedback (in real app, would use toast notification)
      alert(`✅ "${product.name}" ajouté à votre liste de courses`);
    }
  };

  const getPriceAlertBadge = (alert: string) => {
    switch (alert) {
      case 'favorable':
        return {
          text: '✅ Racheter maintenant',
          className: 'bg-green-500/20 text-green-400 border-green-500/30'
        };
      case 'high':
        return {
          text: '⏳ Attendre une baisse',
          className: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
      default:
        return {
          text: '→ Prix stable',
          className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
    }
  };

  const getFilteredSuggestions = () => {
    switch (filter) {
      case 'favorable':
        return suggestions.filter(s => s.priceAlert === 'favorable');
      case 'due':
        return suggestions.filter(s => s.daysSinceLastPurchase >= 7);
      default:
        return suggestions;
    }
  };

  const filteredSuggestions = getFilteredSuggestions();
  const favorableCount = suggestions.filter(s => s.priceAlert === 'favorable').length;

  if (loading) {
    return (
      <GlassCard className="animate-pulse">
        <div className="h-64 bg-gray-700/30 rounded"></div>
      </GlassCard>
    );
  }

  if (suggestions.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <span className="text-6xl mb-4 block">🛒</span>
        <h3 className="text-xl font-bold text-white mb-2">
          Aucune suggestion pour le moment
        </h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Scannez vos produits et effectuez des recherches pour recevoir des suggestions personnalisées de rachat.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          <div>
            <h3 className="text-xl font-bold text-white">Ma Prochaine Course</h3>
            <p className="text-sm text-gray-400">
              Suggestions basées sur vos habitudes
            </p>
          </div>
        </div>
        {favorableCount > 0 && (
          <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/30">
            {favorableCount} bons plans
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            filter === 'all'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 border border-gray-700/30'
          }`}
        >
          Tous ({suggestions.length})
        </button>
        <button
          onClick={() => setFilter('favorable')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            filter === 'favorable'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 border border-gray-700/30'
          }`}
        >
          Prix favorables ({favorableCount})
        </button>
        <button
          onClick={() => setFilter('due')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            filter === 'due'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 border border-gray-700/30'
          }`}
        >
          À racheter ({suggestions.filter(s => s.daysSinceLastPurchase >= 7).length})
        </button>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {filteredSuggestions.map(product => {
          const badge = getPriceAlertBadge(product.priceAlert);
          
          return (
            <div
              key={product.id}
              className="glass p-4 rounded-lg border border-gray-700/50 hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Product Name & Category */}
                  <h4 className="font-semibold text-white mb-1">{product.name}</h4>
                  <div className="text-xs text-gray-500 mb-2">{product.category}</div>

                  {/* Price Alert Badge */}
                  <div className={`inline-block px-2 py-1 rounded text-xs font-medium border mb-2 ${badge.className}`}>
                    {badge.text}
                  </div>

                  {/* Price Comparison */}
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Dernier achat: </span>
                      <span className="text-white font-medium">{product.lastPurchasePrice.toFixed(2)}€</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Maintenant: </span>
                      <span className={`font-bold ${
                        product.savings > 0 ? 'text-green-400' : 
                        product.savings < 0 ? 'text-red-400' : 'text-gray-300'
                      }`}>
                        {product.currentPrice.toFixed(2)}€
                      </span>
                    </div>
                  </div>

                  {/* Savings */}
                  {product.savings !== 0 && (
                    <div className="text-sm mt-2">
                      <span className={product.savings > 0 ? 'text-green-400' : 'text-red-400'}>
                        {product.savings > 0 ? '↓' : '↑'} {Math.abs(product.savings).toFixed(2)}€ 
                        ({Math.abs(product.savingsPercent).toFixed(1)}%)
                      </span>
                      <span className="text-gray-500"> vs dernier achat</span>
                    </div>
                  )}

                  {/* Store & Days Since Purchase */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>📍 {product.store}</span>
                    <span>•</span>
                    <span>🕒 Il y a {product.daysSinceLastPurchase} jours</span>
                  </div>
                </div>

                {/* Add to List Button */}
                <button
                  onClick={() => addToShoppingList(product.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all transform hover:scale-105 whitespace-nowrap"
                  aria-label={`Ajouter ${product.name} à la liste`}
                >
                  + Liste
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State for Filtered View */}
      {filteredSuggestions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          Aucun produit dans cette catégorie
        </div>
      )}

      {/* Data Attribution */}
      <div className="mt-6 pt-4 border-t border-gray-700/50 text-xs text-gray-500 text-center">
        🎯 Suggestions personnalisées • Données locales • Outil d'information
      </div>
    </GlassCard>
  );
}
