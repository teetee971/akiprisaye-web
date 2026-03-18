/**
 * StationsProximite — Trouvez les stations-service autour de vous
 *
 * Design 100 % original "PULSE" — inspiré fonctionnellement de l'écosystème
 * de comparateurs carburant (principe : GPS + rayon + carte + liste), mais
 * avec une identité visuelle entièrement nouvelle :
 *
 *   • Marqueurs de carte : pastille flottante blanche + ligne verticale + point pulsant
 *   • Badges carburant : gradient bicolore unique par type, jamais vus ailleurs
 *   • Cartes stations : glass card sombre + accent couleur gauche + layout horizontal
 *   • Aucune icône PNG externe — tout en SVG inline / CSS
 *
 * Sources :
 *   GPS     : Web Geolocation API
 *   Adresse : Nominatim / OpenStreetMap (ODbL)
 *   Prix    : fuel-prices.json (SARA · SRPP · arrêtés préfectoraux 2025)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateDistance, formatDistance } from '../utils/geoLocation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StationLocation { lat: number; lng: number }
interface FuelEntry { fuelType: string; pricePerLiter: number }
interface Station {
  id: string; name: string; address: string; city: string;
  territory: string; location: StationLocation; brand: string;
  fuels: FuelEntry[]; distance?: number;
}

type FuelFilter = 'TOUS' | 'SP95' | 'SP98' | 'DIESEL' | 'E10' | 'GPL' | 'E85';
type SortMode  = 'distance' | 'price';

const RADIUS_OPTIONS = [2, 5, 10, 20] as const;
type RadiusKm = (typeof RADIUS_OPTIONS)[number];

// ─── Fuel Design System ───────────────────────────────────────────────────────
// Completely original gradient palette — nothing like the EU standard colors

const FUEL_DESIGN: Record<string, {
  label: string; abbr: string;
  from: string; to: string;   // gradient start/end
  glow: string;               // box-shadow glow color
  text: string;
}> = {
  SP95:   { label: 'SP 95',   abbr: '95',  from: '#6366f1', to: '#a855f7', glow: '#818cf8', text: '#fff' },
  SP98:   { label: 'SP 98',   abbr: '98',  from: '#ec4899', to: '#f43f5e', glow: '#f472b6', text: '#fff' },
  DIESEL: { label: 'Gazole',  abbr: 'GO',  from: '#0ea5e9', to: '#2563eb', glow: '#38bdf8', text: '#fff' },
  E10:    { label: 'E 10',    abbr: 'E10', from: '#10b981', to: '#0891b2', glow: '#34d399', text: '#fff' },
  E85:    { label: 'E 85',    abbr: 'E85', from: '#22c55e', to: '#84cc16', glow: '#4ade80', text: '#052e16' },
  GPL:    { label: 'GPL c',   abbr: 'GPL', from: '#f59e0b', to: '#f97316', glow: '#fbbf24', text: '#1c1917' },
};

const FUEL_ORDER = ['DIESEL', 'SP95', 'E10', 'SP98', 'E85', 'GPL'];

// ─── Brand Accent ─────────────────────────────────────────────────────────────

const BRAND_ACCENT: Record<string, string> = {
  Total: '#e20714', Shell: '#f5c518', Esso: '#0056a2',
  Pétrodom: '#ff6b00', Vito: '#9333ea', BP: '#007a33',
};
const DEFAULT_ACCENT = '#6366f1';

function brandAccent(brand: string) {
  return BRAND_ACCENT[brand] ?? DEFAULT_ACCENT;
}

// ─── Territory defaults ───────────────────────────────────────────────────────

const TERRITORY_CENTER: Record<string, [number, number]> = {
  GP: [16.265, -61.551], MQ: [14.641, -61.024], GF: [4.937, -52.326],
  RE: [-21.115, 55.536], YT: [-12.827, 45.166],  PM: [46.779, -56.198],
  BL: [17.9, -62.84],    MF: [18.07, -63.08],
};

// ─── Data helpers ─────────────────────────────────────────────────────────────

async function loadStations(): Promise<Station[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/fuel-prices.json`);
  if (!res.ok) throw new Error('Données indisponibles');
  const json = await res.json();
  const map = new Map<string, Station>();
  for (const entry of json.fuelPrices ?? []) {
    const s = entry.station;
    const loc: StationLocation | undefined = s?.location;
    if (!loc?.lat || !loc?.lng) continue;
    if (!map.has(s.id)) {
      map.set(s.id, {
        id: s.id, name: s.name ?? 'Station', address: s.address ?? '',
        city: s.city ?? '', territory: s.territory ?? '',
        location: loc, brand: s.brand ?? '', fuels: [],
      });
    }
    map.get(s.id)!.fuels.push({ fuelType: entry.fuelType, pricePerLiter: entry.pricePerLiter });
  }
  for (const st of map.values()) {
    st.fuels.sort((a, b) => FUEL_ORDER.indexOf(a.fuelType) - FUEL_ORDER.indexOf(b.fuelType));
  }
  return [...map.values()];
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
      { headers: { 'User-Agent': 'AkiPriSaYe/2.0 (akiprisaye.fr)' }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return '';
    const d = await res.json();
    const a = d.address ?? {};
    return [a.road, a.house_number, a.postcode, a.city ?? a.town ?? a.village]
      .filter(Boolean).join(', ') || d.display_name?.slice(0, 80) || '';
  } catch { return ''; }
}

// ─── Leaflet Icons ────────────────────────────────────────────────────────────

/**
 * PULSE marker — original design:
 *   A floating price tag (white rounded pill) connected by a thin line to a
 *   pulsing coloured dot on the ground.  Nothing like the ZAGAZ teardrop.
 */
