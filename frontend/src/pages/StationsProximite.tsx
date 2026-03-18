/**
 * StationsProximite — Stations-services autour de moi
 *
 * Page inspirée de l'application ZAGAZ :
 *   - Géolocalisation GPS du navigateur
 *   - Géocodage inversé via l'API Nominatim (OpenStreetMap) pour afficher l'adresse
 *   - Sélecteur de rayon de recherche (2 / 5 / 10 / 20 km)
 *   - Filtre par type de carburant
 *   - Carte Leaflet interactive avec marqueurs de stations et cercle de rayon
 *   - Liste triée par distance avec prix et lien GPS
 *
 * Sources de données :
 *   - GPS : Web Geolocation API (navigateur)
 *   - Adresse : Nominatim/OpenStreetMap (Licence ODbL)
 *   - Stations : fuel-prices.json (prix réglementés SARA/SRPP + stations statiques)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Fuel, ChevronRight, RotateCcw, AlertCircle, ArrowLeft } from 'lucide-react';
import { calculateDistance, formatDistance } from '../utils/geoLocation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StationLocation { lat: number; lng: number }

interface FuelEntry {
  fuelType: string;
  pricePerLiter: number;
}

interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  territory: string;
  location: StationLocation;
  brand: string;
  fuels: FuelEntry[];
  distance?: number; // km — computed after geolocation
}

type FuelFilter = 'TOUS' | 'SP95' | 'SP98' | 'DIESEL' | 'E10' | 'GPL' | 'E85';

const RADIUS_OPTIONS = [2, 5, 10, 20] as const;
type RadiusKm = (typeof RADIUS_OPTIONS)[number];

const FUEL_LABELS: Record<string, string> = {
  SP95: 'SP95', SP98: 'SP98', DIESEL: 'Gazole', E10: 'E10', GPL: 'GPLc', E85: 'E85',
};

const TERRITORY_CENTER: Record<string, [number, number]> = {
  GP: [16.265, -61.551],
  MQ: [14.641, -61.024],
  GF: [4.937,  -52.326],
  RE: [-21.115, 55.536],
  YT: [-12.827, 45.166],
  PM: [46.779,  -56.198],
  BL: [17.9,    -62.84],
  MF: [18.07,   -63.08],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Load + normalise fuel-prices.json → unique Station[] with fuels[] grouped */
async function loadStations(): Promise<Station[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/fuel-prices.json`);
  if (!res.ok) throw new Error('Impossible de charger les données carburant');
  const json = await res.json();

  const map = new Map<string, Station>();
  for (const entry of json.fuelPrices ?? []) {
    const s = entry.station;
    const loc: StationLocation | undefined = s?.location;
    if (!loc?.lat || !loc?.lng) continue; // skip entries without GPS

    const sid = s.id;
    if (!map.has(sid)) {
      map.set(sid, {
        id: sid,
        name: s.name ?? 'Station inconnue',
        address: s.address ?? '',
        city: s.city ?? '',
        territory: s.territory ?? '',
        location: loc,
        brand: s.brand ?? '',
        fuels: [],
      });
    }
    map.get(sid)!.fuels.push({
      fuelType: entry.fuelType,
      pricePerLiter: entry.pricePerLiter,
    });
  }
  return [...map.values()];
}

/** Reverse-geocode using Nominatim (OpenStreetMap) */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AkiPriSaYe/2.0 (akiprisaye.fr)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.display_name ?? '';
  } catch {
    return '';
  }
}

/** Custom Leaflet icon for fuel stations */
function stationIcon(brand: string): L.DivIcon {
  const colors: Record<string, string> = {
    Total: '#e20714', Shell: '#ffd700', Esso: '#0056a2',
    Pétrodom: '#ff6b00', Vito: '#6a0dad',
  };
  const bg = colors[brand] ?? '#1e40af';
  return L.divIcon({
    html: `
      <div style="
        background:${bg}; color:#fff; border-radius:50% 50% 50% 0; transform:rotate(-45deg);
        width:36px; height:36px; border:2px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,.4);
        display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700;
      ">
        <span style="transform:rotate(45deg)">⛽</span>
      </div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

