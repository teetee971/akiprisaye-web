import React, { useState } from 'react';
import { MapPin, ShoppingCart, AlertCircle, Info, Navigation, Plus, Trash2, TrendingDown, Store, DollarSign } from 'lucide-react';
import { getShoppingRecommendations } from '../services/shoppingListService';

// Common products available in SEED_PRODUCTS
const PRODUITS_DISPONIBLES = [
  { name: 'Coca-Cola', category: 'boissons' },
  { name: 'Pâtes Panzani', category: 'épicerie' },
  { name: 'Lait Candia', category: 'frais' },
  { name: 'Riz', category: 'alimentaire_base' },
  { name: 'Pain', category: 'frais' },
  { name: 'Huile', category: 'alimentaire_base' },
  { name: 'Sucre', category: 'alimentaire_base' },
  { name: 'Farine', category: 'alimentaire_base' },
  { name: 'Eau', category: 'boissons' },
  { name: 'Café', category: 'boissons' },
];

const CATEGORIES = {
  'alimentaire_base': 'Produits de base',
  'frais': 'Produits frais',
  'boissons': 'Boissons',
  'épicerie': 'Épicerie',
  'hygiene': 'Hygiène',
};

export default function ListeCourses({ territoire = 'Guadeloupe' }) {
  const [shoppingList, setShoppingList] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, category: 'alimentaire_base' });
  const [userLocation, setUserLocation] = useState(null);
  const [gpsConsent, setGpsConsent] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Add item to shopping list
  const addItem = (product) => {
    if (!product.name.trim()) return;
    
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

  // Remove item
  const removeItem = (id) => {
    setShoppingList(shoppingList.filter(item => item.id !== id));
    setRecommendations(null); // Clear recommendations when list changes
  };

  // Update quantity
  const updateQuantity = (id, quantity) => {
    setShoppingList(shoppingList.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, parseInt(quantity) || 1) } : item
    ));
    setRecommendations(null); // Clear recommendations when quantities change
  };

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

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setUserLocation(location);
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        setGpsError('Impossible d\'obtenir votre position: ' + error.message);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Calculate recommendations
  const calculateRecommendations = () => {
    if (shoppingList.length === 0) {
      alert('Ajoutez des produits à votre liste d\'abord');
      return;
    }

    setCalculating(true);
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const recs = getShoppingRecommendations(shoppingList, territoire, userLocation);
      setRecommendations(recs);
      setCalculating(false);
    }, 300);
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
          Optimisation des courses avec PRIX RÉELS et géolocalisation
        </p>
      </div>

      {/* Transparency Notice */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-100">
            <p className="font-semibold mb-2">🔒 Transparence totale</p>
            <ul className="list-disc list-inside space-y-1 text-blue-200">
              <li><strong>Prix réels UNIQUEMENT</strong> - Aucun prix inventé</li>
              <li><strong>Sources publiques</strong> - Données vérifiables</li>
              <li><strong>GPS local</strong> - Jamais stocké ni transmis</li>
              <li><strong>Calculs explicables</strong> - Méthodologie transparente</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Shopping List Builder */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              Votre liste ({shoppingList.length} {shoppingList.length > 1 ? 'produits' : 'produit'})
            </h2>

            {/* Quick Add Buttons */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Ajouter rapidement:</label>
              <div className="flex flex-wrap gap-2">
                {PRODUITS_DISPONIBLES.slice(0, 6).map(product => (
                  <button
                    key={product.name}
                    onClick={() => addItem(product)}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 
                             text-blue-200 text-sm rounded transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {product.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                {showCustomInput ? '- Masquer le formulaire' : '+ Ajouter un autre produit'}
              </button>
            </div>

            {/* Custom Product Form */}
            {showCustomInput && (
              <div className="bg-slate-700/30 rounded p-3 mb-4 space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Nom du produit</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    placeholder="Ex: Coca-Cola, Lait, Riz..."
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
                      {Object.entries(CATEGORIES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => addItem(newItem)}
                  disabled={!newItem.name.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed 
                           text-white px-4 py-2 rounded font-medium flex items-center justify-center gap-2"
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
              <div className="space-y-2 mb-4">
                {shoppingList.map(item => (
                  <div key={item.id} className="bg-slate-700/50 rounded p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">{CATEGORIES[item.category]}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, e.target.value)}
                        className="w-16 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm text-center"
                      />
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Retirer"
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
              <div className="pt-4 border-t border-slate-700 space-y-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gpsConsent}
                    onChange={(e) => setGpsConsent(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-slate-300">
                    J'accepte l'utilisation de ma position GPS <strong>en local uniquement</strong> 
                    pour calculer les distances
                  </span>
                </label>

                <button
                  onClick={handleGetLocation}
                  disabled={!gpsConsent || gpsLoading || userLocation}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded font-medium ${
                    gpsConsent && !gpsLoading && !userLocation
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Navigation className="w-5 h-5" />
                  {gpsLoading ? 'Localisation...' : userLocation ? '✓ Position activée' : 'Activer la position GPS'}
                </button>

                {userLocation && (
                  <button
                    onClick={calculateRecommendations}
                    disabled={calculating}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed 
                             text-white px-4 py-3 rounded font-medium flex items-center justify-center gap-2"
                  >
                    <TrendingDown className="w-5 h-5" />
                    {calculating ? 'Calcul en cours...' : 'Calculer les meilleures options'}
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

        {/* Right Column: Recommendations */}
        <div className="space-y-4">
          {!recommendations ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-4">Recommandations</h2>
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {shoppingList.length === 0
                    ? 'Ajoutez des produits à votre liste'
                    : !userLocation
                    ? 'Activez votre position GPS puis cliquez sur "Calculer"'
                    : 'Cliquez sur "Calculer les meilleures options"'
                  }
                </p>
              </div>
            </div>
          ) : (
            <RecommendationsDisplay 
              recommendations={recommendations}
              calculating={calculating}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Recommendations Display Component
function RecommendationsDisplay({ recommendations, calculating }) {
  if (calculating) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white mb-4">Analyse en cours...</h2>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-400">Optimisation de vos courses...</p>
        </div>
      </div>
    );
  }

  if (recommendations.error) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white mb-4">Recommandations</h2>
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4">
          <p className="text-yellow-200">{recommendations.error}</p>
          {recommendations.transparency && (
            <p className="text-yellow-300 text-sm mt-2">{recommendations.transparency.message}</p>
          )}
        </div>
      </div>
    );
  }

  const { recommendation, transparency, singleStoreOption, multiStoreOption } = recommendations;

  return (
    <div className="space-y-4">
      {/* Transparency Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Informations de transparence
        </h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p>• Territoire: <strong className="text-white">{transparency.territory}</strong></p>
          <p>• Magasins analysés: <strong className="text-white">{transparency.totalStores}</strong></p>
          <p>• Articles dans votre liste: <strong className="text-white">{transparency.shoppingListItems}</strong></p>
          <p>• Source: <strong className="text-white">{transparency.dataSource}</strong></p>
          <p>• GPS utilisé: <strong className="text-white">{transparency.geolocationUsed ? 'Oui (local uniquement)' : 'Non'}</strong></p>
          <p className="mt-2 pt-2 border-t border-slate-700 text-yellow-400">⚠️ {transparency.disclaimer}</p>
        </div>
      </div>

      {/* Main Recommendation */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white mb-4">
          {recommendation.type === 'both' ? 'Deux options viables' : 'Recommandation'}
        </h2>

        {recommendation.type === 'none' ? (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4">
            <AlertCircle className="w-6 h-6 text-yellow-400 mb-2" />
            <p className="text-yellow-200">{recommendation.message}</p>
          </div>
        ) : recommendation.type === 'single_store' ? (
          <SingleStoreCard store={singleStoreOption} />
        ) : recommendation.type === 'multi_store' ? (
          <MultiStoreCard multiStore={multiStoreOption} />
        ) : (
          <BothOptionsCard 
            singleStore={singleStoreOption}
            multiStore={multiStoreOption}
            reasoning={recommendation.reasoning}
          />
        )}

        {recommendation.message && (
          <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded p-3">
            <p className="text-sm text-blue-200">
              <strong>Explication:</strong> {recommendation.message}
            </p>
          </div>
        )}
      </div>

      {/* Methodology Explanation */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">Méthodologie de calcul</h3>
        <div className="text-xs text-slate-400 space-y-2">
          <p>{transparency.methodology}</p>
          <p className="mt-2 text-green-400">✓ Tous les calculs sont basés sur des données réelles et vérifiables</p>
        </div>
      </div>
    </div>
  );
}

// Single Store Recommendation Card
function SingleStoreCard({ store }) {
  if (!store) return null;

  return (
    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">{store.store.name}</h3>
          </div>
          <p className="text-sm text-slate-400">{store.store.chain} • {store.store.city}</p>
          {store.store.distance && (
            <p className="text-xs text-slate-500 mt-1">📍 {store.store.distance.toFixed(1)} km</p>
          )}
        </div>
        <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded text-xs font-medium whitespace-nowrap">
          ✓ Recommandé
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-800/50 rounded p-3">
          <p className="text-xs text-slate-400 mb-1">Coût total estimé</p>
          <p className="text-2xl font-bold text-white flex items-center gap-1">
            <DollarSign className="w-5 h-5" />
            €{store.totalCost.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded p-3">
          <p className="text-xs text-slate-400 mb-1">Couverture</p>
          <p className="text-2xl font-bold text-white">{store.coverage.toFixed(0)}%</p>
          <p className="text-xs text-slate-500">{store.availableItems.length}/{store.totalItems} produits</p>
        </div>
      </div>

      {/* Available Items */}
      {store.availableItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-300">Produits disponibles avec prix réels:</p>
          {store.availableItems.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start bg-slate-800/30 rounded p-2 text-sm">
              <span className="text-slate-300">
                {item.name} 
                {item.quantity > 1 && <span className="text-slate-500"> (x{item.quantity})</span>}
              </span>
              <div className="text-right">
                <span className="text-white font-medium">€{item.totalPrice.toFixed(2)}</span>
                {item.quantity > 1 && (
                  <span className="text-xs text-slate-500 block">€{item.unitPrice.toFixed(2)}/unité</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unavailable Items */}
      {store.unavailableItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs font-semibold text-red-400 mb-2">
            Produits non disponibles ({store.unavailableItems.length}):
          </p>
          {store.unavailableItems.map((item, idx) => (
            <div key={idx} className="text-xs text-slate-500 mb-1">
              • {item.name} - {item.reason}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Multi-Store Recommendation Card
function MultiStoreCard({ multiStore }) {
  if (!multiStore || multiStore.storeCount === 0) return null;

  return (
    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-purple-400" />
            Optimisation multi-magasins
          </h3>
          <p className="text-sm text-slate-400">{multiStore.storeCount} {multiStore.storeCount > 1 ? 'magasins' : 'magasin'}</p>
        </div>
        <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded text-xs font-medium whitespace-nowrap">
          💰 Meilleur prix
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-800/50 rounded p-3">
          <p className="text-xs text-slate-400 mb-1">Coût total</p>
          <p className="text-2xl font-bold text-white flex items-center gap-1">
            <DollarSign className="w-5 h-5" />
            €{multiStore.totalCost.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded p-3">
          <p className="text-xs text-slate-400 mb-1">Distance totale</p>
          <p className="text-2xl font-bold text-white">{multiStore.totalDistance.toFixed(1)} km</p>
          <p className="text-xs text-slate-500">aller-retour</p>
        </div>
      </div>

      {/* Store Assignments */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-300">Itinéraire recommandé:</p>
        {multiStore.storeAssignments.map((assignment, idx) => (
          <div key={idx} className="bg-slate-800/50 rounded p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="text-white font-medium flex items-center gap-2">
                  <span className="bg-purple-500/20 text-purple-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  {assignment.store.name}
                </p>
                <p className="text-xs text-slate-400 ml-8">{assignment.store.city}</p>
              </div>
              <p className="text-white font-semibold">€{assignment.subtotal.toFixed(2)}</p>
            </div>
            <div className="ml-8 space-y-1">
              {assignment.items.map((item, itemIdx) => (
                <div key={itemIdx} className="text-xs text-slate-400 flex justify-between">
                  <span>• {item.name} {item.quantity > 1 && `(x${item.quantity})`}</span>
                  <span className="text-slate-300">€{item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Unavailable Items */}
      {multiStore.unavailableItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs font-semibold text-red-400 mb-2">
            Non disponibles ({multiStore.unavailableItems.length}):
          </p>
          {multiStore.unavailableItems.map((item, idx) => (
            <div key={idx} className="text-xs text-slate-500 mb-1">
              • {item.name} - {item.reason}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Both Options Comparison Card
function BothOptionsCard({ singleStore, multiStore, reasoning }) {
  return (
    <div className="space-y-4">
      {/* Comparison Summary */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4 text-center">
        <p className="text-sm text-blue-200 mb-2">
          Économie potentielle: <strong className="text-white text-lg">€{reasoning.savings.toFixed(2)}</strong>
          <span className="text-blue-300 ml-2">({reasoning.savingsPercent.toFixed(1)}%)</span>
        </p>
        <p className="text-xs text-blue-300">
          Distance supplémentaire: {reasoning.extraDistance.toFixed(1)} km
        </p>
      </div>

      {/* Single Store Option */}
      <div>
        <p className="text-xs text-slate-400 mb-2 flex items-center gap-2">
          <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded text-xs font-medium">
            Option 1
          </span>
          Un seul magasin (pratique)
        </p>
        <SingleStoreCard store={singleStore} />
      </div>

      {/* Multi-Store Option */}
      <div>
        <p className="text-xs text-slate-400 mb-2 flex items-center gap-2">
          <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-xs font-medium">
            Option 2
          </span>
          Multi-magasins (économique)
        </p>
        <MultiStoreCard multiStore={multiStore} />
      </div>
    </div>
  );
}
