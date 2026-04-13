import { Popup } from 'react-leaflet';
import { StoreMarker } from '../../types/map';
import { PRICE_COLORS, getPriceCategory } from '../../utils/priceColors';
import { formatDistance } from '../../utils/geoUtils';

interface StorePopupProps {
  store: StoreMarker;
  onGetDirections?: (store: StoreMarker) => void;
  onViewDetails?: (store: StoreMarker) => void;
}

export default function StorePopup({
  store,
  onGetDirections,
  onViewDetails,
}: StorePopupProps) {
  const category = getPriceCategory(store.priceIndex);
  const priceConfig = PRICE_COLORS[category];

  return (
    <Popup maxWidth={300} className="store-popup">
      <div className="p-2">
        {/* Header */}
        <div className="mb-3">
          {store.chainLogo && (
            <img
              src={store.chainLogo}
              alt={store.chain}
              loading="lazy"
              className="h-8 mb-2 object-contain"
            />
          )}
          <h3 className="font-semibold text-lg text-slate-900" id={`store-${store.id}`}>
            {store.name}
          </h3>
          <p className="text-sm text-slate-600">{store.chain}</p>
        </div>

        {/* Address */}
        <div className="mb-3 text-sm text-slate-700">
          <p>{store.address}</p>
          {store.city && store.postalCode && (
            <p>
              {store.postalCode} {store.city}
            </p>
          )}
          {store.phone && (
            <p className="mt-1">
              <a
                href={`tel:${store.phone}`}
                className="text-blue-600 hover:underline"
              >
                📞 {store.phone}
              </a>
            </p>
          )}
        </div>

        {/* Price Index */}
        <div className="mb-3 p-2 bg-slate-50 rounded">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-slate-700">
              Indice de prix
            </span>
            <span className="text-lg" role="img" aria-label={priceConfig.label}>
              {priceConfig.icon}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold" style={{ color: priceConfig.color }}>
              {store.priceIndex}
            </span>
            <span className="text-sm text-slate-600">/100</span>
            <span className="text-xs text-slate-500 ml-auto">
              {priceConfig.label}
            </span>
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Panier moyen: <strong>{store.averageBasketPrice.toFixed(2)} €</strong>
          </div>
        </div>

        {/* Distance */}
        {store.distance !== undefined && (
          <div className="mb-3 text-sm">
            <span className="text-blue-600 font-medium">
              📍 {formatDistance(store.distance)}
            </span>
            <span className="text-slate-500 ml-1">(depuis votre position)</span>
          </div>
        )}

        {/* Services */}
        {store.services && store.services.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate-600 mb-1">Services:</p>
            <div className="flex flex-wrap gap-1">
              {store.services.map((service) => (
                <span
                  key={service}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Open Status */}
        {store.isOpen !== undefined && (
          <div className="mb-3">
            <span
              className={`text-xs px-2 py-1 rounded ${
                store.isOpen
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {store.isOpen ? '🟢 Ouvert' : '🔴 Fermé'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {onGetDirections && (
            <button
              onClick={() => onGetDirections(store)}
              className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              aria-label={`Obtenir l'itinéraire vers ${store.name}`}
            >
              🧭 Itinéraire
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(store)}
              className="flex-1 px-3 py-2 bg-slate-200 text-slate-800 text-sm rounded hover:bg-slate-300 transition-colors"
              aria-label={`Voir les détails de ${store.name}`}
            >
              ℹ️ Détails
            </button>
          )}
        </div>
      </div>
    </Popup>
  );
}
