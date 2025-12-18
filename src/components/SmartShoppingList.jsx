import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  MapPin, 
  TrendingDown, 
  Navigation, 
  Info, 
  AlertCircle,
  Check,
  X,
  Plus,
  Trash2,
  Store,
  Route
} from 'lucide-react';
import {
  getShoppingRecommendations,
  getStoresWithDistances,
} from '../services/smartShoppingListService';

// Common product categories for French territories
const PRODUCT_CATEGORIES = {
  'alimentaire_base': {
    nom: 'Produits alimentaires de base',
    examples: ['Riz', 'Pâtes', 'Farine', 'Sucre', 'Huile', 'Eau']
  },
  'frais': {
    nom: 'Produits frais',
    examples: ['Lait', 'Pain', 'Fruits', 'Légumes', 'Viande', 'Poisson', 'Fromage']
  },
  'boissons': {
    nom: 'Boissons',
    examples: ['Coca-Cola', 'Jus', 'Eau minérale', 'Café', 'Thé']
  },
  'epicerie': {
    nom: 'Épicerie',
    examples: ['Conserves', 'Sauces', 'Condiments']
  },
  'hygiene': {
    nom: 'Hygiène',
    examples: ['Shampooing', 'Savon', 'Dentifrice']
  },
  'entretien': {
    nom: 'Entretien',
    examples: ['Lessive', 'Produits ménagers']
  }
};

const COMMON_PRODUCTS = [
  { name: 'Coca-Cola', category: 'boissons' },
  { name: 'Pâtes Panzani', category: 'epicerie' },
  { name: 'Lait Candia', category: 'frais' },
  { name: 'Riz', category: 'alimentaire_base' },
  { name: 'Pain', category: 'frais' },
  { name: 'Huile', category: 'alimentaire_base' },
  { name: 'Sucre', category: 'alimentaire_base' },
  { name: 'Farine', category: 'alimentaire_base' },
  { name: 'Eau', category: 'boissons' },
  { name: 'Café', category: 'boissons' },
];

