import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  BarChart3, FileText, MapPin, AlertCircle, Droplet, Navigation,
  TrendingDown, LocateFixed, Globe, ArrowLeftRight, ChevronRight, BookOpen, GraduationCap,
} from 'lucide-react';
import type {
  FuelPricePoint,
  FuelType,
  FuelComparisonResult,
} from '../types/fuelComparison';
import type { Territory } from '../types/priceAlerts';
import {
  compareFuelPricesByTerritory,
  loadFuelData,
  fetchLiveFuelPrices,
} from '../services/fuelComparisonService';
import type { LiveFuelPricesResult } from '../services/fuelComparisonService';
import PriceChart from '../components/comparateur/LazyPriceChart';
import ComparisonSummary from '../components/comparateur/ComparisonSummary';
import LoadingSkeleton from '../components/comparateur/LoadingSkeleton';
import SortControl from '../components/comparateur/SortControl';
import ShareButton from '../components/comparateur/ShareButton';
import { exportFuelComparisonToText } from '../utils/exportComparison';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import BookingLinkBadge from '../components/comparateur/BookingLinkBadge';

const TERRITORIES: { code: Territory; name: string; dept: string; flag: string }[] = [
  { code: 'GP', name: 'Guadeloupe',               dept: '971', flag: '\uD83C\uDDEC\uD83C\uDDF5' },
  { code: 'MQ', name: 'Martinique',               dept: '972', flag: '\uD83C\uDDF2\uD83C\uDDF6' },
  { code: 'GF', name: 'Guyane',                   dept: '973', flag: '\uD83C\uDDEC\uD83C\uDDEB' },
  { code: 'RE', name: 'La R\u00e9union',          dept: '974', flag: '\uD83C\uDDF7\uD83C\uDDEA' },
  { code: 'PM', name: 'Saint-Pierre-et-Miquelon', dept: '975', flag: '\uD83C\uDDF5\uD83C\uDDF2' },
  { code: 'YT', name: 'Mayotte',                  dept: '976', flag: '\uD83C\uDDFE\uD83C\uDDF9' },
  { code: 'BL', name: 'Saint-Barth\u00e9lemy',   dept: '977', flag: '\uD83C\uDDE7\uD83C\uDDF1' },
  { code: 'MF', name: 'Saint-Martin',             dept: '978', flag: '\uD83C\uDDF2\uD83C\uDDEB' },
];

const FUEL_TYPES: { code: FuelType; label: string }[] = [
  { code: 'SP95',   label: 'SP 95'  },
  { code: 'SP98',   label: 'SP 98'  },
  { code: 'E10',    label: 'E10'    },
  { code: 'E85',    label: 'E85'    },
  { code: 'DIESEL', label: 'Diesel' },
  { code: 'GPL',    label: 'GPL'    },
];

type ViewMode = 'single' | 'compare';

