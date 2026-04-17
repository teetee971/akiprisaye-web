import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Car,
  AlertCircle,
  Download,
  FileText,
  MapPin,
  BarChart3,
  Info,
  ExternalLink,
  Award,
  TrendingDown,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type {
  CarRentalPricePoint,
  CarRentalComparisonResult,
  CarCategory,
} from '../types/carRental';
import type { Territory } from '../types/priceAlerts';
import {
  compareCarRentals,
  filterCarRentals,
  CAR_CATEGORY_LABELS,
} from '../services/carRentalService';
import PriceChart from '../components/comparateur/LazyPriceChart';
import ComparisonSummary from '../components/comparateur/ComparisonSummary';
import LoadingSkeleton from '../components/comparateur/LoadingSkeleton';
import ShareButton from '../components/comparateur/ShareButton';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { buildBookingUrl } from '../utils/bookingLinks';
import BookingLinkBadge from '../components/comparateur/BookingLinkBadge';

const TERRITORIES: { code: Territory; name: string }[] = [
  { code: 'GP', name: 'Guadeloupe' },
  { code: 'MQ', name: 'Martinique' },
  { code: 'GF', name: 'Guyane' },
  { code: 'RE', name: 'La Réunion' },
  { code: 'YT', name: 'Mayotte' },
];

const CATEGORIES: CarCategory[] = [
  'economy',
  'compact',
  'intermediate',
  'standard',
  'suv',
  'minivan',
];

const AGENCY_BOOKING_URLS: Record<string, string> = {
  Hertz: 'https://www.hertz.fr/',
  Avis: 'https://www.avis.fr/',
  Europcar: 'https://www.europcar.fr/',
  Budget: 'https://www.budget.fr/',
  Sixt: 'https://www.sixt.fr/',
  Enterprise: 'https://www.enterprise.fr/',
  Ada: 'https://www.ada.fr/',
  Alamo: 'https://www.alamo.fr/',
  'Jumbo Car': 'https://www.jumbocar.com/',
};

function getAgencyBookingUrl(agencyName: string, bookingUrl?: string): string {
  const base =
    bookingUrl ||
    (() => {
      for (const [key, url] of Object.entries(AGENCY_BOOKING_URLS)) {
        if (agencyName.toLowerCase().includes(key.toLowerCase())) return url;
      }
      return '#';
    })();
  return buildBookingUrl(base, 'comparateur-voiture');
}