export default function SmartShoppingList({ territoire = 'Guadeloupe' }) {
  const [shoppingList, setShoppingList] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, category: 'alimentaire_base' });
  const [userLocation, setUserLocation] = useState(null);
  const [gpsConsent, setGpsConsent] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Get user location
  const handleGetLocation = () => {
    if (!gpsConsent) {
      alert('Vous devez accepter l\'utilisation de la géolocalisation');
      return;
    }

    if (!navigator.geolocation) {
      setGpsError('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setUserLocation(location);
        setLoading(false);
        
        // Auto-calculate recommendations if list has items
        if (shoppingList.length > 0) {
          calculateRecommendations(location);
        }
      },
      (error) => {
        setLoading(false);
        setGpsError('Impossible d\'obtenir votre position: ' + error.message);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Add item to shopping list
  const addItem = (product) => {
    if (!product.name.trim()) return;
    
    // Check if item already exists
    const exists = shoppingList.find(item => 
      item.name.toLowerCase() === product.name.toLowerCase()
    );
    
    if (exists) {
      alert('Ce produit est déjà dans votre liste');
      return;
    }
    
    setShoppingList([...shoppingList, { ...product, id: Date.now() }]);
    setNewItem({ name: '', quantity: 1, category: 'alimentaire_base' });
    setShowCustomInput(false);
  };

  // Remove item from shopping list
  const removeItem = (id) => {
    setShoppingList(shoppingList.filter(item => item.id !== id));
  };

  // Update item quantity
  const updateQuantity = (id, quantity) => {
    setShoppingList(shoppingList.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, parseInt(quantity) || 1) } : item
    ));
  };

  // Calculate recommendations
  const calculateRecommendations = (location = userLocation) => {
    if (shoppingList.length === 0) {
      alert('Ajoutez des produits à votre liste d\'abord');
      return;
    }

    setLoading(true);
    
    // Simulate async operation
    setTimeout(() => {
      const recs = getShoppingRecommendations(shoppingList, territoire, location);
      setRecommendations(recs);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8" />
          Liste de Courses Intelligente
        </h1>
        <p className="text-blue-200">
          Optimisez vos courses avec les vrais prix et distances
        </p>
      </div>

      {/* Data Transparency Notice */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-100">
            <p className="font-semibold mb-2">Transparence des données</p>
            <ul className="list-disc list-inside space-y-1 text-blue-200">
              <li><strong>Prix réels uniquement</strong> - Basés sur données publiques disponibles</li>
              <li><strong>Aucun prix inventé</strong> - Si indisponible, clairement indiqué</li>
              <li><strong>Géolocalisation locale</strong> - Jamais stockée ni transmise</li>
              <li><strong>Calculs transparents</strong> - Méthodologie explicable</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Shopping List Builder */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              Votre liste ({shoppingList.length} {shoppingList.length > 1 ? 'produits' : 'produit'})
            </h2>

            {/* Quick Add from Common Products */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Produits courants:</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_PRODUCTS.slice(0, 6).map(product => (
                  <button
                    key={product.name}
                    onClick={() => addItem(product)}
                    className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 
                             text-blue-200 text-sm rounded transition-colors"
                  >
                    + {product.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                {showCustomInput ? 'Masquer' : 'Ajouter un autre produit'}
              </button>
            </div>

            {/* Custom Product Input */}
            {showCustomInput && (
              <div className="bg-slate-700/30 rounded p-3 mb-4 space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Nom du produit</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    placeholder="Ex: Coca-Cola, Pâtes, Lait..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Quantité</label>
                    <input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Catégorie</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    >
                      {Object.entries(PRODUCT_CATEGORIES).map(([key, cat]) => (
                        <option key={key} value={key}>{cat.nom}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => addItem(newItem)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium 
                           flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter à la liste
                </button>
              </div>
            )}

            {/* Shopping List Items */}
            {shoppingList.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Votre liste est vide</p>
                <p className="text-sm mt-1">Ajoutez des produits pour commencer</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shoppingList.map(item => (
                  <div key={item.id} className="bg-slate-700/50 rounded p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        {PRODUCT_CATEGORIES[item.category]?.nom}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, e.target.value)}
                        className="w-16 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
                      />
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Geolocation Section */}
            {shoppingList.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gpsConsent}
                    onChange={(e) => setGpsConsent(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-slate-300">
                    J'accepte l'utilisation de ma position GPS <strong>en local uniquement</strong> 
                    pour calculer les distances et optimiser mes courses
                  </span>
                </label>

                <button
                  onClick={handleGetLocation}
                  disabled={!gpsConsent || loading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded font-medium ${
                    gpsConsent && !loading
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Navigation className="w-5 h-5" />
                  {loading ? 'Localisation en cours...' : userLocation ? 'Position activée ✓' : 'Activer ma position'}
                </button>

                {userLocation && (
                  <button
                    onClick={() => calculateRecommendations()}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded font-medium 
                             flex items-center justify-center gap-2"
                  >
                    <TrendingDown className="w-5 h-5" />
                    {loading ? 'Calcul en cours...' : 'Calculer les meilleures options'}
                  </button>
                )}

                {gpsError && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded p-3">
                    <p className="text-red-300 text-sm">{gpsError}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Recommendations */}
        <div className="space-y-4">
          <RecommendationsPanel 
            recommendations={recommendations} 
            loading={loading}
            hasLocation={!!userLocation}
          />
        </div>
      </div>
    </div>
  );
}

// Recommendations Panel Component
function RecommendationsPanel({ recommendations, loading, hasLocation }) {
  if (!recommendations && !loading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white mb-4">Recommandations</h2>
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">
            {hasLocation 
              ? 'Cliquez sur "Calculer les meilleures options" pour voir les recommandations'
              : 'Activez votre position pour voir les recommandations'
            }
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white mb-4">Recommandations</h2>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-400">Calcul des meilleures options...</p>
        </div>
      </div>
    );
  }

  const { recommendation, transparency, matchedItems, bestSingleStore, multiStoreOption } = recommendations;

  return (
    <div className="space-y-4">
      {/* Transparency Info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Transparence des données
        </h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p>• Produits demandés: <strong className="text-white">{transparency.totalItemsRequested}</strong></p>
          <p>• Produits trouvés: <strong className="text-white">{transparency.totalItemsMatched}</strong></p>
          <p>• Avec prix réels: <strong className="text-white">{transparency.totalItemsWithPrices}</strong></p>
          <p>• Source: <strong className="text-white">{transparency.dataSource}</strong></p>
          <p className="mt-2 text-yellow-400">⚠️ {transparency.disclaimer}</p>
        </div>
      </div>

      {/* Main Recommendation */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white mb-4">Recommandation</h2>
        
        {recommendation.type === 'none' ? (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4">
            <p className="text-yellow-200">{recommendation.reasoning}</p>
          </div>
        ) : recommendation.type === 'single_store' ? (
          <SingleStoreCard store={bestSingleStore} />
        ) : recommendation.type === 'multi_store' ? (
          <MultiStoreCard option={multiStoreOption} />
        ) : (
          <BothOptionsCard 
            singleStore={bestSingleStore} 
            multiStore={multiStoreOption}
            comparison={recommendation.comparison}
          />
        )}
        
        <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded p-3">
          <p className="text-sm text-blue-200">
            <strong>Raisonnement:</strong> {recommendation.reasoning}
          </p>
        </div>
      </div>
    </div>
  );
}

// Single Store Card
function SingleStoreCard({ store }) {
  if (!store) return null;

  return (
    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{store.store.name}</h3>
          <p className="text-sm text-slate-400">{store.store.chain}</p>
          <p className="text-xs text-slate-500">{store.store.city}</p>
        </div>
        <div className="text-right">
          <div className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs font-medium">
            Recommandé
          </div>
          {store.store.distance && (
            <p className="text-sm text-slate-400 mt-1">{store.store.distance.toFixed(1)} km</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-slate-400">Coût total estimé</p>
          <p className="text-2xl font-bold text-white">€{store.totalCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Couverture</p>
          <p className="text-2xl font-bold text-white">{store.coverage.toFixed(0)}%</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-300">Produits disponibles ({store.availableItems.length}):</p>
        {store.itemDetails.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-slate-300">
              {item.name} {item.quantity > 1 && `(x${item.quantity})`}
            </span>
            {item.totalPrice !== null ? (
              <span className="text-white font-medium">€{item.totalPrice.toFixed(2)}</span>
            ) : (
              <span className="text-red-400 text-xs">Non disponible</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Multi Store Card
function MultiStoreCard({ option }) {
  if (!option || option.totalStores === 0) return null;

  return (
    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Optimisation multi-magasins</h3>
          <p className="text-sm text-slate-400">{option.totalStores} magasins</p>
        </div>
        <div className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs font-medium">
          Meilleur prix
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-slate-400">Coût total</p>
          <p className="text-2xl font-bold text-white">€{option.totalCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Distance totale</p>
          <p className="text-2xl font-bold text-white">{option.totalDistance.toFixed(1)} km</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-300">Itinéraire recommandé:</p>
        {option.stores.map((storeInfo, idx) => (
          <div key={idx} className="bg-slate-700/50 rounded p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white font-medium">{storeInfo.store.name}</p>
                <p className="text-xs text-slate-400">{storeInfo.store.city}</p>
              </div>
              <p className="text-white font-semibold">€{storeInfo.totalCost.toFixed(2)}</p>
            </div>
            <p className="text-xs text-slate-500">{storeInfo.items.length} produit(s)</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Both Options Card
function BothOptionsCard({ singleStore, multiStore, comparison }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 text-center">
        <p className="text-sm text-blue-200 mb-2">Économie potentielle: <strong className="text-white">€{comparison.savings.toFixed(2)}</strong> ({comparison.savingsPercent.toFixed(1)}%)</p>
        <p className="text-xs text-blue-300">Distance supplémentaire: {comparison.extraDistance.toFixed(1)} km</p>
      </div>
      
      <div className="grid gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-2">Option 1: Un seul magasin</p>
          <SingleStoreCard store={singleStore} />
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2">Option 2: Multi-magasins</p>
          <MultiStoreCard option={multiStore} />
        </div>
      </div>
    </div>
  );
}
