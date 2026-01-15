import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Briefcase, 
  Euro, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  CheckCircle,
  Filter,
  Search,
  Award,
  Clock,
  Target,
  DollarSign
} from 'lucide-react';
import type { Territory } from '../types/priceAlerts';
import type { 
  TrainingProgram, 
  TrainingFilters,
  TrainingLevel,
  TrainingMode,
  JobMarket,
  UserProfile,
  JobMatch
} from '../types/trainingComparison';
import {
  getAllTrainings,
  searchTrainings,
  getAvailableDomains,
  getTrainingStatistics,
  compareTrainings
} from '../services/trainingCatalogService';
import {
  getJobsInDemand,
  matchJobsToUser,
  getTopJobOpportunitiesWithROI
} from '../services/jobMatchingService';
import {
  simulateFunding
} from '../services/fundingService';

const TrainingComparator: React.FC = () => {
  const [territory, setTerritory] = useState<Territory>('MQ');
  const [searchQuery, setSearchQuery] = useState('');
  const [trainings, setTrainings] = useState<TrainingProgram[]>([]);
  const [filteredTrainings, setFilteredTrainings] = useState<TrainingProgram[]>([]);
  const [jobsInDemand, setJobsInDemand] = useState<JobMarket[]>([]);
  const [topOpportunities, setTopOpportunities] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'catalog' | 'jobs' | 'comparison'>('jobs');
  const [selectedTrainings, setSelectedTrainings] = useState<string[]>([]);
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  
  // Filters
  const [filters, setFilters] = useState<TrainingFilters>({
    territory,
  });

  useEffect(() => {
    loadData();
  }, [territory]);

  useEffect(() => {
    applyFilters();
  }, [trainings, searchQuery, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTrainings, jobs, opportunities, domains] = await Promise.all([
        getAllTrainings(territory),
        getJobsInDemand(territory),
        getTopJobOpportunitiesWithROI(territory, 10),
        getAvailableDomains(territory)
      ]);
      
      setTrainings(allTrainings);
      setJobsInDemand(jobs);
      setTopOpportunities(opportunities);
      setAvailableDomains(domains);
    } catch (error) {
      console.error('Error loading training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = trainings;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.details.domain.toLowerCase().includes(query) ||
        t.organisme.name.toLowerCase().includes(query) ||
        t.outcomes.jobs.some(job => job.toLowerCase().includes(query))
      );
    }

    if (filters.domain) {
      result = result.filter(t => t.details.domain === filters.domain);
    }

    if (filters.level) {
      result = result.filter(t => t.details.level === filters.level);
    }

    if (filters.mode) {
      result = result.filter(t => t.details.mode === filters.mode);
    }

    if (filters.cpfEligible) {
      result = result.filter(t => t.pricing.cpfEligible);
    }

    setFilteredTrainings(result);
  };

  const territories: { code: Territory; name: string }[] = [
    { code: 'GP', name: 'Guadeloupe' },
    { code: 'MQ', name: 'Martinique' },
    { code: 'GF', name: 'Guyane' },
    { code: 'RE', name: 'La Réunion' },
    { code: 'YT', name: 'Mayotte' },
  ];

  const toggleTrainingSelection = (trainingId: string) => {
    if (selectedTrainings.includes(trainingId)) {
      setSelectedTrainings(selectedTrainings.filter(id => id !== trainingId));
    } else if (selectedTrainings.length < 3) {
      setSelectedTrainings([...selectedTrainings, trainingId]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <GraduationCap className="w-16 h-16" />
            <div>
              <h1 className="text-5xl font-bold mb-2">
                🎓 Formations Professionnelles DOM-TOM
              </h1>
              <p className="text-xl text-indigo-100">
                Trouvez la formation qui mène à l'emploi
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold">{trainings.length}</div>
              <div className="text-sm text-indigo-200">Formations disponibles</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold">{jobsInDemand.length}</div>
              <div className="text-sm text-indigo-200">Métiers qui recrutent</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold">
                {trainings.filter(t => t.pricing.cpfEligible).length}
              </div>
              <div className="text-sm text-indigo-200">Éligibles CPF</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-3xl font-bold">
                {Math.round(trainings.reduce((sum, t) => sum + (t.outcomes.insertionRate6M || 0), 0) / trainings.length)}%
              </div>
              <div className="text-sm text-indigo-200">Taux insertion moyen</div>
            </div>
          </div>

          {/* Territory Selector */}
          <div className="mt-8">
            <label className="block text-sm font-medium mb-2">Territoire</label>
            <select
              value={territory}
              onChange={(e) => setTerritory(e.target.value as Territory)}
              className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white"
            >
              {territories.map((t) => (
                <option key={t.code} value={t.code} className="text-gray-900">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-4">
            <button
              onClick={() => setActiveView('jobs')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeView === 'jobs'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <Briefcase className="w-5 h-5 inline mr-2" />
              Métiers Porteurs
            </button>
            <button
              onClick={() => setActiveView('catalog')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeView === 'catalog'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <GraduationCap className="w-5 h-5 inline mr-2" />
              Catalogue Formations
            </button>
            <button
              onClick={() => setActiveView('comparison')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeView === 'comparison'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
              disabled={selectedTrainings.length === 0}
            >
              <Target className="w-5 h-5 inline mr-2" />
              Comparer ({selectedTrainings.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Chargement des données...</p>
          </div>
        ) : (
          <>
            {/* Jobs View */}
            {activeView === 'jobs' && (
              <div className="space-y-8">
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                    Métiers qui recrutent en {territories.find(t => t.code === territory)?.name}
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Découvrez les métiers en tension et les formations qui y mènent
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topOpportunities.map((opportunity) => (
                      <div
                        key={opportunity.job.id}
                        className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-indigo-500 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-white text-lg">
                              {opportunity.job.jobTitle}
                            </h3>
                            {opportunity.job.demand.shortage && (
                              <span className="inline-block mt-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                                Métier en tension
                              </span>
                            )}
                          </div>
                          <TrendingUp
                            className={`w-5 h-5 ${
                              opportunity.job.demand.trend === 'increasing'
                                ? 'text-green-400'
                                : 'text-gray-400'
                            }`}
                          />
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Briefcase className="w-4 h-4" />
                            <span>{opportunity.job.demand.openPositions} postes ouverts</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Euro className="w-4 h-4" />
                            <span>{opportunity.job.salary.average}€/mois (moyen)</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock className="w-4 h-4" />
                            <span>{opportunity.timeToJob} mois de formation</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <DollarSign className="w-4 h-4" />
                            <span>Coût: {opportunity.totalCost}€</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-600">
                          <div className="text-sm font-medium text-indigo-400 mb-2">
                            ROI sur 5 ans
                          </div>
                          <div className="text-2xl font-bold text-green-400">
                            +{Math.round(opportunity.roi.gain5Years).toLocaleString()}€
                          </div>
                          <div className="text-xs text-gray-400">
                            Amortissement: {opportunity.roi.monthsToBreakEven} mois
                          </div>
                        </div>

                        {opportunity.requiredTrainings.length > 0 && (
                          <div className="mt-4">
                            <button
                              onClick={() => {
                                setActiveView('catalog');
                                setSearchQuery(opportunity.requiredTrainings[0].name);
                              }}
                              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Voir la formation
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Catalog View */}
            {activeView === 'catalog' && (
              <div className="space-y-6">
                {/* Search and Filters */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher une formation, un métier, un organisme..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <select
                      value={filters.domain || ''}
                      onChange={(e) => setFilters({ ...filters, domain: e.target.value || undefined })}
                      className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    >
                      <option value="">Tous les domaines</option>
                      {availableDomains.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filters.level || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFilters({ 
                          ...filters, 
                          level: value ? value as TrainingLevel : undefined 
                        });
                      }}
                      className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    >
                      <option value="">Tous les niveaux</option>
                      <option value="CAP">CAP</option>
                      <option value="BAC_PRO">Bac Pro</option>
                      <option value="BTS">BTS</option>
                      <option value="LICENCE">Licence</option>
                      <option value="MASTER">Master</option>
                      <option value="CERTIFICAT">Certificat</option>
                    </select>

                    <select
                      value={filters.mode || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFilters({ 
                          ...filters, 
                          mode: value ? value as TrainingMode : undefined 
                        });
                      }}
                      className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    >
                      <option value="">Tous les modes</option>
                      <option value="presentiel">Présentiel</option>
                      <option value="distanciel">Distanciel</option>
                      <option value="hybride">Hybride</option>
                    </select>

                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.cpfEligible || false}
                        onChange={(e) => setFilters({ ...filters, cpfEligible: e.target.checked || undefined })}
                        className="w-4 h-4"
                      />
                      <span>CPF uniquement</span>
                    </label>
                  </div>
                </div>

                {/* Training List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredTrainings.map((training) => (
                    <div
                      key={training.id}
                      className={`bg-slate-800 rounded-lg p-6 border transition-all ${
                        selectedTrainings.includes(training.id)
                          ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {training.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {training.organisme.name}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleTrainingSelection(training.id)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            selectedTrainings.includes(training.id)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                          }`}
                        >
                          {selectedTrainings.includes(training.id) ? 'Sélectionné' : 'Comparer'}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-xs">
                          {training.details.domain}
                        </span>
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                          {training.details.level}
                        </span>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {training.details.mode}
                        </span>
                        {training.pricing.cpfEligible && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            CPF
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span>{training.details.durationWeeks} semaines</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Euro className="w-4 h-4" />
                          <span>{training.pricing.catalogPrice}€</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin className="w-4 h-4" />
                          <span>{training.location.commune}</span>
                        </div>
                        {training.outcomes.insertionRate6M !== undefined && (
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span>{training.outcomes.insertionRate6M}% insertion</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-700 pt-4">
                        <div className="text-sm font-medium text-gray-400 mb-2">
                          Métiers visés:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {training.outcomes.jobs.slice(0, 3).map((job, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-slate-700 text-gray-300 rounded text-xs"
                            >
                              {job}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredTrainings.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Aucune formation trouvée</p>
                    <p className="text-sm mt-2">Essayez de modifier vos critères de recherche</p>
                  </div>
                )}
              </div>
            )}

            {/* Comparison View */}
            {activeView === 'comparison' && selectedTrainings.length > 0 && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Comparaison des formations
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">
                            Critère
                          </th>
                          {selectedTrainings.map((id) => {
                            const training = trainings.find((t) => t.id === id);
                            return (
                              <th key={id} className="px-4 py-3 text-left text-white font-medium">
                                {training?.name}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-700">
                          <td className="px-4 py-3 text-gray-400">Organisme</td>
                          {selectedTrainings.map((id) => {
                            const training = trainings.find((t) => t.id === id);
                            return (
                              <td key={id} className="px-4 py-3 text-white">
                                {training?.organisme.name}
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="px-4 py-3 text-gray-400">Prix</td>
                          {selectedTrainings.map((id) => {
                            const training = trainings.find((t) => t.id === id);
                            return (
                              <td key={id} className="px-4 py-3 text-white">
                                {training?.pricing.catalogPrice}€
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="px-4 py-3 text-gray-400">Durée</td>
                          {selectedTrainings.map((id) => {
                            const training = trainings.find((t) => t.id === id);
                            return (
                              <td key={id} className="px-4 py-3 text-white">
                                {training?.details.durationWeeks} semaines
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="px-4 py-3 text-gray-400">Mode</td>
                          {selectedTrainings.map((id) => {
                            const training = trainings.find((t) => t.id === id);
                            return (
                              <td key={id} className="px-4 py-3 text-white">
                                {training?.details.mode}
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="px-4 py-3 text-gray-400">CPF</td>
                          {selectedTrainings.map((id) => {
                            const training = trainings.find((t) => t.id === id);
                            return (
                              <td key={id} className="px-4 py-3 text-white">
                                {training?.pricing.cpfEligible ? (
                                  <span className="text-green-400">✓ Oui</span>
                                ) : (
                                  <span className="text-red-400">✗ Non</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-b border-slate-700">
                          <td className="px-4 py-3 text-gray-400">Taux insertion 6M</td>
                          {selectedTrainings.map((id) => {
                            const training = trainings.find((t) => t.id === id);
                            return (
                              <td key={id} className="px-4 py-3 text-white">
                                {training?.outcomes.insertionRate6M !== undefined
                                  ? `${training.outcomes.insertionRate6M}%`
                                  : 'N/A'}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-400">Salaire moyen</td>
                          {selectedTrainings.map((id) => {
                            const training = trainings.find((t) => t.id === id);
                            return (
                              <td key={id} className="px-4 py-3 text-white">
                                {training?.outcomes.averageSalary
                                  ? `${training.outcomes.averageSalary}€/mois`
                                  : 'N/A'}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TrainingComparator;