/** Pulse icon for user position */
const userIcon = L.divIcon({
  html: `
    <div style="position:relative;width:20px;height:20px">
      <div style="
        width:20px;height:20px;border-radius:50%;background:#2563eb;
        border:3px solid #fff;box-shadow:0 2px 8px rgba(37,99,235,.6);
      "></div>
      <div style="
        position:absolute;inset:-6px;border-radius:50%;
        border:3px solid rgba(37,99,235,.4);animation:pulse 2s ease-out infinite;
      "></div>
    </div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Recentre the map when the user's position changes */
function MapRecenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], zoom); }, [map, lat, lng, zoom]);
  return null;
}

interface StationCardProps { station: Station; fuelFilter: FuelFilter }
function StationCard({ station, fuelFilter }: StationCardProps) {
  const fuels = station.fuels
    .filter((f) => fuelFilter === 'TOUS' || f.fuelType === fuelFilter)
    .sort((a, b) => a.fuelType.localeCompare(b.fuelType));

  const cheapest = fuels.length > 0 ? Math.min(...fuels.map((f) => f.pricePerLiter)) : null;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.location.lat},${station.location.lng}`;

  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">⛽</span>
            <h3 className="text-sm font-bold text-white truncate">{station.name}</h3>
          </div>
          <p className="text-xs text-slate-400 truncate">
            {station.address}{station.address && station.city ? ', ' : ''}{station.city}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          {station.distance !== undefined && (
            <span className="inline-block bg-blue-600/30 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full">
              {formatDistance(station.distance)}
            </span>
          )}
        </div>
      </div>

      {/* Prices */}
      {fuels.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {fuels.map((f) => (
            <div
              key={f.fuelType}
              className={`rounded-xl px-3 py-2 text-center ${
                f.pricePerLiter === cheapest
                  ? 'bg-emerald-700/40 border border-emerald-500/60'
                  : 'bg-slate-900/60 border border-slate-700/60'
              }`}
            >
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                {FUEL_LABELS[f.fuelType] ?? f.fuelType}
              </div>
              <div className={`text-base font-extrabold ${f.pricePerLiter === cheapest ? 'text-emerald-300' : 'text-white'}`}>
                {f.pricePerLiter.toFixed(3)} €
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic">Aucun prix pour ce carburant</p>
      )}

      {/* Navigation link */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-2 transition-colors"
        aria-label={`Naviguer GPS vers ${station.name}`}
      >
        <Navigation className="w-3.5 h-3.5" />
        Itinéraire GPS
      </a>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StationsProximite() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [allStations, setAllStations]     = useState<Station[]>([]);
  const [dataLoading, setDataLoading]     = useState(true);
  const [dataError, setDataError]         = useState<string | null>(null);

  const [gpsStatus, setGpsStatus]         = useState<'idle' | 'loading' | 'found' | 'denied' | 'error'>('idle');
  const [userPos, setUserPos]             = useState<{ lat: number; lng: number } | null>(null);
  const [userAddress, setUserAddress]     = useState<string>('');

  const [radius, setRadius]               = useState<RadiusKm>(5);
  const [radiusInput, setRadiusInput]     = useState('5');
  const [fuelFilter, setFuelFilter]       = useState<FuelFilter>('TOUS');

  // detect if user is already on DOM territory (default map center)
  const [mapCenter, setMapCenter]         = useState<[number, number]>(TERRITORY_CENTER.GP);
  const [mapZoom, setMapZoom]             = useState(11);

  const radiusInputRef = useRef<HTMLInputElement>(null);

  // ── Load stations ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadStations()
      .then(setAllStations)
      .catch((e) => setDataError(e.message))
      .finally(() => setDataLoading(false));
  }, []);

  // ── Geolocate ──────────────────────────────────────────────────────────────
  const handleLocalize = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('error');
      return;
    }
    setGpsStatus('loading');
    setUserAddress('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserPos({ lat, lng });
        setMapCenter([lat, lng]);
        setMapZoom(13);
        setGpsStatus('found');

        // Reverse geocode in background
        const addr = await reverseGeocode(lat, lng);
        if (addr) setUserAddress(addr);
      },
      (err) => {
        setGpsStatus(err.code === 1 ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300_000 },
    );
  }, []);

  // ── Apply radius ───────────────────────────────────────────────────────────
  const handleApplyRadius = useCallback(() => {
    const v = parseInt(radiusInput, 10);
    if (!isNaN(v) && v >= 1 && v <= 50) setRadius(v as RadiusKm);
  }, [radiusInput]);

  // ── Compute nearby stations ────────────────────────────────────────────────
  const nearbyStations = useMemo<Station[]>(() => {
    if (!userPos) return [];
    return allStations
      .map((st) => ({
        ...st,
        distance: calculateDistance(userPos.lat, userPos.lng, st.location.lat, st.location.lng),
      }))
      .filter((st) => st.distance! <= radius)
      .filter((st) => fuelFilter === 'TOUS' || st.fuels.some((f) => f.fuelType === fuelFilter))
      .sort((a, b) => a.distance! - b.distance!);
  }, [userPos, allStations, radius, fuelFilter]);

  // ── Fuel types available in nearby stations ────────────────────────────────
  const availableFuels = useMemo<FuelFilter[]>(() => {
    const types = new Set<string>();
    (userPos ? nearbyStations : allStations).forEach((st) =>
      st.fuels.forEach((f) => types.add(f.fuelType)),
    );
    return ['TOUS', ...[...types].sort()] as FuelFilter[];
  }, [nearbyStations, allStations, userPos]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <Helmet>
        <title>Stations-services autour de moi — A KI PRI SA YÉ</title>
        <meta name="description" content="Trouvez les stations-service les plus proches avec les prix du carburant (SP95, Diesel, SP98) en temps réel dans les DOM-TOM." />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/stations-proximite" />
      </Helmet>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse{0%{opacity:.8;transform:scale(1)}70%{opacity:0;transform:scale(2.5)}100%{opacity:0}}
      `}</style>

      <div className="min-h-screen bg-slate-950 text-white pb-12">
        {/* ── Hero ── */}
        <div className="bg-gradient-to-br from-orange-700 via-orange-600 to-amber-600 px-4 pt-10 pb-8">
          <div className="max-w-2xl mx-auto">
            <Link
              to="/comparateur-carburants"
              className="inline-flex items-center gap-1 text-orange-100/80 hover:text-white text-sm mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Comparateur carburants
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">⛽</div>
              <h1 className="text-2xl font-extrabold">Stations autour de moi</h1>
            </div>
            <p className="text-orange-100/90 text-sm">
              Localisez-vous pour trouver les stations les plus proches avec les prix réglementés DOM-TOM.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">

          {/* ── Data error ── */}
          {dataError && (
            <div className="flex items-center gap-3 bg-red-900/30 border border-red-500/40 rounded-2xl p-4 text-sm text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {dataError}
            </div>
          )}

          {/* ── Localisation card ── */}
          <section className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-400" /> Votre localisation
            </h2>

            {userAddress ? (
              <p className="text-sm text-slate-200 leading-relaxed">{userAddress}</p>
            ) : gpsStatus === 'idle' ? (
              <p className="text-sm text-slate-400 italic">Appuyez sur le bouton pour vous localiser</p>
            ) : gpsStatus === 'loading' ? (
              <p className="text-sm text-slate-400 animate-pulse">📡 Localisation en cours…</p>
            ) : gpsStatus === 'denied' ? (
              <p className="text-sm text-red-400">
                ⚠️ Accès GPS refusé. Autorisez la géolocalisation dans les paramètres de votre navigateur.
              </p>
            ) : gpsStatus === 'error' ? (
              <p className="text-sm text-red-400">❌ Impossible d'obtenir votre position.</p>
            ) : userPos ? (
              <p className="text-sm text-emerald-400">
                ✅ Position détectée — {userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleLocalize}
              disabled={gpsStatus === 'loading'}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              aria-label="Me localiser via GPS"
            >
              <MapPin className="w-4 h-4" />
              {gpsStatus === 'loading' ? 'Localisation…' : gpsStatus === 'found' ? '↺ Actualiser ma position' : 'Localisez-moi'}
            </button>
          </section>

          {/* ── Radius + fuel filter ── */}
          <section className="bg-slate-900/80 border border-slate-700 rounded-2xl p-5 space-y-4">
            {/* Radius row */}
            <div className="flex items-center gap-3">
              <label htmlFor="radius-input" className="text-sm font-semibold text-slate-300 whitespace-nowrap">
                Rayon
              </label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  id="radius-input"
                  ref={radiusInputRef}
                  type="number"
                  min={1}
                  max={50}
                  value={radiusInput}
                  onChange={(e) => setRadiusInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyRadius()}
                  className="w-24 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm text-center focus:border-orange-500 outline-none"
                  aria-label="Rayon de recherche en km"
                />
                <span className="text-slate-400 text-sm">km</span>
              </div>
              {/* Quick radius chips */}
              <div className="flex gap-1.5 flex-wrap justify-end">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRadiusInput(String(r)); setRadius(r); }}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      radius === r
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'
                    }`}
                    aria-pressed={radius === r}
                  >
                    {r} km
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleApplyRadius}
                className="flex-shrink-0 bg-orange-600 hover:bg-orange-500 text-white rounded-xl p-2 transition-colors"
                aria-label="Appliquer le rayon"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Fuel type filter */}
            <div>
              <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5" /> Carburant
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par carburant">
                {availableFuels.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFuelFilter(f)}
                    aria-pressed={fuelFilter === f}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      fuelFilter === f
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {f === 'TOUS' ? 'Tous' : FUEL_LABELS[f] ?? f}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Map ── */}
          <section className="rounded-2xl overflow-hidden border border-slate-700 shadow-xl" aria-label="Carte des stations">
            {!dataLoading && (
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '340px', width: '100%' }}
                scrollWheelZoom
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <MapRecenter lat={mapCenter[0]} lng={mapCenter[1]} zoom={mapZoom} />

                {/* User position */}
                {userPos && (
                  <>
                    <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
                      <Popup>
                        <strong>📍 Votre position</strong>
                        {userAddress && <><br /><span style={{fontSize:'0.75rem'}}>{userAddress.slice(0, 80)}…</span></>}
                      </Popup>
                    </Marker>
                    <Circle
                      center={[userPos.lat, userPos.lng]}
                      radius={radius * 1000}
                      pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.05, weight: 2, dashArray: '6 4' }}
                    />
                  </>
                )}

                {/* Station markers */}
                {(userPos ? nearbyStations : allStations).map((st) => (
                  <Marker
                    key={st.id}
                    position={[st.location.lat, st.location.lng]}
                    icon={stationIcon(st.brand)}
                  >
                    <Popup>
                      <div style={{ minWidth: 180, fontFamily: 'system-ui' }}>
                        <strong style={{ fontSize: '0.85rem' }}>⛽ {st.name}</strong>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{st.city}</span>
                        {st.distance !== undefined && (
                          <><br /><span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>📍 {formatDistance(st.distance)}</span></>
                        )}
                        <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                          {st.fuels
                            .filter((f) => fuelFilter === 'TOUS' || f.fuelType === fuelFilter)
                            .map((f) => (
                              <div key={f.fuelType} style={{ background: '#f1f5f9', borderRadius: 6, padding: '3px 6px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{FUEL_LABELS[f.fuelType] ?? f.fuelType}</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{f.pricePerLiter.toFixed(3)} €</div>
                              </div>
                            ))}
                        </div>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${st.location.lat},${st.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'block', marginTop: 8, background: '#ea580c', color: '#fff', borderRadius: 8, padding: '5px 10px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none' }}
                        >
                          ↗ Itinéraire GPS
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
            {dataLoading && (
              <div className="h-[340px] flex items-center justify-center bg-slate-900/60">
                <p className="text-slate-400 animate-pulse">Chargement de la carte…</p>
              </div>
            )}
          </section>

          {/* ── Results list ── */}
          {!userPos && gpsStatus === 'idle' && (
            <div className="text-center py-8 text-slate-400">
              <div className="text-4xl mb-3">📡</div>
              <p className="text-sm font-medium">Appuyez sur <strong className="text-orange-400">Localisez-moi</strong> pour voir les stations autour de vous.</p>
              <p className="text-xs text-slate-500 mt-1">La carte affiche toutes les stations disponibles dans les DOM-TOM.</p>
            </div>
          )}

          {userPos && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                  {nearbyStations.length > 0
                    ? `${nearbyStations.length} station${nearbyStations.length > 1 ? 's' : ''} dans un rayon de ${radius} km`
                    : `Aucune station dans un rayon de ${radius} km`}
                </h2>
                {nearbyStations.length === 0 && (
                  <button
                    type="button"
                    onClick={() => { setRadius(20); setRadiusInput('20'); }}
                    className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Élargir à 20 km
                  </button>
                )}
              </div>

              {nearbyStations.length === 0 && (
                <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-5 text-center">
                  <p className="text-slate-400 text-sm mb-2">Aucune station répertoriée dans ce rayon.</p>
                  <p className="text-xs text-slate-500">
                    Les prix sont réglementés — une station non listée affiche les mêmes tarifs officiels.
                  </p>
                </div>
              )}

              {nearbyStations.map((st) => (
                <StationCard key={st.id} station={st} fuelFilter={fuelFilter} />
              ))}
            </section>
          )}

          {/* ── Footer note ── */}
          <div className="border-t border-slate-800 pt-4 pb-2 text-center">
            <p className="text-xs text-slate-500">
              Prix réglementés DOM-TOM — Sources : SARA, SRPP, arrêtés préfectoraux 2025.{' '}
              <Link to="/comparateur-carburants" className="text-orange-400 hover:underline">
                Comparateur complet →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
