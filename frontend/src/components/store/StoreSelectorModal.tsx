import { useMemo, useState } from 'react';
import { storesMock } from '../../modules/store/stores.mock';
import type { ServiceMode, Store } from '../../modules/store/types';

interface Props {
  open: boolean;
  territory: string;
  onClose: () => void;
  onSelect: (store: Store, serviceMode: ServiceMode) => void;
}

const SERVICE_LABELS: Record<ServiceMode, string> = {
  inStore: 'Magasin',
  drive: 'Drive',
  delivery: 'Livraison',
};

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(from: { lat: number; lon: number }, to: { lat?: number; lon?: number }) {
  if (typeof to.lat !== 'number' || typeof to.lon !== 'number') return null;
  const earth = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function StoreSelectorModal({ open, territory, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [serviceMode, setServiceMode] = useState<ServiceMode>('inStore');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const stores = useMemo(() => {
    const queryLower = query.trim().toLowerCase();
    return storesMock
      .filter((store) => store.territory === territory)
      .filter((store) => {
        if (!queryLower) return true;
        return [store.name, store.city, store.postalCode].filter(Boolean).join(' ').toLowerCase().includes(queryLower);
      })
      .map((store) => ({
        store,
        distance: userCoords ? distanceKm(userCoords, store) : null,
      }))
      .sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  }, [query, territory, userCoords]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <button type="button" className="absolute inset-0 bg-black/60 cursor-default" onClick={onClose} tabIndex={-1} aria-label="Fermer" />
      <div className="relative z-10 w-full md:max-w-2xl bg-slate-900 border border-slate-700 rounded-t-2xl md:rounded-2xl p-4 max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Choisir un magasin</h2>
          <button className="text-sm text-slate-300" onClick={onClose}>Fermer</button>
        </div>

        <div className="space-y-3 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ville ou code postal"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 bg-slate-800"
            onClick={() => {
              setGeoError(null);
              if (!navigator.geolocation) {
                setGeoError('Géolocalisation non disponible sur cet appareil.');
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setUserCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
                },
                () => {
                  setGeoError('Accès à la géolocalisation refusé.');
                },
                { enableHighAccuracy: false, timeout: 6000 },
              );
            }}
          >
            Utiliser ma position
          </button>
          {geoError && <p className="text-xs text-amber-300">{geoError}</p>}
        </div>

        <div className="space-y-3">
          {stores.map(({ store, distance }) => {
            const isModeAvailable = store.services[serviceMode];
            return (
              <article key={store.id} className="border border-slate-700 rounded-xl p-3 bg-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{store.name}</h3>
                    <p className="text-xs text-slate-400">{store.city} {store.postalCode ? `• ${store.postalCode}` : ''}</p>
                    {distance !== null && <p className="text-xs text-slate-400">{distance.toFixed(1)} km</p>}
                    <div className="mt-2 flex gap-2 flex-wrap text-xs">
                      {(['inStore', 'drive', 'delivery'] as ServiceMode[]).map((mode) => (
                        <span key={mode} className={`px-2 py-0.5 rounded border ${store.services[mode] ? 'border-slate-500 text-slate-200' : 'border-slate-700 text-slate-500'}`}>
                          {SERVICE_LABELS[mode]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="min-w-[150px] space-y-2">
                    <select
                      value={serviceMode}
                      onChange={(e) => setServiceMode(e.target.value as ServiceMode)}
                      className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                    >
                      {(['inStore', 'drive', 'delivery'] as ServiceMode[]).map((mode) => (
                        <option key={mode} value={mode} disabled={!store.services[mode]}>
                          {SERVICE_LABELS[mode]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!isModeAvailable}
                      onClick={() => onSelect(store, serviceMode)}
                      className="w-full rounded bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 px-3 py-1.5 text-xs"
                    >
                      Choisir
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          {stores.length === 0 && <p className="text-sm text-slate-400">Aucun magasin trouvé.</p>}
        </div>
      </div>
    </div>
  );
}