function makePulseMarker(accent: string, priceLabel: string, fuelAbbr: string): L.DivIcon {
  const pill = priceLabel
    ? `<div style="
          background:#fff;border-radius:20px;padding:3px 8px;
          box-shadow:0 4px 14px rgba(0,0,0,.35),0 0 0 2px ${accent};
          font-size:11px;font-weight:800;color:#0f172a;
          white-space:nowrap;line-height:1.2;text-align:center;
          display:flex;flex-direction:column;align-items:center;
        ">
          ${fuelAbbr ? `<span style="font-size:8px;color:${accent};font-weight:700;letter-spacing:.05em">${fuelAbbr}</span>` : ''}
          <span>${priceLabel}</span>
        </div>`
    : '';

  const totalHeight = priceLabel ? 68 : 22;
  const anchorY     = totalHeight;

  return L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:64px">
        ${pill}
        ${priceLabel ? `<div style="width:2px;height:16px;background:linear-gradient(to bottom,${accent},transparent)"></div>` : ''}
        <!-- Pulsing dot -->
        <div style="position:relative;width:14px;height:14px">
          <div style="
            position:absolute;inset:-5px;border-radius:50%;
            background:${accent};opacity:.25;
            animation:pulseRing 2s ease-out infinite;
          "></div>
          <div style="
            width:14px;height:14px;border-radius:50%;
            background:${accent};border:2.5px solid #fff;
            box-shadow:0 2px 8px ${accent}88;
          "></div>
        </div>
      </div>`,
    className: '',
    iconSize:   [64, totalHeight],
    iconAnchor: [32, anchorY],
    popupAnchor:[0, -(totalHeight + 4)],
  });
}

/** User location — animated teal beacon */
const meIcon = L.divIcon({
  html: `
    <div style="position:relative;width:24px;height:24px">
      <div style="position:absolute;inset:-8px;border-radius:50%;
        background:rgba(20,184,166,.2);animation:pulseRing 2s ease-out infinite"></div>
      <div style="position:absolute;inset:-4px;border-radius:50%;
        background:rgba(20,184,166,.15);animation:pulseRing 2s .6s ease-out infinite"></div>
      <div style="width:24px;height:24px;border-radius:50%;
        background:#14b8a6;border:3px solid #fff;
        box-shadow:0 3px 12px rgba(20,184,166,.7)"></div>
    </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function MapRecenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], zoom); }, [map, lat, lng, zoom]);
  return null;
}

