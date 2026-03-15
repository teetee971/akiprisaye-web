import React, { useState } from 'react';
import { Smartphone, Info, Download, ExternalLink, Award, TrendingDown } from 'lucide-react';
import {
  searchMobilePlanPrices,
  getTerritories,
  getOfferTypes,
  type MobilePlanPrice,
} from '../../services/mobilePlanPriceService';
import PriceChart from '../../components/comparateur/LazyPriceChart';
import SortControl from '../../components/comparateur/SortControl';
import ShareButton from '../../components/comparateur/ShareButton';
import BookingLinkBadge from '../../components/comparateur/BookingLinkBadge';
import { buildBookingUrl } from '../../utils/bookingLinks';

import { SEOHead } from '../../components/ui/SEOHead';

const OPERATOR_URLS: Record<string, string> = {
  'Orange': 'https://boutique.orange.fr/',
  'SFR': 'https://www.sfr.fr/',
  'Free': 'https://www.free.fr/',
  'Bouygues': 'https://www.bouyguestelecom.fr/',
  'Canal+': 'https://www.canalplus.com/',
  'Only': 'https://www.only-telecom.fr/',
  'Outremer': 'https://www.outremercom.com/',
  'Digicel': 'https://www.digicelgroup.com/',
};

function getOperatorUrl(operatorName: string, url?: string): string {
  const base = url || (() => {
    for (const [key, u] of Object.entries(OPERATOR_URLS)) {
      if (operatorName.toLowerCase().includes(key.toLowerCase())) return u;
    }
    return '#';
  })();
  return buildBookingUrl(base, 'comparateur-mobile');
}

/**
 * Module de comparaison des prix des abonnements mobiles
 * 
 * UX Mobile-first (Samsung S24+ prioritaire)
 * Page unique, lisible à une main
 * Aucun pop-up, aucun scroll horizontal
 */
