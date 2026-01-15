import { useEffect, useState, useMemo } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import 'leaflet.markercluster';
import { getStoresByTerritory } from '../services/mapService';
import { getActiveTerritories, TERRITORIES } from '../constants/territories';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// eslint-disable-next-line no-unused-vars
function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 11);
  }, [position, map]);
  return null;
}

// Phase 2: Marker Clustering Component
// eslint-disable-next-line no-unused-vars
function MarkerClusterGroup({ stores, currentTerritory, formatDistance }) {
  const map = useMap();

  useEffect(() => {
    // Create marker cluster group with custom settings
    const markerClusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 60,
      disableClusteringAtZoom: 15,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        let className = 'marker-cluster-';
        if (count < 10) {
          className += 'small';
        } else if (count < 20) {
          className += 'medium';
        } else {
          className += 'large';
        }
        
        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${className}`,
          iconSize: L.point(40, 40)
        });
      }
    });

    // Add markers to cluster group
    stores.forEach((store) => {
      const leafletMarker = L.marker([store.lat, store.lon]);
      
      // Create popup content similar to existing design
      const popupContent = document.createElement('div');
      popupContent.className = 'text-slate-900';
      popupContent.innerHTML = `
        <h3 class="font-semibold">${store.name}</h3>
        <p class="text-sm text-slate-600">${store.category}</p>
        <p class="text-xs text-slate-500">${currentTerritory?.name || ''}</p>
        ${store.distance ? `
          <div class="text-xs mt-1 space-y-1">
            <p class="text-blue-600 font-medium">
              Distance: ${formatDistance(store.distance)} <span class="text-slate-500">(estimée)</span>
            </p>
          </div>
        ` : ''}
        <div class="mt-2">
          <a 
            href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${store.lat},${store.lon}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
          >
            📸 Street View
          </a>
        </div>
      `;
      
      leafletMarker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });
      
      markerClusterGroup.addLayer(leafletMarker);
    });

    // Add cluster group to map
    map.addLayer(markerClusterGroup);

    // Cleanup on unmount
    return () => {
      map.removeLayer(markerClusterGroup);
    };
  }, [map, stores, currentTerritory, formatDistance]);

  return null;
}

export default function Carte() {
  const [territory, setTerritory] = useState('GP'); // Code territoire
  const [stores, setStores] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [isNavigating, setIsNavigating] = useState({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [recentDestinations, setRecentDestinations] = useState([]);
  const [showRecentDestinations, setShowRecentDestinations] = useState(false);
  
  // Phase 1: Filter states
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [selectedServices, setSelectedServices] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Phase 2: Geolocation states
  const [sortByDistance, setSortByDistance] = useState(false);
  const [nearMeRadius, setNearMeRadius] = useState(10); // km
  const [showNearMeOnly, setShowNearMeOnly] = useState(false);
  
  // Phase 5: Clustering state
  const [enableClustering, setEnableClustering] = useState(true);

  // Constants
  const NAVIGATION_TIMEOUT = 1000; // Timeout for resetting navigation state
  const MAX_RECENT_DESTINATIONS = 5; // Maximum recent destinations to store
  const RECENT_DESTINATIONS_KEY = 'akiprisaye_recent_destinations'; // localStorage key
  
  // Travel speed constants (in km/h)
  const SPEED_DRIVING = 50;
  const SPEED_WALKING = 5;
  const SPEED_TRANSIT = 30;

  // Load recent destinations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_DESTINATIONS_KEY);
    if (saved) {
      try {
        setRecentDestinations(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading recent destinations:', e);
        // Clear corrupted data to prevent repeated failures on subsequent loads
        localStorage.removeItem(RECENT_DESTINATIONS_KEY);
        setRecentDestinations([]);
      }
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Helper function to save destination to recent history
  const saveToRecentDestinations = (store) => {
    // Validate store object has required properties
    if (!store || !store.name || typeof store.lat !== 'number' || typeof store.lon !== 'number' || !store.category) {
      console.error('Invalid store object provided to saveToRecentDestinations');
      return;
    }

    const newDestination = {
      name: store.name,
      lat: store.lat,
      lon: store.lon,
      category: store.category,
      timestamp: Date.now()
    };

    setRecentDestinations(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(d => !(d.lat === store.lat && d.lon === store.lon));
      // Add new destination at the beginning
      const updated = [newDestination, ...filtered].slice(0, MAX_RECENT_DESTINATIONS);
      // Save to localStorage with error handling
      try {
        localStorage.setItem(RECENT_DESTINATIONS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving recent destinations to localStorage:', e);
      }
      return updated;
    });
  };

  // Helper function to estimate travel time
  // Note: These are rough estimates based on average speeds and don't account for
  // real-world variables like traffic, road conditions, terrain, or individual pace
  const estimateTravelTime = (distance, mode) => {
    // Use speed constants
    const speeds = {
      driving: SPEED_DRIVING,
      walking: SPEED_WALKING,
      transit: SPEED_TRANSIT
    };
    
    const speed = speeds[mode] || SPEED_DRIVING;
    const timeInHours = distance / speed;
    const timeInMinutes = Math.round(timeInHours * 60);
    
    return timeInMinutes;
  };

  // Helper function to format travel time
  const formatTravelTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Helper function to share store location
  const shareLocation = (store) => {
    // Validate store object has required properties
    if (!store || !store.name || typeof store.lat !== 'number' || typeof store.lon !== 'number' || !store.category) {
      console.error('Invalid store object provided to shareLocation');
      return;
    }

    const shareData = {
      title: `${store.name} - ${store.category}`,
      text: `Localisation de ${store.name}`,
      url: `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lon}`
    };

    // Check if Web Share API is supported
    if (navigator.share) {
      navigator.share(shareData)
        .then(() => {
          if (import.meta.env.DEV) {
            console.warn('Shared successfully');
          }
        })
        .catch((error) => console.error('Error sharing:', error));
    } else {
      // Fallback: copy to clipboard
      const text = `${store.name} - ${store.category}\nCoordonnées GPS: ${store.lat}, ${store.lon}\nLien: https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lon}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => {
            if (import.meta.env.DEV) {
              console.warn('Coordonnées copiées dans le presse-papier !');
            }
          })
          .catch((error) => {
            console.error('Erreur lors de la copie dans le presse-papier :', error);
            console.warn(
              `Impossible de copier automatiquement dans le presse-papier.\n\n` +
              `Cela peut être dû aux restrictions de votre navigateur ` +
              `(contexte non sécurisé HTTP ou autorisation refusée).\n\n` +
              `Vous pouvez copier manuellement ces informations :\n\n` +
              `${store.name}\n` +
              `Coordonnées: ${store.lat}, ${store.lon}\n` +
              `Lien: https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lon}`
            );
          });
      } else {
        console.warn(
          `Le partage automatique du lien n'est pas disponible dans ce navigateur ` +
          `ou dans ce contexte (par exemple, page non sécurisée HTTP).\n\n` +
          `Vous pouvez copier manuellement ces informations :\n\n` +
          `${store.name}\n` +
          `Coordonnées: ${store.lat}, ${store.lon}\n` +
          `Lien: https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lon}`
        );
      }
    }
  };

  // Helper function to calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Helper function to format distance
  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  // Helper function to detect platform and open appropriate navigation app
  const handleGPS = (lat, lon, mode, _storeName, store) => {
    // Check if offline - show inline message instead of alert
    if (!isOnline) {
      // Coordinates are still available offline, just can't navigate
      console.warn('User is offline, navigation unavailable');
      return;
    }

    // Save to recent destinations if store object is provided
    if (store) {
      saveToRecentDestinations(store);
    }

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lon !== 'number' || 
        isNaN(lat) || isNaN(lon) ||
        lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      console.error('Invalid coordinates provided');
      return;
    }
    // Validate travel mode
    if (mode !== 'driving' && mode !== 'walking' && mode !== 'transit') {
      console.error('Invalid travel mode. Must be "driving", "walking", or "transit"');
      return;
    }
    
    // Use per-store navigation state using a unique key
    const storeKey = `${lat},${lon}`;
    setIsNavigating(prev => ({ ...prev, [storeKey]: true }));
    
    try {
      // Detect platform
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      const isAndroid = /android/i.test(userAgent);
      
      let url;
      
      // Build URL with origin if user position is available
      const origin = userPosition ? `${userPosition[0]},${userPosition[1]}` : 'current+location';
      
      // For iOS, provide options
      if (isIOS) {
        const useAppleMaps = confirm('Ouvrir dans Apple Maps ?\n\nOK = Apple Maps\nAnnuler = Google Maps');
        if (useAppleMaps) {
          // Apple Maps URL (using https)
          url = `https://maps.apple.com/?daddr=${lat},${lon}&dirflg=${mode === 'driving' ? 'd' : mode === 'walking' ? 'w' : 'r'}`;
        } else {
          // Google Maps URL
          url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lon}&travelmode=${mode}`;
        }
      } 
      // For Android, offer Waze option
      else if (isAndroid) {
        const useWaze = confirm('Ouvrir dans Waze ?\n\nOK = Waze\nAnnuler = Google Maps');
        if (useWaze) {
          // Waze URL
          url = `https://www.waze.com/ul?ll=${lat},${lon}&navigate=yes`;
        } else {
          // Google Maps URL
          url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lon}&travelmode=${mode}`;
        }
      }
      // Default to Google Maps
      else {
        url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${lat},${lon}&travelmode=${mode}`;
      }
      
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      // Check if popup was blocked (browsers may return null or undefined)
      if (!newWindow) {
        console.warn('Popup was blocked by browser');
      }
      
      // Reset loading state after a short delay.
      setTimeout(() => {
        setIsNavigating(prev => ({ ...prev, [storeKey]: false }));
      }, NAVIGATION_TIMEOUT);
    } catch (error) {
      console.error('Error opening navigation:', error);
      const storeKey = `${lat},${lon}`;
      setIsNavigating(prev => ({ ...prev, [storeKey]: false }));
    }
  };

  // Memoize store distances to avoid recalculating on every render
  const storesWithDistance = useMemo(() => {
    if (!userPosition) return stores.map(store => ({ ...store, distance: null }));
    
    return stores.map(store => ({
      ...store,
      distance: calculateDistance(userPosition[0], userPosition[1], store.lat, store.lon)
    }));
  }, [stores, userPosition]);

  // Phase 1: Helper function to categorize stores
  const getStoreCategory = (store) => {
    const chain = store.chain.toLowerCase();
    if (['système u', 'carrefour', 'casino', 'e.leclerc', 'leader price', 'auchan', 
         'ecomax', 'simply market', 'intermarché', '8 à huit', 'vival', 
         'super score', 'euromarché', 'match'].some(food => chain.includes(food) || food.includes(chain))) {
      return 'Alimentation';
    } else if (['mr. bricolage', 'bricopro', 'bricomarché'].some(hw => chain.includes(hw) || hw.includes(chain))) {
      return 'Bricolage';
    } else if (['darty', 'but'].some(elec => chain.includes(elec) || elec.includes(chain))) {
      return 'Électronique';
    } else if (['décathlon', 'intersport'].some(sport => chain.includes(sport) || sport.includes(chain))) {
      return 'Sport';
    }
    return 'Autre';
  };

  // Phase 1 & 2: Filter and sort stores based on selected filters
  const filteredStores = useMemo(() => {
    let filtered = storesWithDistance.filter(store => {
      // Filter by category
      if (selectedCategory !== 'Toutes' && getStoreCategory(store) !== selectedCategory) {
        return false;
      }
      
      // Filter by services
      if (selectedServices.length > 0) {
        const storeServices = store.services || [];
        // Store must have all selected services
        const hasAllServices = selectedServices.every(service => storeServices.includes(service));
        if (!hasAllServices) return false;
      }
      
      // Phase 2: Filter by distance (Near Me)
      if (showNearMeOnly && store.distance !== null) {
        if (store.distance > nearMeRadius) return false;
      }
      
      return true;
    });
    
    // Phase 2: Sort by distance if enabled
    if (sortByDistance && userPosition) {
      filtered = [...filtered].sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }
    
    return filtered;
  }, [storesWithDistance, selectedCategory, selectedServices, showNearMeOnly, nearMeRadius, sortByDistance, userPosition]);

  // Phase 1: Calculate statistics
  const storeStats = useMemo(() => {
    const categories = {};
    const chains = {};
    
    stores.forEach(store => {
      const category = getStoreCategory(store);
      categories[category] = (categories[category] || 0) + 1;
      chains[store.chain] = (chains[store.chain] || 0) + 1;
    });
    
    return { categories, chains, total: stores.length };
  }, [stores]);
  const activeTerritories = getActiveTerritories();
  const territoryPositions = {};
  activeTerritories.forEach(t => {
    territoryPositions[t.code] = [t.center.lat, t.center.lng];
  });

  useEffect(() => {
    // Utiliser le code territoire pour récupérer les magasins
    const territoryObj = TERRITORIES[territory];
    if (territoryObj) {
      // mapService now returns a Promise, so we need to handle it
      getStoresByTerritory(territoryObj.name)
        .then(stores => {
          setStores(stores);
        })
        .catch(error => {
          console.error('Error loading stores:', error);
          // Fallback to empty array if loading fails
          setStores([]);
        });
    }
  }, [territory]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn('Géolocalisation refusée', err),
      );
    }
  }, []);

  const defaultPosition = territoryPositions[territory] || [16.265, -61.551]; // Guadeloupe par défaut
  const currentTerritory = TERRITORIES[territory];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-semibold mb-6 text-blue-400">
          🗺️ Carte Interactive des Magasins
        </h1>

        {/* Offline/Online Status Banner */}
        {!isOnline && (
          <div className="mb-6 bg-orange-600/20 border border-orange-500/50 rounded-lg p-4 flex items-center gap-3">
            <WifiOff size={24} className="text-orange-400" />
            <div>
              <p className="font-semibold text-orange-400">Mode hors ligne</p>
              <p className="text-sm text-slate-300">
                Vous êtes hors ligne. Les coordonnées GPS sont disponibles mais la navigation nécessite une connexion.
              </p>
            </div>
          </div>
        )}

        {/* Recent Destinations */}
        {recentDestinations.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-slate-300 flex items-center gap-2">
                <History size={20} className="text-blue-400" />
                Destinations récentes
              </h2>
              <button
                onClick={() => setShowRecentDestinations(!showRecentDestinations)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {showRecentDestinations ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            {showRecentDestinations && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentDestinations.map((dest, idx) => {
                  const distance = userPosition 
                    ? calculateDistance(userPosition[0], userPosition[1], dest.lat, dest.lon)
                    : null;
                  const destKey = `${dest.lat},${dest.lon}`;
                  const isDestNavigating = isNavigating[destKey] || false;
                  return (
                    <div
                      key={idx}
                      className="border border-slate-600 rounded-lg p-3 bg-slate-700/50 hover:border-blue-400 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-200 text-sm">{dest.name}</h3>
                          <p className="text-xs text-slate-400">{dest.category}</p>
                          {distance && (
                            <p className="text-xs text-blue-400 mt-1">{formatDistance(distance)}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleGPS(dest.lat, dest.lon, 'driving', dest.name, dest)}
                          className="px-2 py-1 bg-blue-600/30 text-blue-300 rounded text-xs hover:bg-blue-600/40 disabled:opacity-50"
                          aria-label={`Naviguer vers ${dest.name}`}
                          title={!isOnline ? "Navigation désactivée (hors ligne)" : "Naviguer vers ce magasin"}
                          disabled={isDestNavigating || !isOnline}
                        >
                          {isDestNavigating ? <Loader2 size={14} className="animate-spin" /> : <Car size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Territory Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-slate-300">
            Sélectionner un territoire
          </label>
          <select
            value={territory}
            onChange={(e) => setTerritory(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {activeTerritories.map((t) => (
              <option key={t.code} value={t.code}>
                {t.flag} {t.name} ({t.type})
              </option>
            ))}
          </select>
        </div>

        {/* Phase 1: Statistics Display */}
        <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-blue-400">📊 Statistiques</h2>
            <span className="text-2xl font-bold text-blue-300">{storeStats.total} magasins</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Categories Stats */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Par Catégorie</h3>
              <div className="space-y-1">
                {Object.entries(storeStats.categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-slate-400">
                      {cat === 'Alimentation' && '🛒 '}
                      {cat === 'Bricolage' && '🔨 '}
                      {cat === 'Électronique' && '💻 '}
                      {cat === 'Sport' && '⚽ '}
                      {cat}
                    </span>
                    <span className="text-blue-400 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Top Chains */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Top Enseignes</h3>
              <div className="space-y-1">
                {Object.entries(storeStats.chains).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([chain, count]) => (
                  <div key={chain} className="flex justify-between text-sm">
                    <span className="text-slate-400">{chain}</span>
                    <span className="text-blue-400 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Phase 1: Filters Section */}
        <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-blue-400">🔍 Filtres</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {showFilters ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          
          {showFilters && (
            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Catégorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Toutes">Toutes les catégories</option>
                  <option value="Alimentation">🛒 Alimentation ({storeStats.categories['Alimentation'] || 0})</option>
                  <option value="Bricolage">🔨 Bricolage ({storeStats.categories['Bricolage'] || 0})</option>
                  <option value="Électronique">💻 Électronique ({storeStats.categories['Électronique'] || 0})</option>
                  <option value="Sport">⚽ Sport ({storeStats.categories['Sport'] || 0})</option>
                </select>
              </div>

              {/* Services Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Services disponibles
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['parking', 'livraison', 'carte_bancaire', 'SAV', 'essence', 'retrait_course'].map(service => (
                    <label key={service} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-blue-400">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedServices([...selectedServices, service]);
                          } else {
                            setSelectedServices(selectedServices.filter(s => s !== service));
                          }
                        }}
                        className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                      />
                      <span>
                        {service === 'parking' && '🅿️ Parking'}
                        {service === 'livraison' && '🚚 Livraison'}
                        {service === 'carte_bancaire' && '💳 CB'}
                        {service === 'SAV' && '🔧 SAV'}
                        {service === 'essence' && '⛽ Essence'}
                        {service === 'retrait_course' && '📦 Click&Collect'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Active Filters Display */}
              {(selectedCategory !== 'Toutes' || selectedServices.length > 0) && (
                <div className="flex items-center gap-2 text-sm pt-2 border-t border-slate-600">
                  <span className="text-slate-400">Filtres actifs:</span>
                  {selectedCategory !== 'Toutes' && (
                    <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded">
                      {selectedCategory}
                    </span>
                  )}
                  {selectedServices.map(service => (
                    <span key={service} className="px-2 py-1 bg-green-600/20 text-green-300 rounded">
                      {service}
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedCategory('Toutes');
                      setSelectedServices([]);
                    }}
                    className="ml-auto text-xs text-red-400 hover:text-red-300"
                  >
                    Réinitialiser
                  </button>
                </div>
              )}

              {/* Results Count */}
              <div className="text-sm text-center text-slate-400 pt-2 border-t border-slate-600">
                {filteredStores.length} magasin(s) affiché(s) sur {storeStats.total}
              </div>
            </div>
          )}
        </div>

        {/* Phase 2: Near Me Feature */}
        {userPosition && (
          <div className="mb-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                <MapPin size={20} className="text-blue-400" />
                📍 Magasins près de moi
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortByDistance(!sortByDistance)}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    sortByDistance
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {sortByDistance ? '✓ Trié par distance' : 'Trier par distance'}
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Near Me Toggle */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNearMeOnly}
                    onChange={(e) => setShowNearMeOnly(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                  />
                  <span>Afficher uniquement les magasins proches</span>
                </label>
              </div>

              {/* Distance Radius Selector */}
              {showNearMeOnly && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">
                    Rayon de recherche: <span className="text-blue-400 font-bold">{nearMeRadius} km</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={nearMeRadius}
                    onChange={(e) => setNearMeRadius(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>1 km</span>
                    <span>25 km</span>
                    <span>50 km</span>
                  </div>
                </div>
              )}

              {/* Nearest Stores Quick View */}
              {sortByDistance && filteredStores.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">🎯 Les 3 plus proches :</h3>
                  <div className="space-y-2">
                    {filteredStores.slice(0, 3).map((store, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-blue-400 font-medium">{idx + 1}.</span>
                          <span className="text-slate-300 ml-2">{store.name}</span>
                        </div>
                        {store.distance && (
                          <span className="text-green-400 font-medium">
                            {(store.distance).toFixed(1)} km
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 5: Map Options */}
        <div className="mb-4 flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg p-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-300">🗺️ Options de la carte</span>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-blue-400 transition">
              <input
                type="checkbox"
                checked={enableClustering}
                onChange={(e) => setEnableClustering(e.target.checked)}
                className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
              />
              <span className="flex items-center gap-1">
                {enableClustering ? '✓ Regroupement actif' : 'Regroupement désactivé'}
              </span>
            </label>
          </div>
          <span className="text-xs text-slate-500">
            {enableClustering ? 'Les marqueurs proches sont regroupés' : 'Tous les marqueurs sont visibles'}
          </span>
        </div>

        {/* Map Container */}
        <div className="rounded-lg overflow-hidden border border-slate-700 shadow-xl h-[600px] bg-slate-800">
          <MapContainer
            center={defaultPosition}
            zoom={currentTerritory?.zoom || 11}
            style={{ height: '100%', width: '100%' }}
          >
            {/* Utiliser un thème plus clair et lisible */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <MapUpdater position={territoryPositions[territory]} />
            
            {/* Phase 5: Conditional rendering - Clustering or Individual Markers */}
            {enableClustering ? (
              <MarkerClusterGroup 
                stores={filteredStores}
                isNavigating={isNavigating}
                handleGPS={handleGPS}
                currentTerritory={currentTerritory}
                formatDistance={formatDistance}
                estimateTravelTime={estimateTravelTime}
                formatTravelTime={formatTravelTime}
              />
            ) : (
              filteredStores.map((store, index) => {
              const storeKey = `${store.lat},${store.lon}`;
              const isStoreNavigating = isNavigating[storeKey] || false;
              
              return (
              <Marker key={index} position={[store.lat, store.lon]}>
                <Popup>
                  <div className="text-slate-900">
                    <h3 className="font-semibold">{store.name}</h3>
                    <p className="text-sm text-slate-600">{store.category}</p>
                    <p className="text-xs text-slate-500">{currentTerritory?.name || territory}</p>
                    {store.distance && (
                      <div className="text-xs mt-1 space-y-1">
                        <p className="text-blue-600 font-medium">
                          <MapPin size={12} className="inline mr-1" />
                          Distance: {formatDistance(store.distance)} <span className="text-slate-500">(estimée)</span>
                        </p>
                        <div className="flex gap-2 text-slate-600">
                          <span title="Temps estimé en voiture">
                            <Car size={12} className="inline mr-1" />
                            {formatTravelTime(estimateTravelTime(store.distance, 'driving'))}
                          </span>
                          <span title="Temps estimé à pied">
                            <Footprints size={12} className="inline mr-1" />
                            {formatTravelTime(estimateTravelTime(store.distance, 'walking'))}
                          </span>
                          <span title="Temps estimé en transport">
                            <Bus size={12} className="inline mr-1" />
                            {formatTravelTime(estimateTravelTime(store.distance, 'transit'))}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 italic">Temps estimés - ne tiennent pas compte du trafic</p>
                      </div>
                    )}
                    
                    {/* PROMPT 1: Link to Store Detail */}
                    {store.id && (
                      <div className="mt-2 mb-2">
                        <Link
                          to={`/enseigne/${store.id}`}
                          className="inline-block w-full text-center px-3 py-1.5 bg-slate-800 text-white rounded text-xs hover:bg-slate-700 transition-colors"
                        >
                          🏪 Voir la fiche magasin
                        </Link>
                      </div>
                    )}
                    
                    {/* Phase 6: Google Street View Button */}
                    <div className="mt-2 mb-2">
                      <a
                        href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${store.lat},${store.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block w-full text-center px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                        title="Voir sur Google Street View"
                      >
                        📸 Street View
                      </a>
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleGPS(store.lat, store.lon, 'driving', store.name, store)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                        title="Naviguer en voiture"
                        aria-label={`Naviguer en voiture vers ${store.name}`}
                        disabled={isStoreNavigating || !isOnline}
                      >
                        {isStoreNavigating ? <Loader2 size={14} className="animate-spin" /> : <Car size={14} />}
                      </button>
                      <button
                        onClick={() => handleGPS(store.lat, store.lon, 'walking', store.name, store)}
                        className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                        title="Naviguer à pied"
                        aria-label={`Naviguer à pied vers ${store.name}`}
                        disabled={isStoreNavigating || !isOnline}
                      >
                        {isStoreNavigating ? <Loader2 size={14} className="animate-spin" /> : <Footprints size={14} />}
                      </button>
                      <button
                        onClick={() => handleGPS(store.lat, store.lon, 'transit', store.name, store)}
                        className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                        title="Transports en commun"
                        aria-label={`Naviguer en transport en commun vers ${store.name}`}
                        disabled={isStoreNavigating || !isOnline}
                      >
                        {isStoreNavigating ? <Loader2 size={14} className="animate-spin" /> : <Bus size={14} />}
                      </button>
                      <button
                        onClick={() => shareLocation(store)}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-600 text-white rounded text-xs hover:bg-slate-700"
                        title="Partager la localisation"
                        aria-label={`Partager la localisation de ${store.name}`}
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                    {!isOnline && (
                      <p className="text-xs text-orange-600 mt-2">
                        Navigation désactivée (hors ligne)
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
            })
            )}

            {userPosition && (
              <Marker
                position={userPosition}
                icon={L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                })}
              >
                <Popup>
                  <div className="text-slate-900">
                    <h3 className="font-semibold">Votre position</h3>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Store List */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">
            Magasins en {currentTerritory?.name || territory} ({filteredStores.length} / {stores.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStores.map((store, index) => {
              const storeKey = `${store.lat},${store.lon}`;
              const isStoreNavigating = isNavigating[storeKey] || false;
              
              return (
              <div
                key={index}
                className="border border-slate-700 rounded-lg p-4 bg-slate-800/50 hover:border-blue-500 transition shadow-lg"
              >
                <h3 className="font-semibold text-slate-100 mb-1">{store.name}</h3>
                <p className="text-slate-400 text-sm mb-2">{store.category}</p>
                <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                  <span>📍 {store.lat.toFixed(4)}°, {store.lon.toFixed(4)}°</span>
                  {store.distance && (
                    <span className="text-blue-400 font-medium">
                      {formatDistance(store.distance)}
                    </span>
                  )}
                </div>
                {store.distance && (
                  <div className="space-y-2 mb-3">
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 bg-slate-900/50 rounded p-2">
                      <div className="flex items-center gap-1" title="Temps estimé en voiture">
                        <Car size={12} />
                        <span>{formatTravelTime(estimateTravelTime(store.distance, 'driving'))}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Temps estimé à pied">
                        <Footprints size={12} />
                        <span>{formatTravelTime(estimateTravelTime(store.distance, 'walking'))}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Temps estimé en transport">
                        <Bus size={12} />
                        <span>{formatTravelTime(estimateTravelTime(store.distance, 'transit'))}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 italic">Temps estimés - ne tiennent pas compte du trafic</p>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGPS(store.lat, store.lon, 'driving', store.name, store)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm hover:bg-blue-600/30 transition border border-blue-500/30 disabled:opacity-50"
                      aria-label={`Naviguer en voiture vers ${store.name}`}
                      title={!isOnline ? "Navigation désactivée (hors ligne)" : "Naviguer en voiture"}
                      disabled={isStoreNavigating || !isOnline}
                    >
                      {isStoreNavigating ? <Loader2 size={16} className="animate-spin" /> : <Car size={16} />}
                      <span>En voiture</span>
                    </button>
                    <button
                      onClick={() => handleGPS(store.lat, store.lon, 'walking', store.name, store)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm hover:bg-green-600/30 transition border border-green-500/30 disabled:opacity-50"
                      aria-label={`Naviguer à pied vers ${store.name}`}
                      title={!isOnline ? "Navigation désactivée (hors ligne)" : "Naviguer à pied"}
                      disabled={isStoreNavigating || !isOnline}
                    >
                      {isStoreNavigating ? <Loader2 size={16} className="animate-spin" /> : <Footprints size={16} />}
                      <span>À pied</span>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGPS(store.lat, store.lon, 'transit', store.name, store)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg text-sm hover:bg-purple-600/30 transition border border-purple-500/30 disabled:opacity-50"
                      aria-label={`Naviguer en transport en commun vers ${store.name}`}
                      title={!isOnline ? "Navigation désactivée (hors ligne)" : "Transports en commun"}
                      disabled={isStoreNavigating || !isOnline}
                    >
                      {isStoreNavigating ? <Loader2 size={16} className="animate-spin" /> : <Bus size={16} />}
                      <span>Transports en commun</span>
                    </button>
                    <button
                      onClick={() => shareLocation(store)}
                      className="flex items-center justify-center px-3 py-2 bg-slate-600/20 text-slate-400 rounded-lg text-sm hover:bg-slate-600/30 transition border border-slate-500/30"
                      title="Partager la localisation"
                      aria-label={`Partager la localisation de ${store.name}`}
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
          
          {stores.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-2">🗺️ Aucun magasin référencé pour ce territoire</p>
              <p className="text-sm">Les données sont en cours de collecte pour ce territoire.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}