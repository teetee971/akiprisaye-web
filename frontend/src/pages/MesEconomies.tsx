import React from 'react';
import { useSavingsData } from '../hooks/useSavingsData';
import SavingsSummaryCard from '../components/dashboard/SavingsSummaryCard';
import SavingsChart from '../components/dashboard/SavingsChart';
import BadgesDisplay from '../components/dashboard/BadgesDisplay';
import SavingsGoal from '../components/dashboard/SavingsGoal';
import { setMonthlyGoal } from '../services/savingsService';
import { addDemoSavingsData } from '../utils/demoSavingsData';

export default function MesEconomies() {
  const {
    stats,
    badges,
    monthlySavings,
    goalProgress,
    data,
    refresh,
    isLoading
  } = useSavingsData();

  const handleUpdateGoal = (newGoal: number) => {
    setMonthlyGoal(newGoal);
    refresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          💰 Mes Économies
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Suivez vos économies réalisées grâce à A KI PRI SA YÉ
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SavingsSummaryCard
          title="Total économisé"
          amount={stats.totalSavings}
          icon="🎉"
          subtitle={`${stats.entriesCount} comparaison${stats.entriesCount > 1 ? 's' : ''}`}
        />
        <SavingsSummaryCard
          title="Ce mois-ci"
          amount={stats.monthSavings}
          icon="📅"
          subtitle={`Objectif: ${data.monthlyGoal}€`}
        />
        <SavingsSummaryCard
          title="Cette semaine"
          amount={stats.weekSavings}
          icon="📊"
        />
      </div>

      {/* Goal Progress */}
      <div className="mb-8">
        <SavingsGoal
          currentAmount={stats.monthSavings}
          goalAmount={data.monthlyGoal}
          progress={goalProgress}
          onUpdateGoal={handleUpdateGoal}
        />
      </div>

      {/* Chart */}
      <div className="mb-8">
        <SavingsChart monthlySavings={monthlySavings} />
      </div>

      {/* Badges */}
      <div className="mb-8">
        <BadgesDisplay badges={badges} />
      </div>

      {/* Additional Stats */}
      {stats.entriesCount > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📈 Statistiques
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Économie moyenne</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageSaving.toFixed(2)}€
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Meilleure économie</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.bestSaving.toFixed(2)}€
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.entriesCount === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Commencez à économiser !
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Utilisez notre comparateur de prix pour trouver les meilleures offres et suivez vos économies ici.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#/comparateur"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Comparer les prix
            </a>
            <button
              onClick={() => {
                addDemoSavingsData();
                refresh();
              }}
              className="inline-block px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Ajouter des données de démo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
