import React, { useState } from 'react';
import { Plane, Info, TrendingUp } from 'lucide-react';
import {
  searchAirFreightPrices,
  getAirports,
  getMerchandiseTypes,
  type AirFreightPrice,
} from '../../services/airFreightPriceService';

/**
 * Module de comparaison des coûts de fret aérien
 *
 * UX Mobile-first (Samsung S24+ prioritaire)
 * Page unique, lisible à une main
 * Aucun pop-up, aucun scroll horizontal
 */
export default function FretAerien() {
  const [aeroportDepart, setAeroportDepart] = useState('');
  const [aeroportArrivee, setAeroportArrivee] = useState('');
  const [typeMarchandise, setTypeMarchandise] = useState('');
  const [results, setResults] = useState<AirFreightPrice[]>([]);
  const [showResults, setShowResults] = useState(false);

  const airports = getAirports();
  const merchandiseTypes = getMerchandiseTypes();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (aeroportDepart && aeroportArrivee) {
      const searchResults = searchAirFreightPrices({
        aeroportDepart,
        aeroportArrivee,
        typeMarchandise: typeMarchandise || undefined,
      });
      setResults(searchResults);
      setShowResults(true);
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
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Plane className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Coûts du fret aérien</h1>
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
              {/* Aéroport de départ */}
              <div>
                <label
                  htmlFor="aeroportDepart"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Aéroport de départ
                </label>
                <select
                  id="aeroportDepart"
                  value={aeroportDepart}
                  onChange={(e) => setAeroportDepart(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                >
                  <option value="">Sélectionner un aéroport de départ</option>
                  {airports.departure.map((airport) => (
                    <option key={airport} value={airport}>
                      {airport}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aéroport d'arrivée */}
              <div>
                <label
                  htmlFor="aeroportArrivee"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Aéroport d'arrivée
                </label>
                <select
                  id="aeroportArrivee"
                  value={aeroportArrivee}
                  onChange={(e) => setAeroportArrivee(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                >
                  <option value="">Sélectionner un aéroport d'arrivée</option>
                  {airports.arrival.map((airport) => (
                    <option key={airport} value={airport}>
                      {airport}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type de marchandise */}
              <div>
                <label
                  htmlFor="typeMarchandise"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Type de marchandise (optionnel)
                </label>
                <select
                  id="typeMarchandise"
                  value={typeMarchandise}
                  onChange={(e) => setTypeMarchandise(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Tous les types</option>
                  {merchandiseTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Comparer les coûts aériens
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
                      Résumé des coûts (prix par kg)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-1">Coût le plus bas</div>
                        <div className="text-xl font-bold text-green-400">
                          {formatPrice(Math.min(...results.map((r) => r.prixParKg)))}/kg
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-1">Coût le plus élevé</div>
                        <div className="text-xl font-bold text-orange-400">
                          {formatPrice(Math.max(...results.map((r) => r.prixParKg)))}/kg
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                      <p className="text-sm text-sky-300">
                        <strong>ℹ️ À noter :</strong> Le fret aérien est utilisé principalement pour
                        les marchandises urgentes, sensibles (médicaments, produits frais), ou de
                        faible volume. Les coûts sont significativement plus élevés que le fret
                        maritime.
                      </p>
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
                              Opérateur
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                              Type fret
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                              Marchandise
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                              Prix/kg
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">
                              Date relevé
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {results.map((result, index) => (
                            <tr
                              key={`${result.operateurAerien}-${result.typeMarchandise}-${result.aeroportDepart}-${result.aeroportArrivee}-${index}`}
                              className="hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm text-gray-200">
                                {result.operateurAerien}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-medium">
                                  {result.typeFret}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                    result.typeMarchandise === 'Médical'
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                      : result.typeMarchandise === 'Alimentaire'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : result.typeMarchandise === 'Urgent'
                                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                  }`}
                                >
                                  {result.typeMarchandise}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-100">
                                    {formatPrice(result.prixParKg)}/kg
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                    Coût observé
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  ⚠️ Données indicatives
                                </div>
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
                  <p className="text-gray-400">Aucun résultat trouvé pour cette route aérienne.</p>
                </div>
              )}
            </section>
          )}

          {/* Educational Block (MANDATORY) */}
          <section className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-start gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-sky-400 flex-shrink-0 mt-0.5" />
              <h3 className="text-lg font-semibold text-gray-100">
                Pourquoi le fret aérien est-il plus cher que le maritime ?
              </h3>
            </div>
            <div className="space-y-4 text-sm text-gray-300">
              <div className="p-4 bg-slate-800/30 rounded-lg">
                <h4 className="font-semibold text-gray-200 mb-2">✈️ Capacité limitée</h4>
                <p className="text-gray-400">
                  Les avions cargo ont une capacité de chargement beaucoup plus limitée que les
                  navires maritimes. Un avion cargo transportera quelques dizaines de tonnes, contre
                  plusieurs milliers de tonnes pour un porte-conteneurs. Cette contrainte de volume
                  rend le coût par kg significativement plus élevé.
                </p>
              </div>

              <div className="p-4 bg-slate-800/30 rounded-lg">
                <h4 className="font-semibold text-gray-200 mb-2">⛽ Coûts du carburant</h4>
                <p className="text-gray-400">
                  Le transport aérien consomme proportionnellement beaucoup plus de carburant que le
                  transport maritime pour une même distance parcourue. Le kérosène aéronautique
                  représente une part importante des coûts d'exploitation, ce qui se répercute
                  directement sur les tarifs du fret aérien.
                </p>
              </div>

              <div className="p-4 bg-slate-800/30 rounded-lg">
                <h4 className="font-semibold text-gray-200 mb-2">
                  ⏱️ Priorité aux marchandises sensibles
                </h4>
                <p className="text-gray-400">
                  Le fret aérien est privilégié pour les envois urgents ou les produits nécessitant
                  une livraison rapide : médicaments, produits frais périssables, échantillons
                  biologiques, pièces détachées critiques. La rapidité (quelques heures vs plusieurs
                  semaines) justifie le surcoût pour ces catégories spécifiques.
                </p>
              </div>

              <div className="p-4 bg-slate-800/30 rounded-lg">
                <h4 className="font-semibold text-gray-200 mb-2">
                  🏥 Impact sur produits essentiels
                </h4>
                <p className="text-gray-400">
                  Pour les territoires ultramarins, le fret aérien permet d'assurer la continuité
                  territoriale pour les produits médicaux essentiels, les denrées périssables de
                  première nécessité, et les fournitures d'urgence. Malgré son coût élevé, il reste
                  indispensable pour certains types d'approvisionnement.
                </p>
              </div>

              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-300">
                  <strong>⚠️ Important :</strong> Les coûts affichés sont indicatifs et ne
                  permettent pas de calculer l'impact sur les prix à la consommation. De nombreux
                  autres facteurs (taxes, manutention, stockage, distribution) influencent le prix
                  final des produits dans les DOM. Aucune extrapolation automatique n'est proposée.
                </p>
              </div>
            </div>
          </section>

          {/* Transparency Block (MANDATORY) */}
          <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-100">Méthodologie & Sources</h3>
                <div className="text-sm text-gray-400 space-y-2">
                  <p>
                    <strong className="text-gray-300">Sources :</strong> Données simulées basées sur
                    les tarifs publics des compagnies aériennes cargo, les rapports des aéroports,
                    et les observations du secteur logistique. Les coûts affichés sont indicatifs et
                    peuvent varier selon la saison, le volume, et les conditions contractuelles.
                  </p>
                  <p>
                    <strong className="text-gray-300">Méthode de comparaison :</strong> Les
                    résultats sont triés par coût au kg croissant, puis par date de relevé (les plus
                    récents en premier). Les tarifs varient selon le type de marchandise, le poids
                    total, et les services associés (manutention spécialisée, chaîne du froid,
                    etc.).
                  </p>
                  <p>
                    <strong className="text-gray-300">Limites :</strong> Les coûts affichés ne
                    constituent pas une estimation personnalisée ni un devis logistique. Les frais
                    d'emballage spécialisé, d'assurance, de manutention aéroportuaire, et de
                    distribution finale ne sont pas inclus. Aucun calcul de panier consommateur
                    n'est proposé.
                  </p>
                  <p>
                    <strong className="text-gray-300">Absence d'affiliation :</strong> Ce
                    comparateur est un outil d'information neutre et pédagogique. Nous ne recevons
                    aucune commission des compagnies aériennes et n'avons aucun partenariat
                    commercial.
                  </p>
                  <p>
                    <strong className="text-gray-300">Données indicatives :</strong> Les coûts ne
                    constituent pas une offre contractuelle. Consultez les conditions générales des
                    opérateurs aériens pour obtenir des devis officiels et à jour.
                  </p>
                  <p>
                    <strong className="text-gray-300">Outil d'information :</strong> Ce module est
                    conçu pour informer le public sur les mécanismes de formation des coûts
                    logistiques, sans prétention d'exhaustivité ni d'actualité en temps réel.
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
