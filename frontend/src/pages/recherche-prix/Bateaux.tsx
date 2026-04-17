import React, { useState } from 'react';
import { Ship, Info, TrendingUp } from 'lucide-react';
import {
  searchBoatPrices,
  getDepartureLocations,
  getArrivalLocations,
  getAvailableMonths,
  getPricesByMonth,
  type BoatPrice,
} from '../../services/boatPriceService';

/**
 * Module de comparaison des prix de bateaux/ferries
 *
 * UX Mobile-first (Samsung S24+ prioritaire)
 * Page unique, lisible à une main
 * Aucun pop-up, aucun scroll horizontal
 */
export default function Bateaux() {
  const [depart, setDepart] = useState('');
  const [arrivee, setArrivee] = useState('');
  const [mois, setMois] = useState('');
  const [results, setResults] = useState<BoatPrice[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  const departureLocations = getDepartureLocations();
  const arrivalLocations = getArrivalLocations();
  const availableMonths = depart && arrivee ? getAvailableMonths(depart, arrivee) : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (depart && arrivee) {
      const searchResults = searchBoatPrices({ depart, arrivee, mois: mois || undefined });
      setResults(searchResults);
      setShowResults(true);

      // Préparer les données du graphique
      const priceData = getPricesByMonth(depart, arrivee);
      setChartData(priceData);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
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
            <Ship className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-100">
              Prix des bateaux & ferries
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
              {/* Départ */}
              <div>
                <label htmlFor="depart" className="block text-sm font-medium text-gray-300 mb-2">
                  Départ
                </label>
                <select
                  id="depart"
                  value={depart}
                  onChange={(e) => {
                    setDepart(e.target.value);
                    setMois(''); // Reset mois when changing route
                  }}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner un départ</option>
                  {departureLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Arrivée */}
              <div>
                <label htmlFor="arrivee" className="block text-sm font-medium text-gray-300 mb-2">
                  Arrivée
                </label>
                <select
                  id="arrivee"
                  value={arrivee}
                  onChange={(e) => {
                    setArrivee(e.target.value);
                    setMois(''); // Reset mois when changing route
                  }}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner une arrivée</option>
                  {arrivalLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mois (optionnel) */}
              {availableMonths.length > 0 && (
                <div>
                  <label htmlFor="mois" className="block text-sm font-medium text-gray-300 mb-2">
                    Mois ou période (optionnel)
                  </label>
                  <select
                    id="mois"
                    value={mois}
                    onChange={(e) => setMois(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les mois</option>
                    {availableMonths.map((month) => (
                      <option key={month} value={month}>
                        {formatMonth(month)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                              Compagnie
                            </th>
                            <th className="text-left py-3 px-2 text-gray-400 font-medium">Prix</th>
                            <th className="text-left py-3 px-2 text-gray-400 font-medium">Mois</th>
                            <th className="text-left py-3 px-2 text-gray-400 font-medium">
                              Relevé le
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((boat, index) => (
                            <tr
                              key={`${boat.compagnie}-${boat.ligne}-${boat.mois}-${index}`}
                              className="border-b border-slate-800 hover:bg-slate-800/30"
                            >
                              <td className="py-3 px-2">
                                <div className="text-gray-200 font-medium">{boat.compagnie}</div>
                                <div className="text-xs text-gray-500">{boat.source}</div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-blue-400">
                                    {formatPrice(boat.prix)}
                                  </span>
                                  {index === 0 && (
                                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">
                                      Le moins cher
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-2 text-gray-300">{formatMonth(boat.mois)}</td>
                              <td className="py-3 px-2 text-gray-400 text-xs">
                                {formatDate(boat.dateReleve)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Badge "Prix observé" */}
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-xs text-blue-200">
                        <strong>Prix observé</strong> — Ce ne sont PAS des prix garantis. Les tarifs
                        peuvent varier.
                      </p>
                    </div>
                  </section>

                  {/* Simple Graph */}
                  {chartData.length > 1 && (
                    <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                      <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Évolution des prix par mois
                      </h2>

                      <div className="space-y-3">
                        {chartData.map((data) => (
                          <div key={data.mois} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-300">{formatMonth(data.mois)}</span>
                              <span className="text-gray-400">
                                {formatPrice(data.prixMin)} - {formatPrice(data.prixMax)}
                              </span>
                            </div>
                            <div className="relative h-8 bg-slate-800 rounded overflow-hidden">
                              <div
                                className="absolute h-full bg-blue-500/30 rounded"
                                style={{
                                  width: `${(data.prixMoyen / Math.max(...chartData.map((d) => d.prixMax))) * 100}%`,
                                }}
                              />
                              <div className="absolute inset-0 flex items-center px-3">
                                <span className="text-xs font-semibold text-gray-200">
                                  Moy: {formatPrice(data.prixMoyen)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="mt-4 text-xs text-gray-400">
                        Aucune prédiction - Historique basé sur les observations disponibles
                      </p>
                    </section>
                  )}

                  {chartData.length <= 1 && (
                    <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                      <p className="text-gray-400 text-center">
                        Historique insuffisant pour afficher un graphique
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center">
                  <p className="text-gray-400">
                    Aucun résultat pour cette recherche. Essayez une autre ligne.
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
                <h3 className="text-sm font-semibold text-blue-300">Méthodologie & Transparence</h3>

                <div className="space-y-2 text-xs text-gray-300">
                  <p>
                    <strong>Données publiques</strong> — Les prix affichés proviennent
                    d'observations citoyennes publiques. Aucune garantie de disponibilité ou
                    d'exactitude.
                  </p>

                  <p>
                    <strong>Aucun tracking</strong> — Aucune donnée utilisateur n'est collectée.
                    Votre recherche reste privée.
                  </p>

                  <p>
                    <strong>Aucune affiliation</strong> — A KI PRI SA YÉ ne reçoit aucune commission
                    des compagnies maritimes. Comparaison neutre et indépendante.
                  </p>

                  <p>
                    <strong>Usage informatif</strong> — Cet outil est destiné à l'information et à
                    la comparaison. Il ne remplace pas une recherche approfondie auprès des
                    compagnies.
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
