import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { STORES } from '../../data/stores';
import { useStoreContext } from '../../context/StoreContext';
import { formatDistance, getDistanceKm, isOpenNow } from '../../utils/storeUtils';
import { getTerritory } from '../../constants/territories';

interface UserPosition {
  lat: number;
  lon: number;
}

export default function StorePicker() {
  const { preferredStore, setPreferredStore } = useStoreContext();
  const [query, setQuery] = useState('');
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const stores = useMemo(() => {
    const filtered = STORES.filter((store) => {
      if (!normalizedQuery) return true;
      return [store.name, store.city, store.postalCode].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      );
    });

    const withDistance = filtered.map((store) => ({
      ...store,
      distanceKm: userPosition ? getDistanceKm(userPosition, { lat: store.lat, lon: store.lon }) : undefined,
    }));

    return withDistance.sort((a, b) => {
      if (typeof a.distanceKm === 'number' && typeof b.distanceKm === 'number') {
        return a.distanceKm - b.distanceKm;
      }
      return a.name.localeCompare(b.name, 'fr');
    });
  }, [normalizedQuery, userPosition]);

  const requestUserPosition = () => {
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n’est pas disponible sur cet appareil.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoError(null);
        setUserPosition({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      () => {
        setGeoError('Impossible de récupérer votre position. Vérifiez les permissions.');
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ville, code postal ou nom du magasin"
          className="flex-1 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white"
        />
        <button
          type="button"
          onClick={requestUserPosition}
          className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Utiliser ma position
        </button>
      </div>

      {geoError && <p className="text-sm text-amber-300">{geoError}</p>}

      <div className="grid gap-3">
        {stores.map((store) => {
          const territory = getTerritory(store.territory);
          const openingStatus = isOpenNow(store.openingHours, new Date(), territory.timezone);

          return (
            <article key={store.id} className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">{territory.label} • {store.postalCode}</p>
                  <h3 className="text-lg font-semibold text-white">{store.name}</h3>
                  <p className="text-sm text-slate-300">{store.city} — {store.address}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${openingStatus.open ? 'bg-emerald-600/20 text-emerald-300' : 'bg-rose-600/20 text-rose-300'}`}>
                    {openingStatus.open ? 'Ouvert' : 'Fermé'}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">{formatDistance(store.distanceKm)}</p>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-400">{openingStatus.label}</p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreferredStore(store)}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Choisir
                </button>
                <Link to={`/stores/${store.id}`} className="text-sm text-blue-300 hover:text-blue-200">
                  Voir la fiche magasin
                </Link>
                {preferredStore?.id === store.id && (
                  <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">Magasin sélectionné</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