/** Gradient fuel chip — shows type + optional price */
function FuelChip({
  fuelType, price, active = false, onClick,
}: {
  fuelType: string; price?: number; active?: boolean; onClick?: () => void;
}) {
  const d = FUEL_DESIGN[fuelType];
  if (!d) return null;
  const tag = onClick ? 'button' : 'div';
  const style: React.CSSProperties = {
    background: `linear-gradient(135deg,${d.from},${d.to})`,
    boxShadow: active ? `0 0 0 2px #fff, 0 0 12px ${d.glow}88` : `0 2px 8px ${d.from}44`,
    color: d.text,
    borderRadius: 12,
    padding: price !== undefined ? '6px 10px' : '4px 10px',
    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
    minWidth: 48, cursor: onClick ? 'pointer' : 'default',
    border: active ? `2px solid ${d.glow}` : '2px solid transparent',
    transition: 'box-shadow .2s, border-color .2s',
    userSelect: 'none',
  };

  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} style={style}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', opacity: .85 }}>{d.abbr}</span>
      {price !== undefined && (
        <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.1 }}>{price.toFixed(3)}<span style={{ fontSize: 9 }}>€</span></span>
      )}
    </button>
  ) : (
    <div style={style}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', opacity: .85 }}>{d.abbr}</span>
      {price !== undefined && (
        <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.1 }}>{price.toFixed(3)}<span style={{ fontSize: 9 }}>€</span></span>
      )}
    </div>
  );
}

interface StationCardProps { station: Station; fuelFilter: FuelFilter; isCheapest: boolean }

