import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mock store data for DROM-COM
const mockStores = [
  {
    id: 1,
    name: "HyperDom Guadeloupe",
    territory: "guadeloupe",
    lat: 16.2415,
    lng: -61.5369,
    type: "hypermarché",
    priceLevel: "€€",
    products: [
      { name: "Lait UHT 1L", price: 1.45, compared_price_metro: 1.12 },
      { name: "Baguette", price: 1.20, compared_price_metro: 0.90 }
    ]
  },
  {
    id: 2,
    name: "TiPrix Martinique",
    territory: "martinique", 
    lat: 14.6118,
    lng: -61.0818,
    type: "supermarché",
    priceLevel: "€",
    products: [
      { name: "Yaourt nature", price: 2.50, compared_price_metro: 1.80 },
      { name: "Riz 1kg", price: 2.30, compared_price_metro: 1.85 }
    ]
  },
  {
    id: 3,
    name: "Market Guyane",
    territory: "guyane",
    lat: 4.9227,
    lng: -52.3269,
    type: "supermarché",
    priceLevel: "€€€",
    products: [
      { name: "Pâtes 500g", price: 1.36, compared_price_metro: 0.98 }
    ]
  },
  {
    id: 4,
    name: "Super Réunion",
    territory: "reunion",
    lat: -21.1151,
    lng: 55.5364,
    type: "hypermarché", 
    priceLevel: "€€",
    products: [
      { name: "Huile d'olive", price: 4.20, compared_price_metro: 3.50 }
    ]
  }
];

const territoryColors = {
  guadeloupe: '#10b981', // emerald
  martinique: '#3b82f6', // blue
  guyane: '#f59e0b',    // amber
  reunion: '#ef4444',   // red
  mayotte: '#8b5cf6'    // purple
};

// Custom marker icons for different price levels
const createCustomIcon = (priceLevel, territory) => {
  const color = territoryColors[territory] || '#6b7280';
  const symbol = priceLevel === '€' ? '€' : priceLevel === '€€' ? '€€' : '€€€';
  
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${symbol}</div>`,
    iconSize: [30, 30],
    className: 'custom-marker'
  });
};

function HeatmapLayer({ stores, showHeatmap }) {
  const map = useMap();
  
  useEffect(() => {
    if (!showHeatmap) return;
    
    // Simple heatmap simulation using circle overlays
    const heatPoints = stores.map(store => {
      const avgPrice = store.products.reduce((sum, p) => sum + p.price, 0) / store.products.length;
      const intensity = avgPrice > 3 ? 0.8 : avgPrice > 2 ? 0.5 : 0.3;
      
      return L.circle([store.lat, store.lng], {
        radius: 50000,
        fillColor: '#ff0000',
        fillOpacity: intensity * 0.3,
        stroke: false
      });
    });
    
    const heatLayer = L.layerGroup(heatPoints);
    heatLayer.addTo(map);
    
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, stores, showHeatmap]);
  
  return null;
}

export default function Carte() {
  const [selectedTerritory, setSelectedTerritory] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  
  // Filter stores based on selection
  const filteredStores = mockStores.filter(store => {
    const territoryMatch = selectedTerritory === 'all' || store.territory === selectedTerritory;
    const priceMatch = priceFilter === 'all' || store.priceLevel === priceFilter;
    return territoryMatch && priceMatch;
  });
  
  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Géolocalisation non disponible:', error);
        }
      );
    }
  }, []);
  
  // Calculate map center based on filtered stores
  const mapCenter = filteredStores.length > 0 
    ? [
        filteredStores.reduce((sum, store) => sum + store.lat, 0) / filteredStores.length,
        filteredStores.reduce((sum, store) => sum + store.lng, 0) / filteredStores.length
      ]
    : [14.6118, -61.0818]; // Default to Martinique
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🌍 Carte Interactive des Prix
        </h1>
        <p className="text-gray-600 mb-6">
          Découvrez les magasins près de chez vous et comparez les prix en temps réel
        </p>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Territoire
            </label>
            <select 
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Tous les territoires</option>
              <option value="guadeloupe">🇬🇵 Guadeloupe</option>
              <option value="martinique">🇲🇶 Martinique</option>
              <option value="guyane">🇬🇫 Guyane</option>
              <option value="reunion">🇷🇪 Réunion</option>
              <option value="mayotte">🇾🇹 Mayotte</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau de prix
            </label>
            <select 
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Tous les niveaux</option>
              <option value="€">€ Économique</option>
              <option value="€€">€€ Moyen</option>
              <option value="€€€">€€€ Premium</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                showHeatmap 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showHeatmap ? '🔥 Masquer heatmap' : '🔥 Afficher heatmap'}
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{filteredStores.length}</div>
            <div className="text-sm text-blue-800">Magasins trouvés</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {filteredStores.reduce((sum, store) => sum + store.products.length, 0)}
            </div>
            <div className="text-sm text-green-800">Produits référencés</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(filteredStores.map(store => store.territory)).size}
            </div>
            <div className="text-sm text-purple-800">Territoires couverts</div>
          </div>
        </div>
      </div>
      
      {/* Map */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
        <MapContainer 
          center={mapCenter} 
          zoom={selectedTerritory === 'all' ? 4 : 10}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Heatmap layer */}
          <HeatmapLayer stores={filteredStores} showHeatmap={showHeatmap} />
          
          {/* User location marker */}
          {userLocation && (
            <Marker 
              position={[userLocation.lat, userLocation.lng]}
              icon={L.divIcon({
                html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                iconSize: [20, 20],
                className: 'user-location-marker'
              })}
            >
              <Popup>
                <div className="text-center">
                  <strong>📍 Votre position</strong>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Store markers */}
          {filteredStores.map((store) => (
            <Marker 
              key={store.id} 
              position={[store.lat, store.lng]}
              icon={createCustomIcon(store.priceLevel, store.territory)}
            >
              <Popup maxWidth={300}>
                <div className="p-2">
                  <h3 className="font-bold text-lg mb-2">{store.name}</h3>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="inline-block px-2 py-1 bg-gray-100 rounded mr-2">
                      {store.type}
                    </span>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {store.territory}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Produits disponibles:</h4>
                    {store.products.map((product, idx) => {
                      const diff = ((product.price - product.compared_price_metro) / product.compared_price_metro * 100).toFixed(1);
                      return (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span>{product.name}</span>
                          <div className="text-right">
                            <div className="font-semibold">{product.price}€</div>
                            <div className={`text-xs ${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {diff > 0 ? '+' : ''}{diff}% vs métropole
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <button className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Voir tous les prix
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Légende</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Votre position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>€ Économique</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span>€€ Moyen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>€€€ Premium</span>
          </div>
          {showHeatmap && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full opacity-30"></div>
              <span>Zone de cherté (heatmap)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}