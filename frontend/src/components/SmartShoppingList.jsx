import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  getProductByEan,
  getPricesByEan,
  getStoresByTerritory,
  calculateDistance as calcDist,
} from '../services/shoppingListService';
import { db } from '../lib/firebase';
import { solveShoppingRoute } from '../utils/routeOptimization';
import { trackTrip } from '../utils/shoppingStats';
import { OPTIMIZATION_MODES, DEFAULT_OPTIMIZATION_MODE } from '../config/optimizationModes';
import { LOCATION_THRESHOLDS } from '../config/thresholds';
import { DATA_FRESHNESS } from '../config/periods';
import {
  ShoppingCart,
  AlertCircle,
  Info,
  Navigation,
  Plus,
  X,
  Save,
  Download,
  MapPin,
  Trash2,
} from 'lucide-react';

export default function SmartShoppingList({ territoire = 'Guadeloupe' }) {
  const [shoppingList, setShoppingList] = useState([]);
  const [newItem, setNewItem] = useState({
    product_name: '',
    category: '',
    quantity_needed: 1,
    unit: 'unité',
    brand: '',
    ean: '',
  });
  const [gpsConsent, setGpsConsent] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(LOCATION_THRESHOLDS.DEFAULT_SEARCH_RADIUS_KM); // km
  const [selectedMode, setSelectedMode] = useState(DEFAULT_OPTIMIZATION_MODE);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [hasAttemptedOptimization, setHasAttemptedOptimization] = useState(false);

  const dbAvailable = !!db;
  const geolocStatus = !gpsConsent
    ? 'awaiting'
    : gpsError
      ? 'error'
      : userLocation
        ? 'active'
        : 'pending';

  // Request GPS location (opt-in only)
  const requestLocation = () => {
    if (!gpsConsent) {
      toast.error(
        'Vous devez donner votre consentement explicite pour utiliser la géolocalisation.'
      );
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        setGpsError(`Erreur de géolocalisation: ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Add item to shopping list
  const addItemToList = () => {
    if (!newItem.product_name || !newItem.category) {
      toast.error('Nom du produit et catégorie sont obligatoires');
      return;
    }

    // Add territory as mandatory
    const itemWithTerritory = {
      ...newItem,
      territory: territoire,
      id: Date.now(),
    };

    setShoppingList([...shoppingList, itemWithTerritory]);
    setNewItem({
      product_name: '',
      category: '',
      quantity_needed: 1,
      unit: 'unité',
      brand: '',
      ean: '',
    });
  };

  // Handle form submission
  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    addItemToList();
  };

  // Remove item from list
  const removeItem = (id) => {
    setShoppingList(shoppingList.filter((item) => item.id !== id));
  };

  // Calculate distance using Haversine formula
  const calculateDistance = calcDist;

  // Match items with REAL observed products only
  const matchProductsWithObservations = async () => {
    setLoading(true);
    const matchedProducts = [];

    for (const item of shoppingList) {
      if (item.ean) {
        try {
          // Try to get real product data
          const product = await getProductByEan(item.ean);
          if (product) {
            // Get actual observed prices
            const prices = await getPricesByEan(item.ean, {
              maxAgeHours: DATA_FRESHNESS.PRICE_DATA_MAX_AGE_HOURS,
              territory: territoire,
            });
            matchedProducts.push({
              ...item,
              matchedProduct: product,
              observedPrices: prices,
              dataAvailable: prices.length > 0,
            });
          } else {
            // NO SUBSTITUTION - show "Data unavailable"
            matchedProducts.push({
              ...item,
              dataAvailable: false,
              message: 'Données non disponibles pour ce produit',
            });
          }
        } catch (_error) {
          matchedProducts.push({
            ...item,
            dataAvailable: false,
            message: 'Erreur lors de la récupération des données',
          });
        }
      } else {
        // No EAN - cannot match
        matchedProducts.push({
          ...item,
          dataAvailable: false,
          message: 'Code EAN requis pour la correspondance produit',
        });
      }
    }

    setLoading(false);
    return matchedProducts;
  };

  // Optimize shopping route based on selected mode
  const optimizeShoppingRoute = async () => {
    if (!userLocation) {
      toast.error("Veuillez activer la géolocalisation d'abord");
      return;
    }

    setLoading(true);
    setHasAttemptedOptimization(true);

    // Match products with real observations
    const matchedProducts = await matchProductsWithObservations();

    // Get stores within radius from service
    const allStores = await getStoresByTerritory(territoire);

    // Calculate distances and filter by radius
    const storesWithDistance = allStores
      .map((store) => ({
        ...store,
        distance: calculateDistance(userLocation.lat, userLocation.lng, store.lat, store.lng),
      }))
      .filter((store) => store.distance <= searchRadius);

    // Apply optimization mode
    let result;
    switch (selectedMode) {
      case 'cheapest':
        result = optimizeCheapest(matchedProducts, storesWithDistance);
        break;
      case 'minimal_distance':
        result = optimizeMinimalDistance(matchedProducts, storesWithDistance);
        break;
      case 'balanced':
        result = optimizeBalanced(matchedProducts, storesWithDistance);
        break;
      case 'single_store':
        result = optimizeSingleStore(matchedProducts, storesWithDistance);
        break;
      default:
        result = optimizeBalanced(matchedProducts, storesWithDistance);
    }

    // Calculate optimal route if we have stores in the result
    if (result.breakdown && result.breakdown.length > 0) {
      const storesToVisit = result.breakdown.map((b) => b.store).filter(Boolean);

      if (storesToVisit.length > 0) {
        // Use route optimization to get the best order and calculate savings
        const optimalRoute = solveShoppingRoute(
          { lat: userLocation.lat, lon: userLocation.lng },
          storesToVisit
        );

        // Attach route information to result
        result.optimalRoute = optimalRoute;

        // Track the trip in statistics
        const storeNames = storesToVisit
          .map((s) => s.name || s.enseigne || 'Magasin')
          .filter(Boolean);
        const productNames = matchedProducts
          .filter((p) => p.dataAvailable)
          .map((p) => p.product_name)
          .filter(Boolean);

        trackTrip(
          optimalRoute.totalDistance,
          storeNames,
          productNames,
          optimalRoute.savings.fuel,
          optimalRoute.savings.co2
        );
      }
    }

    setOptimizationResults(result);
    setLoading(false);
  };

  // MODE A: Cheapest total price
  const optimizeCheapest = (products, stores) => {
    // Find cheapest price for each product across all stores
    const breakdown = {};
    let totalPrice = 0;

    // Pre-compute store map for O(1) lookups instead of O(n) find operations
    const storeMap = new Map(stores.map((s) => [s.id, s]));

    products.forEach((product) => {
      if (
        !product.dataAvailable ||
        !product.observedPrices ||
        product.observedPrices.length === 0
      ) {
        return;
      }

      const cheapestPrice = product.observedPrices.reduce((min, p) =>
        p.price < min.price ? p : min
      );

      const storeId = cheapestPrice.storeId;
      if (!breakdown[storeId]) {
        const store = storeMap.get(storeId);
        breakdown[storeId] = {
          store,
          items: [],
          subtotal: 0,
        };
      }

      breakdown[storeId].items.push({
        product,
        price: cheapestPrice.price,
        observedDate: cheapestPrice.capturedAt,
      });
      breakdown[storeId].subtotal += cheapestPrice.price * product.quantity_needed;
      totalPrice += cheapestPrice.price * product.quantity_needed;
    });

    return {
      mode: 'cheapest',
      totalPrice,
      breakdown: Object.values(breakdown),
      storesCount: Object.keys(breakdown).length,
    };
  };

  // MODE B: Minimal distance
  const optimizeMinimalDistance = (products, stores) => {
    // Use fewest stores, prioritizing closest ones
    const sortedStores = [...stores].sort((a, b) => a.distance - b.distance);
    const breakdown = {};
    let totalPrice = 0;

    // Pre-compute store maps for O(1) lookups
    const storeMap = new Map(stores.map((s) => [s.id, s]));
    const storeIdSet = new Set(sortedStores.map((s) => s.id));

    products.forEach((product) => {
      if (
        !product.dataAvailable ||
        !product.observedPrices ||
        product.observedPrices.length === 0
      ) {
        return;
      }

      // Find first store (closest) that has this product - optimized with Set lookup
      const availablePrice = product.observedPrices.find((p) => storeIdSet.has(p.storeId));

      if (availablePrice) {
        const storeId = availablePrice.storeId;
        if (!breakdown[storeId]) {
          const store = storeMap.get(storeId);
          breakdown[storeId] = {
            store,
            items: [],
            subtotal: 0,
          };
        }

        breakdown[storeId].items.push({
          product,
          price: availablePrice.price,
          observedDate: availablePrice.capturedAt,
        });
        breakdown[storeId].subtotal += availablePrice.price * product.quantity_needed;
        totalPrice += availablePrice.price * product.quantity_needed;
      }
    });

    return {
      mode: 'minimal_distance',
      totalPrice,
      breakdown: Object.values(breakdown),
      storesCount: Object.keys(breakdown).length,
    };
  };

  // MODE C: Balanced (RECOMMENDED)
  const optimizeBalanced = (products, stores) => {
    // Weighted score: Price (40%) + Distance (30%) + Number of stops (30%)
    const breakdown = {};
    let totalPrice = 0;
    let totalDistance = 0;

    // Pre-compute store map for O(1) lookups
    const storeMap = new Map(stores.map((s) => [s.id, s]));

    products.forEach((product) => {
      if (
        !product.dataAvailable ||
        !product.observedPrices ||
        product.observedPrices.length === 0
      ) {
        return;
      }

      // Pre-calculate max price for normalization (once per product)
      const maxPrice = Math.max(...product.observedPrices.map((x) => x.price));

      // Calculate score for each price option
      const scoredPrices = product.observedPrices
        .map((p) => {
          const store = storeMap.get(p.storeId);
          if (!store) return null;

          const priceNorm = 1 - p.price / maxPrice;
          const distanceNorm = 1 - store.distance / searchRadius;
          const consolidationBonus = breakdown[p.storeId] ? 0.3 : 0;

          const score = priceNorm * 0.4 + distanceNorm * 0.3 + consolidationBonus * 0.3;

          return { ...p, store, score };
        })
        .filter(Boolean);

      const bestOption = scoredPrices.reduce((max, p) => (p.score > max.score ? p : max));

      const storeId = bestOption.storeId;
      if (!breakdown[storeId]) {
        breakdown[storeId] = {
          store: bestOption.store,
          items: [],
          subtotal: 0,
        };
      }

      breakdown[storeId].items.push({
        product,
        price: bestOption.price,
        observedDate: bestOption.capturedAt,
      });
      breakdown[storeId].subtotal += bestOption.price * product.quantity_needed;
      totalPrice += bestOption.price * product.quantity_needed;
      totalDistance += bestOption.store.distance;
    });

    return {
      mode: 'balanced',
      totalPrice,
      breakdown: Object.values(breakdown),
      storesCount: Object.keys(breakdown).length,
      avgDistance: totalDistance / Object.keys(breakdown).length,
    };
  };

  // MODE D: Single store only
  const optimizeSingleStore = (products, stores) => {
    // Find the single store with the cheapest basket
    const storeBaskets = stores.map((store) => {
      let basketTotal = 0;
      let itemsFound = 0;
      const items = [];

      products.forEach((product) => {
        if (!product.dataAvailable || !product.observedPrices) return;

        const priceAtStore = product.observedPrices.find((p) => p.storeId === store.id);
        if (priceAtStore) {
          items.push({
            product,
            price: priceAtStore.price,
            observedDate: priceAtStore.capturedAt,
          });
          basketTotal += priceAtStore.price * product.quantity_needed;
          itemsFound++;
        }
      });

      return {
        store,
        items,
        subtotal: basketTotal,
        completeness: itemsFound / products.length,
      };
    });

    // Sort by completeness first, then by price
    const bestStore = storeBaskets
      .filter((b) => b.completeness > 0.5) // At least 50% of items
      .sort((a, b) => {
        if (Math.abs(a.completeness - b.completeness) < 0.1) {
          return a.subtotal - b.subtotal;
        }
        return b.completeness - a.completeness;
      })[0];

    if (!bestStore) {
      return {
        mode: 'single_store',
        totalPrice: 0,
        breakdown: [],
        storesCount: 0,
        error: 'Aucun magasin ne contient suffisamment de produits',
      };
    }

    return {
      mode: 'single_store',
      totalPrice: bestStore.subtotal,
      breakdown: [bestStore],
      storesCount: 1,
    };
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!optimizationResults) return;

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const now = new Date();
      const modeName =
        OPTIMIZATION_MODES[optimizationResults.mode?.toUpperCase()]?.name ||
        optimizationResults.mode ||
        'Optimisé';

      // ── Header ──────────────────────────────────────────────────────────────
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Plan de courses — A KI PRI SA YÉ', 14, 11);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Territoire : ${territoire} | Mode : ${modeName} | Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        14,
        20
      );

      // ── Summary bar ─────────────────────────────────────────────────────────
      let y = 34;
      doc.setFillColor(30, 58, 138);
      doc.rect(0, y - 4, 210, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Total : ${optimizationResults.totalPrice.toFixed(2)} €   |   ${optimizationResults.storesCount} magasin(s)   |   ${shoppingList.length} article(s)`,
        14,
        y + 2
      );
      y += 14;

      // ── Breakdown per store ──────────────────────────────────────────────────
      optimizationResults.breakdown.forEach(({ store, items }) => {
        if (y > 260) {
          doc.addPage();
          y = 14;
        }

        // Store header
        doc.setFillColor(51, 65, 85);
        doc.rect(0, y - 4, 210, 9, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const storeDist = store.distance != null ? ` — ${store.distance.toFixed(1)} km` : '';
        doc.text(`🏬 ${store.name}${storeDist}`, 14, y + 1);
        y += 11;

        // Column headers
        const colX = [14, 100, 130, 160, 185];
        doc.setFillColor(71, 85, 105);
        doc.rect(0, y - 4, 210, 7, 'F');
        doc.setTextColor(200, 210, 220);
        doc.setFontSize(7);
        ['Produit', 'Qté', 'Prix unit.', 'Total', 'Date obs.'].forEach((h, i) =>
          doc.text(h, colX[i], y)
        );
        y += 8;

        items.forEach(({ product, price, observedDate }, ri) => {
          if (y > 270) {
            doc.addPage();
            y = 14;
          }
          doc.setFillColor(ri % 2 === 0 ? 15 : 22, ri % 2 === 0 ? 23 : 33, ri % 2 === 0 ? 42 : 54);
          doc.rect(0, y - 4, 210, 7, 'F');
          doc.setTextColor(200, 210, 220);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          const productName = (product.product_name || '').slice(0, 38);
          const qty = String(product.quantity_needed ?? 1);
          const unitPrice = `${price.toFixed(2)} €`;
          const total = `${(price * (product.quantity_needed ?? 1)).toFixed(2)} €`;
          const dateStr = observedDate ? new Date(observedDate).toLocaleDateString('fr-FR') : '—';
          doc.text(productName, colX[0], y);
          doc.text(qty, colX[1], y);
          doc.text(unitPrice, colX[2], y);
          doc.setTextColor(74, 222, 128);
          doc.text(total, colX[3], y);
          doc.setTextColor(180, 190, 200);
          doc.text(dateStr, colX[4], y);
          y += 7;
        });

        // Store subtotal
        const storeTotal = items.reduce(
          (s, { product, price }) => s + price * (product.quantity_needed ?? 1),
          0
        );
        doc.setTextColor(251, 191, 36);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`Sous-total ${store.name} : ${storeTotal.toFixed(2)} €`, colX[2], y + 2);
        y += 9;
      });

      // ── Footer ───────────────────────────────────────────────────────────────
      const pageCount = doc.internal.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `A KI PRI SA YÉ — données indicatives, sous réserve de disponibilité en magasin | Page ${p}/${pageCount}`,
          14,
          293
        );
      }

      doc.save(`plan-courses-${territoire.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
      toast.success('PDF téléchargé !', { icon: '📄' });
    } catch (err) {
      console.error('[PDF export]', err);
      toast.error('Erreur lors de la génération du PDF.');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!optimizationResults) return;

    const csvRows = [
      ['Magasin', 'Produit', 'Prix observé', 'Quantité', 'Total', 'Date observation'],
    ];

    optimizationResults.breakdown.forEach(({ store, items }) => {
      items.forEach(({ product, price, observedDate }) => {
        csvRows.push([
          store.name,
          product.product_name,
          price.toFixed(2),
          product.quantity_needed,
          (price * product.quantity_needed).toFixed(2),
          new Date(observedDate).toLocaleDateString(),
        ]);
      });
    });

    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new globalThis.Blob([csvContent], { type: 'text/csv' });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-courses-${Date.now()}.csv`;
    a.click();
  };

  // Save favorite route
  const saveFavoriteRoute = () => {
    if (!optimizationResults) return;

    const route = {
      id: Date.now(),
      name: `Route ${savedRoutes.length + 1}`,
      mode: selectedMode,
      results: optimizationResults,
      savedAt: new Date().toISOString(),
    };

    setSavedRoutes([...savedRoutes, route]);
    toast.success('Route sauvegardée !');
  };

  const noOptimizationData =
    hasAttemptedOptimization &&
    shoppingList.length > 0 &&
    userLocation &&
    (!optimizationResults || (optimizationResults.breakdown || []).length === 0);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-blue-400" />
          Liste de Courses Intelligente + Géo-Optimisation
        </h1>
        <p className="text-slate-300">
          Aide à l'achat CITOYEN basée sur des données RÉELLES et OBSERVÉES uniquement
        </p>
        {!dbAvailable && (
          <div className="mt-3 p-3 bg-amber-900/30 border border-amber-500/40 rounded-lg text-amber-100 text-sm">
            Fonctionnalité en cours de déploiement : les premiers relevés prix géolocalisés seront
            ajoutés prochainement.
          </div>
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <div
        className="bg-amber-900/20 backdrop-blur-xl border border-amber-500/30 rounded-xl p-4"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-amber-100">
            <p className="font-semibold mb-2">Avertissement important</p>
            <ul className="space-y-1 text-amber-200">
              <li>
                • Les résultats sont basés sur les{' '}
                <strong>prix observés actuellement disponibles</strong>
              </li>
              <li>
                • Nous n'utilisons <strong>AUCUNE estimation</strong> ni{' '}
                <strong>prédiction AI</strong>
              </li>
              <li>
                • Si un produit n'a pas de données observées :{' '}
                <strong>"Données non disponibles"</strong>
              </li>
              <li>
                • Les prix affichés incluent la <strong>date d'observation</strong>
              </li>
              <li>
                • Module conçu pour <strong>AIDER LE CITOYEN</strong>, pas pour vendre
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* GPS Consent */}
      <div
        className="bg-blue-900/20 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4"
        role="region"
        aria-labelledby="gps-consent-title"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-blue-100 flex-1">
            <p id="gps-consent-title" className="font-semibold mb-2">
              Géolocalisation (OPT-IN UNIQUEMENT)
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-200 mb-3">
              <li>
                Votre position GPS est utilisée{' '}
                <strong>UNIQUEMENT avec votre consentement explicite</strong>
              </li>
              <li>
                Données utilisées <strong>localement</strong> pour calculer les distances
              </li>
              <li>
                <strong>JAMAIS stockées</strong> sur nos serveurs
              </li>
              <li>
                <strong>JAMAIS transmises</strong> à des tiers
              </li>
            </ul>
            <label
              aria-label="Accepter l'utilisation de ma position GPS locale"
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={gpsConsent}
                onChange={(e) => setGpsConsent(e.target.checked)}
                className="w-4 h-4"
                aria-label="Accepter l'utilisation de ma position GPS locale"
              />
              <span className="font-medium text-white">
                J'accepte explicitement l'utilisation de ma position GPS locale
              </span>
            </label>
            <p className="text-xs text-blue-200 mt-2" aria-live="polite">
              Statut géolocalisation : {geolocStatus === 'awaiting' && 'en attente de votre accord'}
              {geolocStatus === 'pending' && 'demande envoyée au navigateur'}
              {geolocStatus === 'active' && 'activée ✅'}
              {geolocStatus === 'error' && 'refusée ou indisponible'}
            </p>
            {gpsConsent && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={requestLocation}
                  disabled={!!userLocation || loading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                    userLocation
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  {userLocation
                    ? 'Position activée'
                    : loading
                      ? 'Activation...'
                      : 'Activer ma position'}
                </button>
                {userLocation && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="smart-list-radius" className="text-xs text-blue-200">
                      Rayon:
                    </label>
                    <select
                      id="smart-list-radius"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                      className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value={5}>5 km</option>
                      <option value={10}>10 km</option>
                      <option value={20}>20 km</option>
                    </select>
                  </div>
                )}
              </div>
            )}
            {gpsError && (
              <div className="mt-2 text-red-300 text-sm" role="alert" aria-live="assertive">
                ⚠️ {gpsError}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Shopping List Editor */}
        <div className="space-y-4">
          <div
            className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl"
            role="region"
            aria-labelledby="shopping-list-title"
          >
            <h2 id="shopping-list-title" className="text-xl font-semibold text-white mb-4">
              Votre liste de courses
            </h2>

            {/* Add Item Form */}
            <form
              className="space-y-3 mb-4 p-4 bg-slate-900/50 rounded-lg"
              onSubmit={handleAddItemSubmit}
              aria-label="Formulaire d'ajout d'article"
            >
              <input
                type="text"
                placeholder="Nom du produit *"
                value={newItem.product_name}
                onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  required
                >
                  <option value="">Catégorie *</option>
                  <option value="alimentaire">Alimentaire</option>
                  <option value="frais">Frais</option>
                  <option value="hygiene">Hygiène</option>
                  <option value="autre">Autre</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity_needed}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity_needed: Number(e.target.value) })
                    }
                    className="w-20 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    aria-label="Quantité"
                  />
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    aria-label="Unité de mesure"
                  >
                    <option value="unité">unité</option>
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>
              <input
                type="text"
                placeholder="Marque (optionnel)"
                value={newItem.brand}
                onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400"
                aria-label="Marque du produit (optionnel)"
              />
              <input
                type="text"
                placeholder="Code EAN (pour correspondance exacte)"
                value={newItem.ean}
                onChange={(e) => setNewItem({ ...newItem, ean: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400"
                aria-label="Code EAN pour correspondance exacte"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                aria-label="Ajouter l'article à la liste de courses"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Ajouter à la liste
              </button>
            </form>

            {/* Shopping List Items */}
            {shoppingList.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Votre liste est vide</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shoppingList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-700/50 rounded-lg p-3 flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{item.product_name}</p>
                        {item.brand && (
                          <span className="text-xs text-slate-400">({item.brand})</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {item.quantity_needed} {item.unit} • {item.category}
                        {item.ean && <span className="ml-2">EAN: {item.ean}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optimization Mode Selector */}
          {shoppingList.length > 0 && userLocation && (
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-4">
                Mode d'optimisation (VOUS choisissez)
              </h2>
              <div className="space-y-3">
                {Object.values(OPTIMIZATION_MODES).map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <label
                      key={mode.id}
                      aria-label={mode.name}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border-2 transition-all ${
                        selectedMode === mode.id
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="optimization_mode"
                        value={mode.id}
                        checked={selectedMode === mode.id}
                        onChange={(e) => setSelectedMode(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4 text-blue-400" />
                          <p className="font-medium text-white">{mode.name}</p>
                        </div>
                        <p className="text-xs text-slate-400">{mode.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <button
                onClick={optimizeShoppingRoute}
                disabled={loading}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-3 rounded-lg font-medium"
              >
                {loading ? 'Calcul en cours...' : 'Optimiser mon parcours'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {optimizationResults ? (
            <>
              {/* Results Overview */}
              <div className="bg-gradient-to-br from-green-900/40 to-blue-900/40 backdrop-blur-xl border border-green-500/30 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-semibold text-white mb-4">Résultats d'optimisation</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-1">Prix total observé</p>
                    <p className="text-2xl font-bold text-white">
                      {optimizationResults.totalPrice.toFixed(2)} €
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm mb-1">Nombre de magasins</p>
                    <p className="text-2xl font-bold text-white">
                      {optimizationResults.storesCount}
                    </p>
                  </div>
                </div>

                {/* Store Breakdown */}
                <div className="space-y-3">
                  {optimizationResults.breakdown.map((storeData, idx) => (
                    <div key={idx} className="bg-slate-900/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{storeData.store.name}</h3>
                          <p className="text-xs text-slate-400">
                            {storeData.store.type} • {storeData.store.distance.toFixed(1)} km
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-400">
                            {storeData.subtotal.toFixed(2)} €
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {storeData.items.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="text-sm text-slate-300 flex justify-between"
                          >
                            <span>
                              {item.product.product_name} (x{item.product.quantity_needed})
                            </span>
                            <div className="text-right">
                              <span className="font-medium">{item.price.toFixed(2)} €</span>
                              <span className="text-xs text-slate-500 ml-2">
                                {new Date(item.observedDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Export Options */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={saveFavoriteRoute}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
              </div>

              {/* Explanation Panel */}
              <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  Pourquoi ce résultat ?
                </h3>
                <div className="text-sm text-slate-300 space-y-2">
                  <p>
                    <strong>Mode sélectionné :</strong>{' '}
                    {OPTIMIZATION_MODES[optimizationResults.mode.toUpperCase()]?.name ||
                      OPTIMIZATION_MODES.BALANCED.name}
                  </p>
                  <p className="text-slate-400">
                    Les résultats sont basés sur les <strong>prix observés réels</strong>{' '}
                    disponibles dans notre base de données. Chaque prix affiché inclut sa date
                    d'observation.
                  </p>
                  <p className="text-slate-400">
                    Les distances sont calculées à partir de votre position GPS (utilisée
                    localement).
                  </p>
                  <div className="mt-3 p-3 bg-amber-900/20 border border-amber-500/30 rounded">
                    <p className="text-amber-200 text-xs">
                      ⚠️ <strong>Disclaimer :</strong> "Les résultats sont basés sur les prix
                      observés actuellement disponibles et les distances calculées. Nous ne
                      garantissons pas qu'il s'agit de la meilleure offre possible."
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : noOptimizationData ? (
            <div className="bg-amber-900/20 backdrop-blur-xl border border-amber-600/40 rounded-xl p-10 text-center shadow-xl">
              <MapPin className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <p className="text-amber-100 font-semibold mb-2">
                Aucune donnée de prix disponible pour ce panier
              </p>
              <p className="text-sm text-amber-200">
                Fonctionnalité en cours de déploiement : les parcours optimisés seront affichés dès
                que les relevés prix seront intégrés pour votre territoire.
              </p>
            </div>
          ) : (
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-12 text-center shadow-xl">
              <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">
                Ajoutez des produits et activez la géolocalisation
              </p>
              <p className="text-sm text-slate-500">
                Les résultats d'optimisation apparaîtront ici
              </p>
            </div>
          )}

          {/* Saved Routes */}
          {savedRoutes.length > 0 && (
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-3">Routes sauvegardées</h3>
              <div className="space-y-2">
                {savedRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">{route.name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(route.savedAt).toLocaleDateString()} •{' '}
                        {OPTIMIZATION_MODES[route.mode.toUpperCase()]?.name || route.mode}
                      </p>
                    </div>
                    <button
                      onClick={() => setSavedRoutes(savedRoutes.filter((r) => r.id !== route.id))}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
