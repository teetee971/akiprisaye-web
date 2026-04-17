import React, { useState } from 'react';
import { Package, Info, TrendingUp } from 'lucide-react';
import { SEOHead } from '../../components/ui/SEOHead';
import {
  searchFreightPrices,
  getPorts,
  getTransportTypes,
  isInterDOM,
  type FreightPrice,
} from '../../services/freightPriceService';

/**
 * Module de comparaison des coûts de fret / transport de conteneurs
 *
 * UX Mobile-first (Samsung S24+ prioritaire)
 * Page unique, lisible à une main
 * Aucun pop-up, aucun scroll horizontal
 */
export default function Fret() {
  const [portDepart, setPortDepart] = useState('');
  const [portArrivee, setPortArrivee] = useState('');
  const [typeTransport, setTypeTransport] = useState('');
  const [results, setResults] = useState<FreightPrice[]>([]);
  const [showResults, setShowResults] = useState(false);

  const ports = getPorts();
  const transportTypes = getTransportTypes();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (portDepart && portArrivee) {
      const searchResults = searchFreightPrices({
        portDepart,
        portArrivee,
        typeTransport: typeTransport || undefined,
      });
      setResults(searchResults);
      setShowResults(true);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const interDOM = portDepart && portArrivee && isInterDOM(portDepart, portArrivee);

  return (
    <>
      <SEOHead
        title="Prix du fret Outre-mer — Coûts de transport maritime"
        description="Suivez l'évolution des coûts de fret maritime vers les DOM-TOM. Impact sur les prix alimentaires et biens de consommation."
        canonical="https://teetee971.github.io/akiprisaye-web/recherche-prix/fret"
      />
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-orange-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-100">
                Coûts du fret maritime / conteneurs
              </h1>
            </div>
            <p className="text-sm text-gray-400">Module en préparation - Données simulées</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Search Form */}
            <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
              <form onSubmit={handleSearch} className="space-y-4">
                {/* Port de départ */}
                <div>
                  <label
                    htmlFor="portDepart"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Port de départ
                  </label>
                  <select
                    id="portDepart"
                    value={portDepart}
                    onChange={(e) => setPortDepart(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Sélectionner un port de départ</option>
                    {ports.departure.map((port) => (
                      <option key={port} value={port}>
                        {port}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Port d'arrivée */}
                <div>
                  <label
                    htmlFor="portArrivee"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Port d'arrivée
                  </label>
                  <select
                    id="portArrivee"
                    value={portArrivee}
                    onChange={(e) => setPortArrivee(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Sélectionner un port d'arrivée</option>
                    {ports.arrival.map((port) => (
                      <option key={port} value={port}>
                        {port}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type de transport */}
                <div>
                  <label
                    htmlFor="typeTransport"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Type de transport (optionnel)
                  </label>
                  <select
                    id="typeTransport"
                    value={typeTransport}
                    onChange={(e) => setTypeTransport(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Tous les types</option>
                    {transportTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  Comparer les coûts
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
                        Résumé des coûts {interDOM ? '(Inter-DOM)' : '(Métropole → DOM)'}
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-sm text-gray-400 mb-1">Coût le plus bas</div>
                          <div className="text-xl font-bold text-green-400">
                            {formatPrice(Math.min(...results.map((r) => r.prixEstime)))}
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-sm text-gray-400 mb-1">Coût le plus élevé</div>
                          <div className="text-xl font-bold text-orange-400">
                            {formatPrice(Math.max(...results.map((r) => r.prixEstime)))}
                          </div>
                        </div>
                      </div>
                      {!interDOM && (
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-300">
                              <strong>Impact potentiel sur les prix :</strong> Les coûts de fret
                              représentent une part significative du prix final des produits
                              importés dans les DOM. Plus la distance est grande, plus l'impact est
                              important.
                            </p>
                          </div>
                        </div>
                      )}
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
                                Opérateur
                              </th>
                              <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                                Transport
                              </th>
                              <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                                Conteneur
                              </th>
                              <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                                Coût estimé
                              </th>
                              <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                                Date relevé
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/50">
                            {results.map((result, index) => (
                              <tr
                                key={`${result.operateurLogistique}-${result.typeConteneur}-${result.portDepart}-${index}`}
                                className="hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="px-4 py-3 text-sm text-gray-200">
                                  {result.operateurLogistique}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300">
                                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-medium">
                                    {result.typeTransport}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300">
                                  {result.typeConteneur}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-100">
                                      {formatPrice(result.prixEstime)}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                      Coût observé
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">⚠️ Non garanti</div>
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
                    <p className="text-gray-400">Aucun résultat trouvé pour cette route.</p>
                  </div>
                )}
              </section>
            )}

            {/* Educational Block (MANDATORY) */}
            <section className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-start gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                <h3 className="text-lg font-semibold text-gray-100">
                  Pourquoi le fret impacte fortement les prix dans les DOM ?
                </h3>
              </div>
              <div className="space-y-4 text-sm text-gray-300">
                <div className="p-4 bg-slate-800/30 rounded-lg">
                  <h4 className="font-semibold text-gray-200 mb-2">
                    📦 Dépendance aux importations
                  </h4>
                  <p className="text-gray-400">
                    Les territoires d'outre-mer dépendent fortement des importations pour leur
                    approvisionnement en produits de consommation, matériaux de construction,
                    équipements et denrées alimentaires. Cette dépendance structurelle rend les
                    coûts de transport maritime déterminants dans la formation des prix locaux.
                  </p>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-lg">
                  <h4 className="font-semibold text-gray-200 mb-2">
                    🌍 Effet du volume et de l'éloignement
                  </h4>
                  <p className="text-gray-400">
                    Plus la distance entre le port de départ (généralement en métropole ou en
                    Europe) et le port d'arrivée DOM est grande, plus les coûts de fret augmentent.
                    Le volume des échanges commerciaux et la fréquence des rotations influencent
                    également directement les tarifs pratiqués par les opérateurs logistiques.
                  </p>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-lg">
                  <h4 className="font-semibold text-gray-200 mb-2">
                    ⚖️ Différences DOM / Métropole
                  </h4>
                  <p className="text-gray-400">
                    Les coûts de fret maritime ajoutent une surcharge significative par rapport aux
                    prix pratiqués en métropole pour les mêmes produits. Cette surcharge se
                    répercute sur l'ensemble de la chaîne de distribution et contribue aux écarts de
                    prix constatés entre la métropole et les DOM.
                  </p>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-lg">
                  <h4 className="font-semibold text-gray-200 mb-2">
                    🚢 Rôle des ports et de la logistique
                  </h4>
                  <p className="text-gray-400">
                    Les infrastructures portuaires, les capacités de stockage, la disponibilité des
                    conteneurs, et l'efficacité de la chaîne logistique locale jouent un rôle
                    crucial. Les délais d'acheminement, les formalités douanières, et les coûts de
                    manutention s'ajoutent au coût du transport maritime lui-même.
                  </p>
                </div>

                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-300">
                    <strong>⚠️ Important :</strong> Les coûts affichés sont indicatifs et ne
                    constituent pas une estimation de l'impact sur votre panier de consommation. De
                    nombreux autres facteurs (taxes, marges commerciales, coûts de distribution
                    locale) influencent les prix finaux dans les DOM.
                  </p>
                </div>
              </div>
            </section>

            {/* Transparency Block (MANDATORY) */}
            <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-gray-100">Méthodologie & Sources</h3>
                  <div className="text-sm text-gray-400 space-y-2">
                    <p>
                      <strong className="text-gray-300">Sources :</strong> Données simulées basées
                      sur les tarifs publics des ports, les rapports des autorités maritimes, et les
                      observations des opérateurs logistiques. Les coûts affichés sont indicatifs et
                      peuvent varier selon la saison, le volume, et les conditions contractuelles.
                    </p>
                    <p>
                      <strong className="text-gray-300">Méthode de comparaison :</strong> Les
                      résultats sont triés par coût croissant, puis par date de relevé (les plus
                      récents en premier). Les tarifs varient selon le type de conteneur, le volume
                      transporté, et les services associés.
                    </p>
                    <p>
                      <strong className="text-gray-300">Limites :</strong> Les coûts affichés ne
                      constituent pas une estimation personnalisée ni une simulation de facture
                      logistique. Les frais portuaires, les assurances, les taxes douanières, et les
                      coûts de distribution locale ne sont pas inclus. Aucun calcul automatique de
                      l'impact sur les prix à la consommation n'est proposé.
                    </p>
                    <p>
                      <strong className="text-gray-300">Absence d'affiliation :</strong> Ce
                      comparateur est un outil d'information neutre et pédagogique. Nous ne recevons
                      aucune commission des opérateurs logistiques et n'avons aucun partenariat
                      commercial.
                    </p>
                    <p>
                      <strong className="text-gray-300">Données indicatives :</strong> Les coûts ne
                      constituent pas une offre contractuelle. Consultez les conditions générales
                      des opérateurs logistiques pour obtenir des devis officiels et à jour.
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
