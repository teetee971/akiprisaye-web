import React, { useState } from 'react';
import { Droplet, Info, Download } from 'lucide-react';
import {
  searchWaterPrices,
  getTerritories,
  getServiceTypes,
  calculateDOMMetropoleGap,
  type WaterPrice,
} from '../../services/waterPriceService';
import PriceChart from '../../components/comparateur/LazyPriceChart';
import SortControl from '../../components/comparateur/SortControl';
import ShareButton from '../../components/comparateur/ShareButton';

/**
 * Module de comparaison des prix de l'eau
 * 
 * UX Mobile-first (Samsung S24+ prioritaire)
 * Page unique, lisible à une main
 * Aucun pop-up, aucun scroll horizontal
 */
export default function Eau() {
  const [territoire, setTerritoire] = useState('');
  const [typeService, setTypeService] = useState('');
  const [results, setResults] = useState<WaterPrice[]>([]);
  const [showResults, setShowResults] = useState(false);

  const territories = getTerritories();
  const serviceTypes = getServiceTypes();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (territoire) {
      const searchResults = searchWaterPrices({
        territoire,
        typeService: typeService || undefined,
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
    if (sortBy === 'prixM3') {
      comparison = a.prixM3 - b.prixM3;
    } else if (sortBy === 'organismeGestionnaire') {
      comparison = a.organismeGestionnaire.localeCompare(b.organismeGestionnaire);
    } else if (sortBy === 'typeService') {
      comparison = a.typeService.localeCompare(b.typeService);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleExport = (format: 'csv' | 'txt') => {
    if (results.length === 0) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `eau-${territoire}-${timestamp}.${format}`;

    if (format === 'csv') {
      const headers = ['Organisme', 'Type Service', 'Prix m³ (€)', 'Abonnement Mensuel (€)', 'Date Relevé'];
      const rows = sortedResults.map(r => [
        r.organismeGestionnaire,
        r.typeService,
        r.prixM3.toFixed(2),
        r.abonnementMensuel.toFixed(2),
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
        `Comparaison des prix de l'eau - ${territoire}`,
        `Date: ${new Date().toLocaleDateString('fr-FR')}`,
        ``,
        `Prix m³ minimum: ${formatPrice(Math.min(...results.map(r => r.prixM3)))}`,
        `Prix m³ maximum: ${formatPrice(Math.max(...results.map(r => r.prixM3)))}`,
        gap !== null ? `Écart DOM/Métropole: ${gap > 0 ? '+' : ''}${gap}%` : '',
        ``,
        `Détails des services:`,
        ``,
        ...sortedResults.map(r => [
          `Organisme: ${r.organismeGestionnaire}`,
          `Type: ${r.typeService}`,
          `Prix m³: ${formatPrice(r.prixM3)}`,
          `Abonnement: ${formatPrice(r.abonnementMensuel)}/mois`,
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

  const gap = territoire ? calculateDOMMetropoleGap(territoire) : null;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Droplet className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-100">
              Prix de l'eau
            </h1>
          </div>
          <p className="text-sm text-gray-400">
            Module en préparation - Données simulées
          </p>
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
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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

              {/* Type de service */}
              <div>
                <label htmlFor="typeService" className="block text-sm font-medium text-gray-300 mb-2">
                  Type de service (optionnel)
                </label>
                <select
                  id="typeService"
                  value={typeService}
                  onChange={(e) => setTypeService(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Tous les services</option>
                  {serviceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Comparer les prix
              </button>
            </form>
          </section>

          {/* Results */}
          {showResults && (
            <section className="space-y-4">
              {results.length > 0 ? (
                <>
                  {/* Summary */}
                  <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                    <h2 className="text-lg font-semibold text-gray-100 mb-3">
                      Résumé des prix
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-1">Prix m³ le plus bas</div>
                        <div className="text-xl font-bold text-green-400">
                          {formatPrice(Math.min(...results.map((r) => r.prixM3)))}
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-1">Prix m³ le plus élevé</div>
                        <div className="text-xl font-bold text-orange-400">
                          {formatPrice(Math.max(...results.map((r) => r.prixM3)))}
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-1">
                          {gap !== null ? 'Écart DOM / Métropole' : 'Écart maximal'}
                        </div>
                        <div className="text-xl font-bold text-blue-400">
                          {gap !== null ? (
                            <>{gap > 0 ? '+' : ''}{gap}%</>
                          ) : (
                            formatPrice(
                              Math.max(...results.map((r) => r.prixM3)) -
                                Math.min(...results.map((r) => r.prixM3))
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Chart */}
                  <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                    <h2 className="text-lg font-semibold text-gray-100 mb-4">
                      Visualisation des prix
                    </h2>
                    <PriceChart
                      data={{
                        labels: sortedResults.map(r => r.organismeGestionnaire),
                        datasets: [
                          {
                            label: 'Prix m³ (€)',
                            data: sortedResults.map(r => r.prixM3),
                            backgroundColor: 'rgba(34, 211, 238, 0.6)',
                            borderColor: 'rgba(34, 211, 238, 1)',
                            borderWidth: 2,
                          },
                        ],
                      }}
                      type="bar"
                      title="Comparaison des prix par fournisseur"
                      height={300}
                    />
                  </div>

                  {/* Controls */}
                  <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
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
                          title={`Prix de l'eau - ${territoire}`}
                          description={`Comparaison des prix de l'eau sur ${territoire}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="p-5 border-b border-slate-700">
                      <h2 className="text-lg font-semibold text-gray-100">
                        Résultats ({results.length} tarif{results.length > 1 ? 's' : ''})
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-800/50">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                              Organisme
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                              Service
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                              Prix m³
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                              Abonnement
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                              Date relevé
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {sortedResults.map((result, index) => (
                            <tr
                              key={index}
                              className="hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm text-gray-200">
                                {result.organismeGestionnaire}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-medium">
                                  {result.typeService}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-100">
                                    {formatPrice(result.prixM3)}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                    Prix observé
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  ⚠️ Non garanti
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                {formatPrice(result.abonnementMensuel)}/mois
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-400">
                                {formatDate(result.dateReleve)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center">
                  <p className="text-gray-400">Aucun résultat trouvé pour cette recherche.</p>
                </div>
              )}
            </section>
          )}

          {/* Transparency Block (MANDATORY) */}
          <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-100">
                  Méthodologie & Sources
                </h3>
                <div className="text-sm text-gray-400 space-y-2">
                  <p>
                    <strong className="text-gray-300">Sources :</strong> Données simulées
                    basées sur les rapports publics des offices de l'eau, des régies
                    municipales, et des syndicats d'eau. Les prix affichés sont indicatifs
                    et peuvent varier selon la consommation et les options tarifaires.
                  </p>
                  <p>
                    <strong className="text-gray-300">Méthode de comparaison :</strong> Les
                    résultats sont triés par prix au m³ croissant, puis par date de relevé
                    (les plus récents en premier). Les tarifs incluent la part fixe
                    (abonnement) et la part variable (prix au m³).
                  </p>
                  <p>
                    <strong className="text-gray-300">Limites :</strong> Les prix affichés
                    ne constituent pas une simulation de facture. La consommation réelle,
                    les redevances, et les taxes locales peuvent modifier significativement
                    le montant final. Aucune estimation personnalisée n'est proposée.
                  </p>
                  <p>
                    <strong className="text-gray-300">Absence d'affiliation :</strong> Ce
                    comparateur est un outil d'information neutre. Nous ne recevons aucune
                    commission des gestionnaires d'eau et n'avons aucun partenariat
                    commercial.
                  </p>
                  <p>
                    <strong className="text-gray-300">Données indicatives :</strong> Les
                    prix ne constituent pas une offre contractuelle. Consultez les conditions
                    générales de service de chaque gestionnaire pour obtenir les informations
                    officielles et à jour.
                  </p>
                  <p>
                    <strong className="text-gray-300">Service public :</strong> L'eau et
                    l'assainissement sont des services publics essentiels. Les tarifs sont
                    encadrés par les collectivités territoriales.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