function StationCard({ station, fuelFilter, isCheapest }: StationCardProps) {
  const accent = brandAccent(station.brand);
  const fuels  = station.fuels.filter(
    (f) => fuelFilter === 'TOUS' || f.fuelType === fuelFilter,
  );
  const cheapestPrice = fuels.length > 0 ? Math.min(...fuels.map((f) => f.pricePerLiter)) : null;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.location.lat},${station.location.lng}`;

  return (
    <div
      className="relative overflow-hidden rounded-2xl transition-shadow hover:shadow-2xl"
      style={{
        background: 'rgba(15,23,42,.75)',
        backdropFilter: 'blur(12px)',
        border: isCheapest ? '1.5px solid rgba(52,211,153,.5)' : '1.5px solid rgba(148,163,184,.12)',
        boxShadow: isCheapest ? '0 0 32px rgba(52,211,153,.12)' : '0 4px 24px rgba(0,0,0,.3)',
      }}
    >
      {/* Coloured left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: `linear-gradient(to bottom, ${accent}, ${accent}44)` }}
      />

      {/* Cheapest ribbon */}
      {isCheapest && (
        <div
          className="absolute top-3 right-0 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-l-full"
          style={{ background: 'linear-gradient(135deg,#10b981,#34d399)', color: '#fff' }}
        >
          ✦ Moins cher
        </div>
      )}

      <div className="pl-4 pr-4 py-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Brand avatar */}
          <div
            className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg"
            style={{ background: `linear-gradient(135deg,${accent},${accent}99)` }}
          >
            {(station.brand || station.name).slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white leading-snug truncate">{station.name}</h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {[station.address, station.city].filter(Boolean).join(', ')}
            </p>
          </div>
          {station.distance !== undefined && (
            <div className="flex-shrink-0 flex flex-col items-end">
              <span className="text-lg font-extrabold text-white leading-none">
                {formatDistance(station.distance)}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wide">de vous</span>
            </div>
          )}
        </div>

        {/* Fuel chips */}
        {fuels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {fuels.map((f) => (
              <FuelChip key={f.fuelType} fuelType={f.fuelType} price={f.pricePerLiter}
                active={f.pricePerLiter === cheapestPrice} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-600 italic">Aucun prix pour ce carburant</p>
        )}

        {/* CTA */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full text-xs font-bold py-2.5 rounded-xl transition-all hover:brightness-110 active:scale-[.98]"
          style={{
            background: `linear-gradient(135deg,${accent},${accent}bb)`,
            color: '#fff',
            boxShadow: `0 4px 14px ${accent}55`,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L12 22M12 2L6 8M12 2L18 8"/>
          </svg>
          Itinéraire GPS
        </a>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StationsProximite() {
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError,   setDataError]   = useState<string | null>(null);

  const [gpsStatus,    setGpsStatus]   = useState<'idle'|'loading'|'found'|'denied'|'error'>('idle');
  const [userPos,      setUserPos]     = useState<{ lat: number; lng: number } | null>(null);
  const [userAddress,  setUserAddress] = useState('');

  const [radius,      setRadius]      = useState<RadiusKm>(5);
  const [radiusInput, setRadiusInput] = useState('5');
  const [fuelFilter,  setFuelFilter]  = useState<FuelFilter>('TOUS');
  const [sortMode,    setSortMode]    = useState<SortMode>('distance');

  const [mapCenter, setMapCenter] = useState<[number, number]>(TERRITORY_CENTER.GP);
  const [mapZoom,   setMapZoom]   = useState(11);

  const radiusRef = useRef<HTMLInputElement>(null);

  // Load stations
  useEffect(() => {
    loadStations()
      .then(setAllStations)
      .catch((e) => setDataError(e.message))
      .finally(() => setDataLoading(false));
  }, []);

  // GPS
  const handleLocalize = useCallback(async () => {
    if (!('geolocation' in navigator)) { setGpsStatus('error'); return; }
    setGpsStatus('loading');
    setUserAddress('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setUserPos({ lat, lng });
        setMapCenter([lat, lng]);
        setMapZoom(13);
        setGpsStatus('found');
        const addr = await reverseGeocode(lat, lng);
        if (addr) setUserAddress(addr);
      },
      (err) => setGpsStatus(err.code === 1 ? 'denied' : 'error'),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 300_000 },
    );
  }, []);

  const handleApplyRadius = useCallback(() => {
    const v = parseInt(radiusInput, 10);
    if (!isNaN(v) && v >= 1 && v <= 50) setRadius(v as RadiusKm);
  }, [radiusInput]);

  // Nearby + sorted stations
  const nearbyStations = useMemo<Station[]>(() => {
    const base = userPos
      ? allStations
          .map((st) => ({ ...st, distance: calculateDistance(userPos.lat, userPos.lng, st.location.lat, st.location.lng) }))
          .filter((st) => st.distance! <= radius)
      : allStations;

    const filtered = base.filter(
      (st) => fuelFilter === 'TOUS' || st.fuels.some((f) => f.fuelType === fuelFilter),
    );

    return [...filtered].sort((a, b) => {
      if (sortMode === 'price') {
        const pick = (st: Station) => st.fuels
          .filter((f) => fuelFilter === 'TOUS' || f.fuelType === fuelFilter)
          .reduce((m, f) => Math.min(m, f.pricePerLiter), Infinity);
        return pick(a) - pick(b);
      }
      return (a.distance ?? 0) - (b.distance ?? 0);
    });
  }, [userPos, allStations, radius, fuelFilter, sortMode]);

  // Cheapest station for selected fuel
  const cheapestId = useMemo(() => {
    const key = fuelFilter !== 'TOUS' ? fuelFilter : 'SP95';
    let min = Infinity, winner = '';
    for (const st of nearbyStations) {
      const match = st.fuels.find((f) => f.fuelType === key);
      if (match && match.pricePerLiter < min) { min = match.pricePerLiter; winner = st.id; }
    }
    return winner || null;
  }, [nearbyStations, fuelFilter]);

  // Available fuel types
  const availableFuels = useMemo<FuelFilter[]>(() => {
    const types = new Set<string>();
    (userPos ? nearbyStations : allStations).forEach((st) =>
      st.fuels.forEach((f) => types.add(f.fuelType)),
    );
    return ['TOUS', ...FUEL_ORDER.filter((f) => types.has(f))] as FuelFilter[];
  }, [nearbyStations, allStations, userPos]);

  const mapStations = userPos ? nearbyStations : allStations;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <Helmet>
        <title>Stations-service à proximité — A KI PRI SA YÉ</title>
        <meta name="description" content="Trouvez les stations-service les plus proches avec les prix réglementés du carburant en DOM-TOM. GPS, carte interactive, itinéraire." />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/stations-proximite" />
      </Helmet>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes pulseRing {
          0%   { opacity: .8; transform: scale(1); }
          70%  { opacity: 0;  transform: scale(2.8); }
          100% { opacity: 0;  transform: scale(2.8); }
        }
        .leaflet-container { font-family: inherit; }
      `}</style>

      <div className="min-h-screen text-white" style={{ background: 'linear-gradient(160deg,#0a0f1e 0%,#0f172a 60%,#1a0a2e 100%)' }}>

        {/* ── Hero header ── */}
        <div className="relative overflow-hidden px-4 pt-10 pb-8">
          {/* Decorative blur orbs */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle,#f97316,transparent 70%)' }} />
          <div className="absolute top-4 -left-8 w-48 h-48 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle,#6366f1,transparent 70%)' }} />

          <div className="relative max-w-2xl mx-auto">
            <Link
              to="/comparateur-carburants"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs uppercase tracking-widest mb-5 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
              </svg>
              Comparateur carburants
            </Link>

            <div className="flex items-center gap-4 mb-3">
              {/* Animated fuel icon */}
              <div className="relative w-14 h-14 flex-shrink-0">
                <div className="absolute inset-0 rounded-2xl opacity-40"
                  style={{ background: 'linear-gradient(135deg,#f97316,#6366f1)', filter: 'blur(8px)' }} />
                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: 'rgba(15,23,42,.8)', border: '1px solid rgba(249,115,22,.3)' }}>
                  ⛽
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.2em] text-orange-400 mb-0.5">DOM-TOM</p>
                <h1 className="text-2xl font-black leading-tight">
                  Stations à<br />
                  <span style={{ background: 'linear-gradient(90deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    proximité
                  </span>
                </h1>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              Prix réglementés · SARA · SRPP · Arrêtés préfectoraux 2025
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-12 space-y-4">

          {/* ── Error ── */}
          {dataError && (
            <div className="flex items-center gap-3 rounded-2xl p-4 text-sm"
              style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5' }}>
              ⚠ {dataError}
            </div>
          )}

          {/* ── Localisation card ── */}
          <section
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: 'rgba(15,23,42,.7)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(148,163,184,.12)',
              boxShadow: '0 8px 32px rgba(0,0,0,.35)',
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">
              📍 Votre position
            </p>

            {/* Address zone */}
            <div className="min-h-[1.75rem]">
              {gpsStatus === 'idle' && (
                <p className="text-sm text-slate-500 italic">Localisation non activée</p>
              )}
              {gpsStatus === 'loading' && (
                <div className="flex items-center gap-2 text-sm text-orange-400">
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                  Acquisition GPS…
                </div>
              )}
              {gpsStatus === 'denied' && (
                <p className="text-sm" style={{ color: '#f87171' }}>
                  Accès GPS refusé — autorisez la géolocalisation dans votre navigateur.
                </p>
              )}
              {gpsStatus === 'error' && (
                <p className="text-sm" style={{ color: '#f87171' }}>
                  Position introuvable — vérifiez votre connexion.
                </p>
              )}
              {gpsStatus === 'found' && (
                <p className="text-sm text-slate-200 leading-snug">
                  {userAddress || (userPos ? `${userPos.lat.toFixed(5)}, ${userPos.lng.toFixed(5)}` : '—')}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleLocalize}
              disabled={gpsStatus === 'loading'}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-[.98] disabled:opacity-40"
              style={{
                background: gpsStatus === 'found'
                  ? 'linear-gradient(135deg,#059669,#10b981)'
                  : 'linear-gradient(135deg,#ea580c,#f97316)',
                boxShadow: gpsStatus === 'found'
                  ? '0 4px 20px rgba(16,185,129,.4)'
                  : '0 4px 20px rgba(249,115,22,.4)',
                color: '#fff',
              }}
            >
              {gpsStatus === 'loading' ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Localisation…
                </>
              ) : gpsStatus === 'found' ? (
                <>↺ Actualiser ma position</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
                  </svg>
                  Localisez-moi
                </>
              )}
            </button>
          </section>

          {/* ── Controls card ── */}
          <section
            className="rounded-2xl p-5 space-y-4"
            style={{
              background: 'rgba(15,23,42,.7)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(148,163,184,.12)',
            }}
          >
            {/* Radius row */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Rayon</span>
              <input
                ref={radiusRef}
                type="number" min={1} max={50}
                value={radiusInput}
                onChange={(e) => setRadiusInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyRadius()}
                className="w-16 text-center text-sm font-bold text-white rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-orange-500"
                style={{ background: 'rgba(30,41,59,.8)', border: '1px solid rgba(100,116,139,.4)' }}
              />
              <span className="text-xs text-slate-500">km</span>
              <div className="flex gap-1.5 ml-auto">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRadiusInput(String(r)); setRadius(r); }}
                    aria-pressed={radius === r}
                    className="px-2.5 py-1 rounded-full text-xs font-bold transition-all"
                    style={radius === r ? {
                      background: 'linear-gradient(135deg,#ea580c,#f97316)',
                      color: '#fff',
                      boxShadow: '0 2px 10px rgba(249,115,22,.45)',
                    } : {
                      background: 'rgba(30,41,59,.6)',
                      border: '1px solid rgba(100,116,139,.3)',
                      color: '#94a3b8',
                    }}
                  >
                    {r} km
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleApplyRadius}
                className="p-2 rounded-xl transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff' }}
                aria-label="Appliquer le rayon"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </button>
            </div>

            {/* Fuel type filter */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500 mb-2">Carburant</p>
              <div className="flex flex-wrap gap-2">
                {availableFuels.map((f) => {
                  const isActive = fuelFilter === f;
                  const d = f !== 'TOUS' ? FUEL_DESIGN[f] : null;
                  return d ? (
                    <FuelChip key={f} fuelType={f} active={isActive} onClick={() => setFuelFilter(f)} />
                  ) : (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFuelFilter('TOUS')}
                      aria-pressed={isActive}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={isActive ? {
                        background: 'linear-gradient(135deg,#475569,#64748b)',
                        color: '#fff',
                        border: '2px solid #94a3b8',
                        boxShadow: '0 0 12px rgba(148,163,184,.3)',
                      } : {
                        background: 'rgba(30,41,59,.6)',
                        color: '#94a3b8',
                        border: '2px solid rgba(100,116,139,.25)',
                      }}
                    >
                      Tous
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort toggle — only when GPS active */}
            {userPos && (
              <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'rgba(148,163,184,.08)' }}>
                <span className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Trier</span>
                <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(100,116,139,.25)' }}>
                  {(['distance', 'price'] as SortMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSortMode(mode)}
                      className="px-3 py-1.5 text-xs font-bold transition-all"
                      style={sortMode === mode ? {
                        background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                        color: '#fff',
                      } : {
                        background: 'transparent',
                        color: '#64748b',
                      }}
                    >
                      {mode === 'distance' ? '📍 Distance' : '�� Prix'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Map ── */}
          <section
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ border: '1px solid rgba(148,163,184,.1)' }}
          >
            {dataLoading ? (
              <div className="h-80 flex flex-col items-center justify-center gap-3"
                style={{ background: 'rgba(15,23,42,.8)' }}>
                <div className="w-10 h-10 rounded-full border-3 border-orange-500 border-t-transparent animate-spin" />
                <p className="text-sm text-slate-400">Chargement de la carte…</p>
              </div>
            ) : (
              <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: 360, width: '100%' }} scrollWheelZoom>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com">CARTO</a>'
                />
                <MapRecenter lat={mapCenter[0]} lng={mapCenter[1]} zoom={mapZoom} />

                {userPos && (
                  <>
                    <Marker position={[userPos.lat, userPos.lng]} icon={meIcon}>
                      <Popup>
                        <strong style={{ fontSize: '0.8rem' }}>📍 Votre position</strong>
                        {userAddress && <><br /><span style={{ fontSize: '0.7rem', color: '#64748b' }}>{userAddress}</span></>}
                      </Popup>
                    </Marker>
                    <Circle
                      center={[userPos.lat, userPos.lng]}
                      radius={radius * 1000}
                      pathOptions={{
                        color: '#f97316', fillColor: '#f97316',
                        fillOpacity: 0.05, weight: 1.5, dashArray: '5 5',
                      }}
                    />
                  </>
                )}

                {mapStations.map((st) => {
                  const activeFuels = st.fuels.filter(
                    (f) => fuelFilter === 'TOUS' || f.fuelType === fuelFilter,
                  );
                  const cheapest = activeFuels.length > 0
                    ? activeFuels.reduce((m, f) => f.pricePerLiter < m.pricePerLiter ? f : m)
                    : null;
                  const accent = brandAccent(st.brand);
                  const icon = makePulseMarker(
                    accent,
                    cheapest ? cheapest.pricePerLiter.toFixed(3) + '€' : '',
                    cheapest ? (FUEL_DESIGN[cheapest.fuelType]?.abbr ?? '') : '',
                  );
                  return (
                    <Marker key={st.id} position={[st.location.lat, st.location.lng]} icon={icon}>
                      <Popup minWidth={210}>
                        <div style={{ fontFamily: 'system-ui', padding: 2 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 3 }}>⛽ {st.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: st.distance !== undefined ? 3 : 6 }}>
                            {[st.address, st.city].filter(Boolean).join(', ')}
                          </div>
                          {st.distance !== undefined && (
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: accent, marginBottom: 6 }}>
                              📍 {formatDistance(st.distance)}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                            {activeFuels.map((f) => {
                              const d = FUEL_DESIGN[f.fuelType];
                              return d ? (
                                <div key={f.fuelType} style={{
                                  background: `linear-gradient(135deg,${d.from},${d.to})`,
                                  color: d.text, borderRadius: 8,
                                  padding: '4px 8px', fontSize: '0.7rem', fontWeight: 800,
                                }}>
                                  {d.abbr} {f.pricePerLiter.toFixed(3)}€
                                </div>
                              ) : null;
                            })}
                          </div>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${st.location.lat},${st.location.lng}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'block',
                              background: `linear-gradient(135deg,${accent},${accent}bb)`,
                              color: '#fff', borderRadius: 10,
                              padding: '6px 12px', textAlign: 'center',
                              fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none',
                            }}
                          >
                            ↗ Itinéraire GPS
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}
          </section>

          {/* ── Fuel legend ── */}
          <div className="flex flex-wrap gap-2 px-1">
            {FUEL_ORDER.filter((f) => FUEL_DESIGN[f]).map((f) => (
              <FuelChip key={f} fuelType={f} />
            ))}
          </div>

          {/* ── Idle state CTA ── */}
          {!userPos && gpsStatus === 'idle' && (
            <div className="text-center py-10 space-y-3">
              <div className="text-5xl">📡</div>
              <p className="text-base font-bold text-white">
                Activez votre GPS pour voir<br />les stations autour de vous
              </p>
              <p className="text-sm text-slate-500">
                La carte affiche toutes les stations DOM-TOM disponibles.
              </p>
            </div>
          )}

          {/* ── Results list ── */}
          {userPos && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-bold text-white">
                  {nearbyStations.length > 0
                    ? `${nearbyStations.length} station${nearbyStations.length > 1 ? 's' : ''} · ${radius} km`
                    : 'Aucune station dans ce rayon'}
                </p>
                {nearbyStations.length === 0 && (
                  <button
                    type="button"
                    onClick={() => { setRadius(20); setRadiusInput('20'); }}
                    className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                  >
                    ↻ Élargir à 20 km
                  </button>
                )}
              </div>

              {nearbyStations.length === 0 && (
                <div
                  className="rounded-2xl p-5 text-center space-y-1"
                  style={{ background: 'rgba(15,23,42,.6)', border: '1px solid rgba(148,163,184,.08)' }}
                >
                  <p className="text-slate-400 text-sm">Aucune station répertoriée dans ce rayon.</p>
                  <p className="text-xs text-slate-600">
                    En DOM-TOM les prix étant réglementés, toutes les stations affichent les mêmes tarifs.
                  </p>
                </div>
              )}

              {nearbyStations.map((st) => (
                <StationCard
                  key={st.id}
                  station={st}
                  fuelFilter={fuelFilter}
                  isCheapest={st.id === cheapestId}
                />
              ))}
            </section>
          )}

          {/* ── Footer ── */}
          <div className="text-center pt-4 border-t space-y-1" style={{ borderColor: 'rgba(148,163,184,.08)' }}>
            <p className="text-xs text-slate-600">
              Prix réglementés 2025 · SARA (Antilles/Guyane) · SRPP (La Réunion) · Mayotte
            </p>
            <Link to="/comparateur-carburants" className="text-xs text-orange-400 hover:underline">
              Comparateur complet →
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