const CarRentalComparator: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPrices, setAllPrices] = useState<CarRentalPricePoint[]>([]);
  const [comparisonResult, setComparisonResult] = useState<CarRentalComparisonResult | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory>('GP');
  const [selectedCategory, setSelectedCategory] = useState<CarCategory>('economy');
  const [localOnly, setLocalOnly] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/car-rental-prices.json`)
      .then((r) => {
        if (!r.ok) throw new Error('Données non disponibles');
        return r.json();
      })
      .then((data) => {
        setAllPrices(data.carRentalPrices || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de charger les données de location');
        setLoading(false);
      });
  }, []);

  const filteredPrices = useMemo(() => {
    if (!allPrices.length) return [];
    return filterCarRentals(allPrices, {
      territory: selectedTerritory,
      category: selectedCategory,
      ...(localOnly ? { localAgencyOnly: true } : {}),
    });
  }, [allPrices, selectedTerritory, selectedCategory, localOnly]);

  useEffect(() => {
    if (!filteredPrices.length) {
      setComparisonResult(null);
      return;
    }
    const result = compareCarRentals(selectedTerritory, selectedCategory, filteredPrices);
    setComparisonResult(result);
  }, [filteredPrices, selectedTerritory, selectedCategory]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'cheapest':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'below_average':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'average':
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      case 'above_average':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'most_expensive':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'cheapest':
        return 'Le moins cher';
      case 'below_average':
        return 'Sous la moyenne';
      case 'average':
        return 'Dans la moyenne';
      case 'above_average':
        return 'Au-dessus de la moyenne';
      case 'most_expensive':
        return 'Le plus cher';
      default:
        return '—';
    }
  };

  const chartData = useMemo(() => {
    if (!comparisonResult) return { labels: [], datasets: [] };
    const sorted = [...comparisonResult.agencies].sort(
      (a, b) => a.rentalPrice.pricing.dailyRate - b.rentalPrice.pricing.dailyRate
    );
    return {
      labels: sorted.map((a) => a.rentalPrice.agency),
      datasets: [
        {
          label: 'Prix/jour (€)',
          data: sorted.map((a) => a.rentalPrice.pricing.dailyRate),
          backgroundColor: 'rgba(16,185,129,0.6)',
        },
      ],
    };
  }, [comparisonResult]);

  const sortedAgencies = useMemo(() => {
    if (!comparisonResult) return [];
    return [...comparisonResult.agencies].sort((a, b) =>
      sortDirection === 'asc'
        ? a.rentalPrice.pricing.dailyRate - b.rentalPrice.pricing.dailyRate
        : b.rentalPrice.pricing.dailyRate - a.rentalPrice.pricing.dailyRate
    );
  }, [comparisonResult, sortDirection]);

  const exportCSV = () => {
    if (!comparisonResult) return;
    const rows = [
      [
        'Agence',
        'Catégorie',
        'Prix/jour',
        'Dépôt',
        'Km illimités',
        'Agence locale',
        'Date observation',
      ],
      ...sortedAgencies.map((a) => [
        a.rentalPrice.agency,
        CAR_CATEGORY_LABELS[a.rentalPrice.category],
        a.rentalPrice.pricing.dailyRate,
        a.rentalPrice.pricing.deposit,
        a.rentalPrice.inclusions.unlimitedMileage ? 'Oui' : 'Non',
        a.rentalPrice.isLocalAgency ? 'Oui' : 'Non',
        formatDate(a.rentalPrice.observationDate),
      ]),
    ];
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location-voiture-${selectedTerritory}-${selectedCategory}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>Comparateur Location Voiture DOM-TOM — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Comparez les prix de location de voiture dans les DOM-TOM : agences internationales et locales. Données observatoire citoyens."
        />
        <link
          rel="canonical"
          href="https://teetee971.github.io/akiprisaye-web/comparateur-location-voiture"
        />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/comparateur-location-voiture"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/comparateur-location-voiture"
        />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 pb-12 pt-6">
        {/* Hero Banner */}
        <div className="mb-6">
          <HeroImage
            src={PAGE_HERO_IMAGES.comparateurLocationVoiture}
            alt="Comparateur location voiture DOM-TOM — agences locales et internationales"
            gradient="from-emerald-900 to-slate-900"
            height="h-36 sm:h-48"
          >
            <div className="flex items-center gap-3 mb-2">
              <Car className="w-7 h-7 text-emerald-300 drop-shadow" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">
                🚗 Comparateur Location Voiture
              </h1>
            </div>
            <p className="text-emerald-100 text-sm drop-shadow">
              Agences internationales &amp; locales · Données observatoire citoyens
            </p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300 mt-2">
              🔄 Données du{' '}
              {new Date().toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </HeroImage>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 text-sm text-blue-300">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Observer, pas vendre.</strong> Ces prix sont indicatifs et basés sur des relevés
            citoyens et les tarifs publiés par les agences. Vérifiez toujours le prix final sur le
            site de l'agence. Aucun lien d'affiliation.
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="voiture-territoire" className="block text-sm text-gray-400 mb-1">
              Territoire
            </label>
            <select
              id="voiture-territoire"
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value as Territory)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
            >
              {TERRITORIES.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="voiture-categorie" className="block text-sm text-gray-400 mb-1">
              Catégorie de véhicule
            </label>
            <select
              id="voiture-categorie"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CarCategory)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CAR_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
              <input
                type="checkbox"
                checked={localOnly}
                onChange={(e) => setLocalOnly(e.target.checked)}
                className="w-4 h-4 accent-emerald-500"
              />
              Agences locales uniquement
            </label>
          </div>
        </div>

        {loading && <LoadingSkeleton />}
        {error && (
          <div className="flex items-center gap-2 text-red-400 py-10 justify-center">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        {!loading && !error && !comparisonResult && (
          <div className="text-center text-gray-400 py-10">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <p>Aucune donnée disponible pour ce territoire et cette catégorie.</p>
          </div>
        )}

        {comparisonResult && (
          <>
            <ComparisonSummary
              bestPrice={comparisonResult.aggregation.pricing.minDailyRate}
              worstPrice={comparisonResult.aggregation.pricing.maxDailyRate}
              averagePrice={comparisonResult.aggregation.pricing.averageDailyRate}
              savingsPercentage={comparisonResult.aggregation.pricing.priceRangePercentage}
              bestProvider={sortedAgencies[0]?.rentalPrice.agency ?? '—'}
              totalObservations={comparisonResult.aggregation.totalObservations}
              currency="EUR"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 my-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{comparisonResult.aggregation.agencyCount} agences comparées</span>
                {comparisonResult.aggregation.localAgencyCount > 0 && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    dont {comparisonResult.aggregation.localAgencyCount} locale(s)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                >
                  Trier {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <ShareButton
                  title="Comparateur Location Voiture"
                  description="Comparez les prix de location de voiture dans les territoires ultramarins"
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 my-4">
              <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Prix/jour par agence (€)
              </h2>
              <PriceChart data={chartData} type="bar" />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Agence</th>
                    <th className="px-4 py-3 text-left">Véhicule exemple</th>
                    <th className="px-4 py-3 text-right">Prix/jour</th>
                    <th className="px-4 py-3 text-right">Dépôt</th>
                    <th className="px-4 py-3 text-center">Km</th>
                    <th className="px-4 py-3 text-center">Type</th>
                    <th className="px-4 py-3 text-center">Position</th>
                    <th className="px-4 py-3 text-center">Réserver</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAgencies.map((item) => (
                    <tr
                      key={item.rentalPrice.id}
                      className="border-t border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3 text-white font-medium">
                        {item.rentalPrice.agency}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {item.rentalPrice.vehicleExample}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white">
                        {formatPrice(item.rentalPrice.pricing.dailyRate)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {formatPrice(item.rentalPrice.pricing.deposit)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {item.rentalPrice.inclusions.unlimitedMileage ? (
                          <span className="text-green-400">Illimités</span>
                        ) : (
                          <span className="text-orange-400">Limités</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.rentalPrice.isLocalAgency ? (
                          <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                            Locale
                          </span>
                        ) : (
                          <span className="text-xs bg-slate-700 text-gray-400 px-2 py-0.5 rounded-full">
                            Inter.
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(item.priceCategory)}`}
                        >
                          {getCategoryLabel(item.priceCategory)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={getAgencyBookingUrl(
                            item.rentalPrice.agency,
                            (item.rentalPrice as any).bookingUrl
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Réserver
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Source : {comparisonResult.metadata.disclaimer}
              {' · '}Dernière observation :{' '}
              {formatDate(comparisonResult.aggregation.observationPeriod.to)}
            </div>

            {/* Profile Recommendation */}
            <div className="mt-6 bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h2 className="text-base font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Quelle agence choisir ?
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Meilleur prix/jour */}
                {(() => {
                  if (!sortedAgencies.length) return null;
                  const best = sortedAgencies[0];
                  return (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-300">
                          Meilleur prix/jour
                        </span>
                      </div>
                      <p className="text-white font-bold text-lg">{best.rentalPrice.agency}</p>
                      <p className="text-2xl font-bold text-green-400">
                        {formatPrice(best.rentalPrice.pricing.dailyRate)}
                        <span className="text-sm font-normal text-gray-400">/jour</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {best.rentalPrice.vehicleExample}
                      </p>
                      <a
                        href={getAgencyBookingUrl(
                          best.rentalPrice.agency,
                          (best.rentalPrice as any).bookingUrl
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Réserver
                      </a>
                    </div>
                  );
                })()}
                {/* Meilleure couverture */}
                {(() => {
                  const withCDW = sortedAgencies.filter(
                    (a) => a.rentalPrice.inclusions.cdwIncluded
                  );
                  if (!withCDW.length) return null;
                  const best = withCDW[0];
                  return (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-semibold text-blue-300">
                          Meilleure couverture
                        </span>
                      </div>
                      <p className="text-white font-bold text-lg">{best.rentalPrice.agency}</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {formatPrice(best.rentalPrice.pricing.dailyRate)}
                        <span className="text-sm font-normal text-gray-400">/jour</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        CDW inclus ·{' '}
                        {best.rentalPrice.inclusions.unlimitedMileage
                          ? 'Km illimités'
                          : 'Km limités'}
                      </p>
                      <a
                        href={getAgencyBookingUrl(
                          best.rentalPrice.agency,
                          (best.rentalPrice as any).bookingUrl
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Réserver
                      </a>
                    </div>
                  );
                })()}
                {/* Agence locale recommandée */}
                {(() => {
                  const local = sortedAgencies.filter((a) => a.rentalPrice.isLocalAgency);
                  if (!local.length) return null;
                  const best = local[0];
                  return (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-300">
                          Agence locale
                        </span>
                      </div>
                      <p className="text-white font-bold text-lg">{best.rentalPrice.agency}</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {formatPrice(best.rentalPrice.pricing.dailyRate)}
                        <span className="text-sm font-normal text-gray-400">/jour</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Agence locale · connaissance du terrain
                      </p>
                      <a
                        href={getAgencyBookingUrl(
                          best.rentalPrice.agency,
                          (best.rentalPrice as any).bookingUrl
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Réserver
                      </a>
                    </div>
                  );
                })()}
              </div>
              <div className="mt-3">
                <BookingLinkBadge />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CarRentalComparator;