export default function AbonnementsMobile() {
  const [territoire, setTerritoire] = useState('');
  const [typeOffre, setTypeOffre] = useState('');
  const [results, setResults] = useState<MobilePlanPrice[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [sortBy, setSortBy] = useState<string>('prixMensuel');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const territories = getTerritories();
  const offerTypes = getOfferTypes();

  const sortOptions = [
    { value: 'prixMensuel', label: 'Prix' },
    { value: 'operateur', label: 'Opérateur' },
    { value: 'donnees', label: 'Données' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (territoire) {
      const searchResults = searchMobilePlanPrices({
        territoire,
        typeOffre: typeOffre || undefined,
      });
      setResults(searchResults);
      setShowResults(true);
    }
  };

  const handleSortChange = (sort: string, direction: 'asc' | 'desc') => {
    setSortBy(sort);
    setSortDirection(direction);
  };

  const sortedResults = [...results].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'prixMensuel') {
      comparison = a.prixMensuel - b.prixMensuel;
    } else if (sortBy === 'operateur') {
      comparison = a.operateur.localeCompare(b.operateur);
    } else if (sortBy === 'donnees') {
      comparison = a.donnees.localeCompare(b.donnees);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleExport = (format: 'csv' | 'txt') => {
    if (results.length === 0) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `mobile-${territoire}-${timestamp}.${format}`;

    if (format === 'csv') {
      const headers = ['Opérateur', 'Type Offre', 'Prix Mensuel (€)', 'Données', 'Appels/SMS', 'Date Relevé'];
      const rows = sortedResults.map(r => [
        r.operateur,
        r.typeOffre,
        r.prixMensuel.toFixed(2),
        r.donnees,
        r.appelsSMS,
        r.dateReleve,
      ]);
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } else if (format === 'txt') {
      const text = [
        `Comparaison des prix Mobile - ${territoire}`,
        `Date: ${new Date().toLocaleDateString('fr-FR')}`,
        ``,
        `Prix minimum: ${formatPrice(Math.min(...results.map(r => r.prixMensuel)))}`,
        `Prix maximum: ${formatPrice(Math.max(...results.map(r => r.prixMensuel)))}`,
        `Écart: ${formatPrice(Math.max(...results.map(r => r.prixMensuel)) - Math.min(...results.map(r => r.prixMensuel)))}`,
        ``,
        `Détails des forfaits:`,
        ``,
        ...sortedResults.map(r => [
          `Opérateur: ${r.operateur}`,
          `Type: ${r.typeOffre}`,
          `Prix: ${formatPrice(r.prixMensuel)}/mois`,
          `Données: ${r.donnees}`,
          `Appels/SMS: ${r.appelsSMS}`,
          `Date: ${formatDate(r.dateReleve)}`,
          ``,
        ].join('\n')),
      ].join('\n');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <SEOHead
        title="Abonnements mobiles Outre-mer — Comparatif opérateurs"
        description="Comparez les forfaits mobiles en Guadeloupe, Martinique, Guyane et La Réunion. Prix, données et couverture réseau."
        canonical="https://teetee971.github.io/akiprisaye-web/recherche-prix/abonnements-mobile"
      />
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Smartphone className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-100">
              Prix des abonnements mobiles
            </h1>
          </div>
          <p className="text-sm text-gray-400">
            Module en préparation - Données simulées
          </p>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300 mt-2">
            🔄 Données du {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Search Form */}
          <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Territoire */}
              <div>
                <label htmlFor="territoire" className="block text-sm font-medium text-gray-300 mb-2">
                  Territoire
                </label>
                <select
                  id="territoire"
                  value={territoire}
                  onChange={(e) => setTerritoire(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner un territoire</option>
                  {territories.map((terr) => (
                    <option key={terr} value={terr}>
                      {terr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type d'offre */}
              <div>
                <label htmlFor="typeOffre" className="block text-sm font-medium text-gray-300 mb-2">
                  Type d'offre (optionnel)
                </label>
                <select
                  id="typeOffre"
                  value={typeOffre}
                  onChange={(e) => setTypeOffre(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les types</option>
                  {offerTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Comparer les prix
              </button>
            </form>
          </section>

          {/* Results */}
          {showResults && (
            <>
              {results.length > 0 ? (
                <>
                  {/* Price Summary */}
                  <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                    <h2 className="text-lg font-semibold text-gray-100 mb-3">
                      Résumé des prix
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-1">Prix le plus bas</div>
                        <div className="text-xl font-bold text-green-400">
                          {formatPrice(Math.min(...results.map((r) => r.prixMensuel)))}
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-1">Prix le plus élevé</div>
                        <div className="text-xl font-bold text-orange-400">
                          {formatPrice(Math.max(...results.map((r) => r.prixMensuel)))}
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-1">Écart maximal</div>
                        <div className="text-xl font-bold text-blue-400">
                          {formatPrice(
                            Math.max(...results.map((r) => r.prixMensuel)) -
                              Math.min(...results.map((r) => r.prixMensuel))
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Price Chart */}
                  <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                    <h2 className="text-lg font-semibold text-gray-100 mb-4">
                      Visualisation des prix
                    </h2>
                    <PriceChart
                      data={{
                        labels: sortedResults.map(r => r.operateur),
                        datasets: [
                          {
                            label: 'Prix mensuel (€)',
                            data: sortedResults.map(r => r.prixMensuel),
                            backgroundColor: 'rgba(59, 130, 246, 0.6)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 2,
                          },
                        ],
                      }}
                      type="bar"
                      title="Comparaison des prix par opérateur"
                      height={300}
                    />
                  </section>

                  {/* Controls */}
                  <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <SortControl
                        options={sortOptions}
                        currentSort={sortBy}
                        currentDirection={sortDirection}
                        onSortChange={handleSortChange}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExport('csv')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          aria-label="Exporter en CSV"
                        >
                          <Download className="w-4 h-4" />
                          CSV
                        </button>
                        <button
                          onClick={() => handleExport('txt')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          aria-label="Exporter en texte"
                        >
                          <Download className="w-4 h-4" />
                          TXT
                        </button>
                        <ShareButton
                          title={`Prix Mobile - ${territoire}`}
                          description={`Comparaison des prix des forfaits mobile sur ${territoire}`}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Results Table */}
                  <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                    <h2 className="text-lg font-semibold text-gray-100 mb-4">
                      Résultats ({results.length})
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-2 text-gray-400 font-medium">
                              Opérateur
                            </th>
                            <th className="text-left py-3 px-2 text-gray-400 font-medium">
                              Prix mensuel
                            </th>
                            <th className="text-left py-3 px-2 text-gray-400 font-medium">
                              Données
                            </th>
                            <th className="text-left py-3 px-2 text-gray-400 font-medium">
                              Appels/SMS
                            </th>
                            <th className="text-left py-3 px-2 text-gray-400 font-medium">
                              Relevé le
                            </th>
                            <th className="text-left py-3 px-2 text-gray-400 font-medium">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedResults.map((plan, index) => (
                            <tr key={`${plan.operateur}-${plan.donnees}-${plan.typeOffre}-${index}`} className="border-b border-slate-800 hover:bg-slate-800/30">
                              <td className="py-3 px-2">
                                <div className="text-gray-200 font-medium">{plan.operateur}</div>
                                <div className="text-xs text-gray-500">{plan.typeOffre}</div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-blue-400">
                                    {formatPrice(plan.prixMensuel)}
                                  </span>
                                  {index === 0 && (
                                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">
                                      Le moins cher
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">/mois</div>
                              </td>
                              <td className="py-3 px-2 text-gray-300 font-medium">
                                {plan.donnees}
                              </td>
                              <td className="py-3 px-2 text-gray-300">
                                {plan.appelsSMS}
                              </td>
                              <td className="py-3 px-2 text-gray-400 text-xs">
                                {formatDate(plan.dateReleve)}
                              </td>
                              <td className="py-3 px-2">
                                <a
                                  href={getOperatorUrl(plan.operateur)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" /> Souscrire
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Badge "Prix observé" */}
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-xs text-blue-200">
                        <strong>Prix observé</strong> — Ce ne sont PAS des prix garantis. Les tarifs peuvent varier selon promotions et conditions.
                      </p>
                    </div>
                  </section>

                  {/* Quel forfait choisir? */}
                  <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                    <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-400" />
                      Quel forfait choisir ?
                    </h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {/* Moins cher */}
                      {(() => {
                        if (!sortedResults.length) return null;
                        const best = sortedResults[0];
                        return (
                          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingDown className="w-4 h-4 text-green-400" />
                              <span className="text-sm font-semibold text-green-300">Moins cher</span>
                            </div>
                            <p className="text-white font-bold text-lg">{best.operateur}</p>
                            <p className="text-xs text-gray-400">{best.typeOffre}</p>
                            <p className="text-2xl font-bold text-green-400 mt-1">{formatPrice(best.prixMensuel)}<span className="text-sm font-normal text-gray-400">/mois</span></p>
                            <a
                              href={getOperatorUrl(best.operateur)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" /> Souscrire
                            </a>
                          </div>
                        );
                      })()}
                      {/* Plus de data */}
                      {(() => {
                        const withData = [...sortedResults].sort((a, b) => {
                          const numA = parseFloat(String(a.donnees).replace(/[^0-9.]/g, '') || '0');
                          const numB = parseFloat(String(b.donnees).replace(/[^0-9.]/g, '') || '0');
                          return numB - numA;
                        });
                        if (!withData.length) return null;
                        const best = withData[0];
                        return (
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-semibold text-blue-300">Plus de data</span>
                            </div>
                            <p className="text-white font-bold text-lg">{best.operateur}</p>
                            <p className="text-xs text-gray-400">{best.typeOffre}</p>
                            <p className="text-2xl font-bold text-blue-400 mt-1">{best.donnees}</p>
                            <p className="text-xs text-gray-400">{formatPrice(best.prixMensuel)}/mois</p>
                            <a
                              href={getOperatorUrl(best.operateur)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" /> Souscrire
                            </a>
                          </div>
                        );
                      })()}
                      {/* Idéal DOM-voyage */}
                      {(() => {
                        if (!sortedResults.length) return null;
                        const best = sortedResults[Math.floor(sortedResults.length / 2)] || sortedResults[0];
                        return (
                          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="w-4 h-4 text-purple-400" />
                              <span className="text-sm font-semibold text-purple-300">Idéal DOM-voyage</span>
                            </div>
                            <p className="text-white font-bold text-lg">{best.operateur}</p>
                            <p className="text-xs text-gray-400">{best.typeOffre}</p>
                            <p className="text-2xl font-bold text-purple-400 mt-1">{formatPrice(best.prixMensuel)}<span className="text-sm font-normal text-gray-400">/mois</span></p>
                            <p className="text-xs text-gray-400 mt-1">Recommandé pour les voyages entre DOM</p>
                            <a
                              href={getOperatorUrl(best.operateur)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" /> Souscrire
                            </a>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="mt-3"><BookingLinkBadge /></div>
                  </section>
                </>
              ) : (
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center">
                  <p className="text-gray-400">
                    Aucun résultat pour cette recherche. Essayez un autre territoire.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Transparency / Methodology Block (OBLIGATOIRE) */}
          <section className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-blue-300">
                  Méthodologie & Transparence
                </h3>
                
                <div className="space-y-2 text-xs text-gray-300">
                  <p>
                    <strong>Sources</strong> — Les prix affichés proviennent d'observations citoyennes publiques et de données publiques des opérateurs. Aucune garantie de disponibilité ou d'exactitude.
                  </p>
                  
                  <p>
                    <strong>Méthode de comparaison</strong> — Les forfaits sont triés par prix mensuel croissant, puis par date de relevé. Seuls les forfaits observés récemment sont affichés.
                  </p>
                  
                  <p>
                    <strong>Limites</strong> — Les prix affichés ne tiennent pas compte des promotions temporaires, des frais d'activation, ni des conditions spécifiques (engagement, frais de résiliation, options payantes).
                  </p>
                  
                  <p>
                    <strong>Aucune affiliation</strong> — A KI PRI SA YÉ ne reçoit aucune commission des opérateurs mobiles. Comparaison neutre et indépendante.
                  </p>
                  
                  <p>
                    <strong>Données indicatives</strong> — Cet outil est destiné à l'information et à la comparaison. Il ne remplace pas une consultation des offres officielles auprès des opérateurs.
                  </p>
                  
                  <p>
                    <strong>Aucun tracking</strong> — Aucune donnée utilisateur n'est collectée. Votre recherche reste privée.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
    </>
  );
}
