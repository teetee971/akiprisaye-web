import React, { useState } from 'react';
import { Zap, Info, Download } from 'lucide-react';
import {
  searchElectricityPrices,
  getTerritories,
  getTariffTypes,
  calculateDOMMetropoleGap,
  type ElectricityPrice,
} from '../../services/electricityPriceService';
import PriceChart from '../../components/comparateur/LazyPriceChart';
import SortControl from '../../components/comparateur/SortControl';
import ShareButton from '../../components/comparateur/ShareButton';

/**
 * Module de comparaison des prix de l'électricité
 * 
 * UX Mobile-first (Samsung S24+ prioritaire)
 * Page unique, lisible à une main
 * Aucun pop-up, aucun scroll horizontal
 */
export default function Electricite() {
  const [territoire, setTerritoire] = useState('');
  const [typeTarif, setTypeTarif] = useState('');
  const [results, setResults] = useState<ElectricityPrice[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [sortBy, setSortBy] = useState<string>('prixKWh');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const territories = getTerritories();
  const tariffTypes = getTariffTypes();

  const sortOptions = [
    { value: 'prixKWh', label: 'Prix kWh' },
    { value: 'abonnementMensuel', label: 'Abonnement' },
    { value: 'fournisseur', label: 'Fournisseur' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (territoire) {
      const searchResults = searchElectricityPrices({
        territoire,
        typeTarif: typeTarif || undefined,
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
    if (sortBy === 'prixKWh') {
      comparison = a.prixKWh - b.prixKWh;
    } else if (sortBy === 'abonnementMensuel') {
      comparison = a.abonnementMensuel - b.abonnementMensuel;
    } else if (sortBy === 'fournisseur') {
      comparison = a.fournisseur.localeCompare(b.fournisseur);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleExport = (format: 'csv' | 'txt') => {
    if (results.length === 0) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `electricite-${territoire}-${timestamp}.${format}`;

    if (format === 'csv') {
      const headers = ['Fournisseur', 'Type Tarif', 'Prix kWh (€)', 'Abonnement Mensuel (€)', 'Date Relevé'];
      const rows = sortedResults.map(r => [
        r.fournisseur,
        r.typeTarif,
        r.prixKWh.toFixed(4),
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
        `Comparaison des prix de l'électricité - ${territoire}`,
        `Date: ${new Date().toLocaleDateString('fr-FR')}`,
        ``,
        `Prix minimum: ${formatPrice(Math.min(...results.map(r => r.prixKWh)))}`,
        `Prix maximum: ${formatPrice(Math.max(...results.map(r => r.prixKWh)))}`,
        gap !== null ? `Écart DOM/Métropole: ${gap > 0 ? '+' : ''}${gap}%` : '',
        ``,
        `Détails des tarifs:`,
        ``,
        ...sortedResults.map(r => [
          `Fournisseur: ${r.fournisseur}`,
          `Type: ${r.typeTarif}`,
          `Prix kWh: ${formatPrice(r.prixKWh)}`,
          `Abonnement: ${formatSubscription(r.abonnementMensuel)}/mois`,
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
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(price);
  };

  const formatSubscription = (price: number) => {
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
            <Zap className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-100">
              Prix de l'électricité
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
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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

              {/* Type de tarif */}
              <div>
                <label htmlFor="typeTarif" className="block text-sm font-medium text-gray-300 mb-2">
                  Type de tarif (optionnel)
                </label>
                <select
                  id="typeTarif"
                  value={typeTarif}
                  onChange={(e) => setTypeTarif(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Tous les tarifs</option>
                  {tariffTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-900"
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
                        <div className="text-sm text-gray-400 mb-1">Prix kWh le plus bas</div>
                        <div className="text-xl font-bold text-green-400">
                          {formatPrice(Math.min(...results.map((r) => r.prixKWh)))}
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-1">Prix kWh le plus élevé</div>
                        <div className="text-xl font-bold text-orange-400">
                          {formatPrice(Math.max(...results.map((r) => r.prixKWh)))}
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
                              Math.max(...results.map((r) => r.prixKWh)) -
                                Math.min(...results.map((r) => r.prixKWh))
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
                        labels: sortedResults.map(r => r.fournisseur),
                        datasets: [
                          {
                            label: 'Prix kWh (€)',
                            data: sortedResults.map(r => r.prixKWh),
                            backgroundColor: 'rgba(250, 204, 21, 0.6)',
                            borderColor: 'rgba(250, 204, 21, 1)',
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
                          title={`Prix de l'électricité - ${territoire}`}
                          description={`Comparaison des prix de l'électricité sur ${territoire}`}
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
                              Fournisseur
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                              Type
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                              Prix kWh
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
                                {result.fournisseur}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                    result.typeTarif === 'Tarif réglementé'
                                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  }`}
                                >
                                  {result.typeTarif}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-100">
                                    {formatPrice(result.prixKWh)}
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
                                {formatSubscription(result.abonnementMensuel)}/mois
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
              <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-100">
                  Méthodologie & Sources
                </h3>
                <div className="text-sm text-gray-400 space-y-2">
                  <p>
                    <strong className="text-gray-300">Sources :</strong> Données simulées
                    basées sur les tarifs réglementés publiés par la CRE (Commission de
                    Régulation de l'Énergie), EDF, et les autorités locales. Les prix
                    affichés sont indicatifs et peuvent varier selon les options tarifaires.
                  </p>
                  <p>
                    <strong className="text-gray-300">Méthode de comparaison :</strong> Les
                    résultats sont triés par prix du kWh croissant, puis par date de relevé
                    (les plus récents en premier). Les tarifs réglementés sont fixés par
                    les pouvoirs publics.
                  </p>
                  <p>
                    <strong className="text-gray-300">Limites :</strong> Les prix affichés
                    ne constituent pas une simulation de facture. La consommation réelle,
                    les taxes locales, et les options tarifaires peuvent modifier
                    significativement le montant final. Aucune estimation personnalisée
                    n'est proposée.
                  </p>
                  <p>
                    <strong className="text-gray-300">Absence d'affiliation :</strong> Ce
                    comparateur est un outil d'information neutre. Nous ne recevons aucune
                    commission des fournisseurs et n'avons aucun partenariat commercial.
                  </p>
                  <p>
                    <strong className="text-gray-300">Données indicatives :</strong> Les
                    prix ne constituent pas une offre contractuelle. Consultez les conditions
                    générales de vente de chaque fournisseur pour obtenir les informations
                    officielles et à jour.
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
