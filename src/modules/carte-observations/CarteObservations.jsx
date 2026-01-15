import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React-Leaflet
// Leaflet's default icon paths need to be set explicitly
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

/**
 * Carte Observations Component
 * Read-only map of validated price observations
 * Uses neutral presentation, no accusations
 * @param {string} territory - Filter by territory
 * @param {string} productFilter - Filter by product
 */
export default function CarteObservations({ territory = null, productFilter = null }) {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    territory: territory || 'all',
    product: productFilter || 'all',
    city: 'all',
    startDate: null,
    endDate: null,
  });

  // Default center (Guadeloupe)
  const defaultCenter = [16.265, -61.551];
  const defaultZoom = 10;

  useEffect(() => {
    const loadObservations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/observations-validees.json');
        if (!response.ok) {
          throw new Error('Impossible de charger les observations');
        }
        const data = await response.json();
        setObservations(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Erreur de chargement:', err);
      } finally {
        setLoading(false);
      }
    };

    loadObservations();
  }, []);

  // Apply filters
  const filteredObservations = observations.filter((obs) => {
    if (filters.territory !== 'all' && obs.territory !== filters.territory) {
      return false;
    }
    if (filters.product !== 'all' && obs.product !== filters.product) {
      return false;
    }
    if (filters.city !== 'all' && obs.city !== filters.city) {
      return false;
    }
    if (filters.startDate && obs.date < filters.startDate) {
      return false;
    }
    if (filters.endDate && obs.date > filters.endDate) {
      return false;
    }
    return true;
  });

  // Get unique values for filters
  const uniqueTerritories = [...new Set(observations.map((o) => o.territory))];
  const uniqueProducts = [...new Set(observations.map((o) => o.product))];
  const uniqueCities = [...new Set(
    observations
      .filter((o) => filters.territory === 'all' || o.territory === filters.territory)
      .map((o) => o.city)
  )];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold">Erreur</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🗺️ Carte des Observations de Prix
        </h2>
        <p className="text-sm text-gray-600">
          Visualisation des observations citoyennes validées
        </p>
      </div>

      {/* Legal Protection Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium mb-2">
          ℹ️ Information importante
        </p>
        <p className="text-sm text-blue-800">
          Les observations affichées sont issues de <strong>contributions citoyennes validées</strong>.
          Elles visent à informer sur les niveaux de prix constatés à un instant donné,
          sans qualifier ni juger les pratiques commerciales.
          Ces données sont fournies à titre informatif uniquement.
        </p>
      </div>

      {/* Filters */}
      <FiltresCarte
        filters={filters}
        onFilterChange={setFilters}
        territories={uniqueTerritories}
        products={uniqueProducts}
        cities={uniqueCities}
      />

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Observations affichées</p>
            <p className="text-2xl font-bold text-gray-900">{filteredObservations.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total validé</p>
            <p className="text-2xl font-bold text-gray-900">{observations.length}</p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '600px' }}>
        {filteredObservations.length > 0 ? (
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MarkerClusterGroup>
              {filteredObservations.map((obs) => (
                <Marker key={obs.id} position={[obs.geo.lat, obs.geo.lng]}>
                  <Popup maxWidth={300}>
                    <ObservationPopup observation={obs} />
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <p className="text-gray-500 mb-2">Aucune observation avec ces filtres</p>
              <button
                onClick={() => setFilters({
                  territory: 'all',
                  product: 'all',
                  city: 'all',
                  startDate: null,
                  endDate: null,
                })}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-700">
          <strong>📌 Lecture seule :</strong> Cette carte présente uniquement des observations validées.
          Pour contribuer, utilisez le formulaire de signalement accessible depuis le menu "Contribuer".
          Les données sont vérifiées avant publication et ne comportent aucun nom de contributeur.
        </p>
      </div>
    </div>
  );
}