const FuelComparator: React.FC = () => {
  const [viewMode, setViewMode]                   = useState<ViewMode>('single');
  const [loading, setLoading]                     = useState(true);
  const [liveLoading, setLiveLoading]             = useState(false);
  const [error, setError]                         = useState<string | null>(null);
  const [fuelPrices, setFuelPrices]               = useState<FuelPricePoint[]>([]);
  const [liveSource, setLiveSource]               = useState(false);
  const [liveFetchedAt, setLiveFetchedAt]         = useState<string | null>(null);
  const [comparisonResult, setComparisonResult]   = useState<FuelComparisonResult | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory>('GP');
  const [selectedFuelType, setSelectedFuelType]   = useState<FuelType>('SP95');
  const [sortBy, setSortBy]                       = useState<'price' | 'station' | 'city'>('price');
  const [sortDirection, setSortDirection]         = useState<'asc' | 'desc'>('asc');
  const [filterCity, setFilterCity]               = useState('');
  const [gpsStatus, setGpsStatus]                 = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [userLocation, setUserLocation]           = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadFuelData()
      .then(({ fuelPrices: data }) => {
        setFuelPrices(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Erreur lors du chargement des donn\u00e9es carburant');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (viewMode !== 'single') return;
    setLiveLoading(true);
    setLiveSource(false);
    fetchLiveFuelPrices(selectedTerritory)
      .then(({ prices: livePrices, fetchedAt }: LiveFuelPricesResult) => {
        if (livePrices.length > 0) {
          setFuelPrices((prev) => {
            const other = prev.filter((p) => p.territory !== selectedTerritory);
            return [...other, ...livePrices];
          });
          setLiveSource(true);
          setLiveFetchedAt(fetchedAt);
        }
      })
      .finally(() => setLiveLoading(false));
  }, [selectedTerritory, viewMode]);

  const filteredPrices = useMemo(() => {
    if (!filterCity) return fuelPrices;
    return fuelPrices.filter((p) =>
      p.station.city.toLowerCase().includes(filterCity.toLowerCase()),
    );
  }, [filterCity, fuelPrices]);

  useEffect(() => {
    if (!filteredPrices.length) return;
    const result = compareFuelPricesByTerritory(selectedTerritory, selectedFuelType, filteredPrices);
    setComparisonResult(result);
  }, [filteredPrices, selectedTerritory, selectedFuelType]);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) { setGpsStatus('error'); return; }
    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus('found');
      },
      () => setGpsStatus('error'),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  const nearestStation = useMemo(() => {
    if (!userLocation || !comparisonResult) return null;
    let nearest = null;
    let minDist = Infinity;
    for (const item of comparisonResult.rankedPrices) {
      const loc = item.fuelPrice.station.location;
      if (!loc) continue;
      const d = Math.sqrt(
        Math.pow(loc.lat - userLocation.lat, 2) + Math.pow(loc.lng - userLocation.lng, 2),
      );
      if (d < minDist) { minDist = d; nearest = item; }
    }
    return nearest;
  }, [userLocation, comparisonResult]);

  const territoryStats = useMemo(() => {
    if (viewMode !== 'compare') return [];
    return TERRITORIES.map((t) => {
      const prices = fuelPrices.filter(
        (p) => p.territory === t.code && p.fuelType === selectedFuelType,
      );
      if (!prices.length) return { ...t, min: null as number | null, avg: null as number | null, count: 0 };
      const vals = prices.map((p) => p.pricePerLiter);
      return {
        ...t,
        min: Math.min(...vals),
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
        count: prices.length,
      };
    }).sort((a, b) => {
      if (a.min === null) return 1;
      if (b.min === null) return -1;
      return a.min - b.min;
    });
  }, [fuelPrices, selectedFuelType, viewMode]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'EUR',
      minimumFractionDigits: 3, maximumFractionDigits: 3,
    }).format(price);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatDateTime = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cheapest':       return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'below_average':  return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'average':        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      case 'above_average':  return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'most_expensive': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:               return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'cheapest':       return 'Le moins cher';
      case 'below_average':  return 'Sous la moyenne';
      case 'average':        return 'Dans la moyenne';
      case 'above_average':  return 'Au-dessus de la moyenne';
      case 'most_expensive': return 'Le plus cher';
      default: return '\u2014';
    }
  };

  const getStationNavUrl = (name: string, city: string, lat?: number, lng?: number) => {
    if (lat && lng) {
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        return `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
      }
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + city)}`;
  };

  const chartData = useMemo(() => {
    if (!comparisonResult) return { labels: [], datasets: [] };
    return {
      labels: comparisonResult.rankedPrices.map((p) => p.fuelPrice.station.name),
      datasets: [{
        label: 'Prix \u20ac/L',
        data: comparisonResult.rankedPrices.map((p) => p.fuelPrice.pricePerLiter),
        backgroundColor: 'rgba(59,130,246,0.6)',
      }],
    };
  }, [comparisonResult]);

  const sortedPrices = useMemo(() => {
    if (!comparisonResult) return [];
    const list = [...comparisonResult.rankedPrices];
    list.sort((a, b) => {
      if (sortBy === 'price')   return a.fuelPrice.pricePerLiter - b.fuelPrice.pricePerLiter;
      if (sortBy === 'station') return a.fuelPrice.station.name.localeCompare(b.fuelPrice.station.name);
      return a.fuelPrice.station.city.localeCompare(b.fuelPrice.station.city);
    });
    return sortDirection === 'asc' ? list : list.reverse();
  }, [comparisonResult, sortBy, sortDirection]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>Comparateur Carburants DOM-TOM &mdash; A KI PRI SA Y&Eacute;</title>
        <meta name="description" content="Prix des carburants en direct dans tous les territoires et d\u00e9partements d'outre-mer : SP95, SP98, E10, Diesel, GPL. Donn\u00e9es officielles prix-carburants.gouv.fr." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 pb-12 pt-6">
        <div className="mb-6">
          <HeroImage
            src={PAGE_HERO_IMAGES.comparateurCarburants}
            alt="Comparateur carburants DOM-TOM \u2014 station service"
            gradient="from-yellow-900 to-slate-900"
            height="h-36 sm:h-48"
          >
            <div className="flex items-center gap-3 mb-2">
              <Droplet className="w-7 h-7 text-yellow-300 drop-shadow" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">&#9981; Comparateur Carburants</h1>
            </div>
            <p className="text-yellow-100 text-sm drop-shadow">
              Prix en direct dans tous les territoires d&apos;outre-mer &mdash; donn&eacute;es officielles prix-carburants.gouv.fr
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300">
                🔄 {liveFetchedAt
                  ? `Mis à jour le ${formatDateTime(liveFetchedAt)}`
                  : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {liveSource && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full text-xs text-blue-300">
                  <Globe className="w-3 h-3" /> Donn&eacute;es en direct
                </span>
              )}
            </div>
          </HeroImage>
        </div>

        {/* View mode */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setViewMode('single')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${viewMode === 'single' ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300' : 'bg-slate-800 border border-slate-700 text-gray-400 hover:bg-slate-700'}`}
          >
            <MapPin className="w-4 h-4" /> Par territoire
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${viewMode === 'compare' ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300' : 'bg-slate-800 border border-slate-700 text-gray-400 hover:bg-slate-700'}`}
          >
            <ArrowLeftRight className="w-4 h-4" /> Comparer tous les territoires
          </button>
          <Link
            to="/enquete-carburants"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-orange-500/10 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20 transition-colors"
          >
            <BookOpen className="w-4 h-4" /> Enquête
          </Link>
          <Link
            to="/conference-carburants"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors sm:ml-auto"
          >
            <GraduationCap className="w-4 h-4" /> Conférence expert
          </Link>
        </div>

        {/* ── SINGLE TERRITORY VIEW ── */}
        {viewMode === 'single' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="fc-territoire" className="block text-sm text-gray-400 mb-1">Territoire</label>
                <select
                  id="fc-territoire"
                  name="territoire"
                  value={selectedTerritory}
                  onChange={(e) => { setSelectedTerritory(e.target.value as Territory); setFilterCity(''); }}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                >
                  {TERRITORIES.map((t) => (
                    <option key={t.code} value={t.code}>{t.flag} {t.name} (dept. {t.dept})</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="fc-carburant" className="block text-sm text-gray-400 mb-1">Type de carburant</label>
                <select
                  id="fc-carburant"
                  name="carburant"
                  value={selectedFuelType}
                  onChange={(e) => setSelectedFuelType(e.target.value as FuelType)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                >
                  {FUEL_TYPES.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="fc-ville" className="block text-sm text-gray-400 mb-1">Filtrer par ville</label>
                <input
                  id="fc-ville"
                  name="ville"
                  type="text"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  placeholder="Nom de la ville..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {/* GPS */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button
                onClick={handleGeolocate}
                disabled={gpsStatus === 'loading'}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600/80 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <LocateFixed className="w-4 h-4" />
                {gpsStatus === 'loading' ? 'Localisation...' : 'Me localiser (GPS)'}
              </button>
              {gpsStatus === 'found' && nearestStation && (
                <a
                  href={getStationNavUrl(
                    nearestStation.fuelPrice.station.name,
                    nearestStation.fuelPrice.station.city,
                    nearestStation.fuelPrice.station.location?.lat,
                    nearestStation.fuelPrice.station.location?.lng,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Station proche&nbsp;: {nearestStation.fuelPrice.station.name} &middot; {formatPrice(nearestStation.fuelPrice.pricePerLiter)}/L
                </a>
              )}
              {gpsStatus === 'error' && (
                <span className="text-xs text-red-400">G&eacute;olocalisation non disponible.</span>
              )}
              {liveLoading && (
                <span className="text-xs text-blue-400 flex items-center gap-1">
                  <Globe className="w-3 h-3 animate-spin" /> R&eacute;cup&eacute;ration des prix en direct&hellip;
                </span>
              )}
            </div>

            {loading && <LoadingSkeleton />}
            {error && (
              <div className="flex items-center gap-2 text-red-400 py-10 justify-center">
                <AlertCircle className="w-5 h-5" /><span>{error}</span>
              </div>
            )}
            {!loading && !error && !comparisonResult && (
              <div className="text-center text-gray-400 py-10">
                Aucune donn&eacute;e pour ce territoire / type de carburant.
              </div>
            )}

            {comparisonResult && (
              <>
                <ComparisonSummary
                  bestPrice={comparisonResult.aggregation.minPrice}
                  worstPrice={comparisonResult.aggregation.maxPrice}
                  averagePrice={comparisonResult.aggregation.averagePrice}
                  savingsPercentage={comparisonResult.aggregation.priceRangePercentage}
                  bestProvider={comparisonResult.rankedPrices[0]?.fuelPrice.station.name ?? '\u2014'}
                  totalObservations={comparisonResult.aggregation.totalStations}
                  currency="EUR"
                />

                {comparisonResult.rankedPrices.length > 0 && (() => {
                  const cheapest = comparisonResult.rankedPrices[0];
                  const lat = cheapest.fuelPrice.station.location?.lat;
                  const lng = cheapest.fuelPrice.station.location?.lng;
                  const navUrl = getStationNavUrl(cheapest.fuelPrice.station.name, cheapest.fuelPrice.station.city, lat, lng);
                  return (
                    <a
                      href={navUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block my-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4 hover:bg-green-500/20 transition-colors group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-semibold text-green-300">Station la moins ch&egrave;re</span>
                          </div>
                          <p className="text-white font-bold text-lg">{cheapest.fuelPrice.station.name}</p>
                          <p className="text-xs text-gray-400">{cheapest.fuelPrice.station.city} &middot; {cheapest.fuelPrice.station.brand}</p>
                          {cheapest.fuelPrice.station.address && (
                            <p className="text-xs text-gray-500 mt-0.5">{cheapest.fuelPrice.station.address}</p>
                          )}
                        </div>
                        <div className="flex flex-col sm:items-end gap-2">
                          <p className="text-3xl font-bold text-green-400">
                            {formatPrice(cheapest.fuelPrice.pricePerLiter)}
                            <span className="text-sm font-normal text-gray-400">/L</span>
                          </p>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 group-hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors">
                            <Navigation className="w-3 h-3" /> Itin&eacute;raire GPS
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                })()}

                <div className="flex flex-wrap items-center justify-between gap-3 my-4">
                  <SortControl
                    options={[{ value: 'price', label: 'Prix' }, { value: 'station', label: 'Station' }, { value: 'city', label: 'Ville' }]}
                    currentSort={sortBy}
                    currentDirection={sortDirection}
                    onSortChange={(sort, dir) => { setSortBy(sort as 'price' | 'station' | 'city'); setSortDirection(dir); }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportFuelComparisonToText(comparisonResult)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                    >
                      <FileText className="w-4 h-4" />Texte
                    </button>
                    <ShareButton title="Comparateur Carburants" description="Comparez les prix des carburants dans votre territoire" />
                  </div>
                </div>

                <div className="bg-slate-900 rounded-xl p-4 my-4">
                  <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />Prix par station (&euro;/L)
                  </h2>
                  <PriceChart data={chartData} type="bar" />
                </div>

                {/* Station tiles — each row is fully clickable */}
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800 text-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left">Station</th>
                        <th className="px-4 py-3 text-left hidden sm:table-cell">Ville</th>
                        <th className="px-4 py-3 text-right">Prix / L</th>
                        <th className="px-4 py-3 text-center hidden sm:table-cell">Positionnement</th>
                        <th className="px-4 py-3 text-center">GPS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPrices.map((item) => {
                        const lat = item.fuelPrice.station.location?.lat;
                        const lng = item.fuelPrice.station.location?.lng;
                        const navUrl = getStationNavUrl(item.fuelPrice.station.name, item.fuelPrice.station.city, lat, lng);
                        return (
                          <tr
                            key={item.fuelPrice.station.id + item.fuelPrice.fuelType}
                            className="border-t border-slate-800 hover:bg-slate-800/60 cursor-pointer group"
                            onClick={() => window.open(navUrl, '_blank', 'noopener,noreferrer')}
                            title={`Naviguer vers ${item.fuelPrice.station.name}`}
                          >
                            <td className="px-4 py-3">
                              <span className="text-white font-medium group-hover:text-yellow-300 transition-colors">
                                {item.fuelPrice.station.name}
                              </span>
                              <span className="block text-xs text-gray-500 sm:hidden">{item.fuelPrice.station.city}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{item.fuelPrice.station.city}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatPrice(item.fuelPrice.pricePerLiter)}</td>
                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                              <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(item.priceCategory)}`}>
                                {getCategoryLabel(item.priceCategory)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <a
                                href={navUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-sky-600/80 hover:bg-sky-500 text-white text-xs rounded-lg transition-colors"
                                title="Naviguer GPS"
                              >
                                <Navigation className="w-3 h-3" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Source&nbsp;: {liveSource
                    ? 'data.economie.gouv.fr (donn\u00e9es en direct)'
                    : (comparisonResult.metadata?.dataSource || 'Observatoire A KI PRI SA Y\u00c9')}
                  {' \u00b7 '}Comparaison du {formatDate(new Date(comparisonResult.comparisonDate))}
                </div>
                <div className="mt-2"><BookingLinkBadge /></div>

                {/* Investigation CTA */}
                <Link
                  to="/enquete-carburants"
                  className="mt-4 flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl hover:bg-orange-500/20 transition-colors group"
                >
                  <BookOpen className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-orange-300">Enquête complète : d&apos;où vient le prix ?</p>
                    <p className="text-xs text-gray-400 mt-0.5">Taxes, marges, prix plafonn&eacute;s, comparatif international&hellip;</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {/* Conference CTA */}
                <Link
                  to="/conference-carburants"
                  className="mt-3 flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition-colors group"
                >
                  <GraduationCap className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-300">Conf&eacute;rence expert — Anatomie du prix</p>
                    <p className="text-xs text-gray-400 mt-0.5">9 diapositives · Brent, SARA, fiscalit&eacute;, plafonnement, comparaison mondiale&hellip;</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
          </>
        )}

        {/* ── COMPARE ALL TERRITORIES VIEW ── */}
        {viewMode === 'compare' && (
          <>
            <div className="flex flex-wrap items-end gap-4 mb-6">
              <div>
                <label htmlFor="fc-carburant-compare" className="block text-sm text-gray-400 mb-1">Type de carburant</label>
                <select
                  id="fc-carburant-compare"
                  name="carburant-compare"
                  value={selectedFuelType}
                  onChange={(e) => setSelectedFuelType(e.target.value as FuelType)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                >
                  {FUEL_TYPES.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}
                </select>
              </div>
              <p className="text-xs text-gray-500">
                Cliquez sur un territoire pour voir le d&eacute;tail et naviguer GPS vers les stations.
              </p>
            </div>

            {loading && <LoadingSkeleton />}

            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {territoryStats.map((t) => (
                  <button
                    key={t.code}
                    onClick={() => { setSelectedTerritory(t.code as Territory); setViewMode('single'); }}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:border-yellow-500/50 hover:bg-slate-800/80 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{t.flag}</span>
                      <span className="text-xs text-gray-500 font-mono">{t.dept}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors mb-1">
                      {t.name}
                    </h3>
                    {t.min !== null ? (
                      <>
                        <p className="text-xl font-bold text-green-400">
                          {formatPrice(t.min)}
                          <span className="text-xs font-normal text-gray-500">/L min</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          moy.&nbsp;{t.avg !== null ? formatPrice(t.avg) : '\u2014'} &middot; {t.count} station{t.count > 1 ? 's' : ''}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-600 italic mt-1">Donn&eacute;es en attente&hellip;</p>
                    )}
                    <div className="mt-3 flex items-center gap-1 text-xs text-sky-400 group-hover:text-sky-300 transition-colors">
                      <MapPin className="w-3 h-3" /> Voir les stations
                      <ChevronRight className="w-3 h-3 ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            <p className="mt-6 text-xs text-gray-600">
              Source&nbsp;: prix-carburants.gouv.fr + contributions citoyennes &mdash;{' '}
              {liveFetchedAt
                ? <>donn&eacute;es du {formatDateTime(liveFetchedAt)}.</>
                : <>donn&eacute;es du {new Date().toLocaleDateString('fr-FR')}.</>}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default FuelComparator;
