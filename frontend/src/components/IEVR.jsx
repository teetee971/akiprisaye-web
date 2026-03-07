 
/**
 * IEVR (Indice d'Écart de Vie Réelle) Component
 * 
 * Displays the Real Life Cost Gap Index for DOM-COM territories.
 * This is a citizen indicator that measures how difficult it is to live
 * in a territory compared to a reference zone.
 * 
 * Features:
 * - Visual score gauge (0-100)
 * - Category breakdown
 * - Temporal comparison
 * - Auto-generated neutral explanations
 */

import { useState, useEffect } from 'react';
import ievrData from '../data/ievr-data.json';
import {
  compareToReference,
  calculateEvolution,
  generateExplanation,
  getScoreColor,
  getTrendIcon,
  validateIEVRData,
  getTerritoryStatus,
} from '../utils/ievrCalculations.js';

export function IEVR({ selectedTerritory = null }) {
  const [territory, setTerritory] = useState(selectedTerritory || 'GP');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Validate data structure
      validateIEVRData(ievrData);
      setData(ievrData);
      setError(null);
    } catch (err) {
      console.error('IEVR data validation error:', err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (selectedTerritory) {
      setTerritory(selectedTerritory);
    }
  }, [selectedTerritory]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">
          ⚠️ Erreur de chargement des données IEVR : {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const territoryData = data.territories[territory];
  if (!territoryData) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          ⚠️ Territoire non trouvé : {territory}
        </p>
      </div>
    );
  }

  const referenceScore = data.metadata.referenceScore;
  const currentScore = territoryData.current.score;
  const comparison = compareToReference(currentScore, referenceScore);
  const explanation = generateExplanation(territoryData.name, currentScore, referenceScore);
  const territoryStatus = getTerritoryStatus(currentScore);

  // Evolution calculations
  const previousMonthScore = territoryData.history[0]?.score;
  const previousYearScore = territoryData.history[1]?.score;
  const monthEvolution = calculateEvolution(currentScore, previousMonthScore);
  const yearEvolution = calculateEvolution(currentScore, previousYearScore);

  // Get available territories for selector
  const territories = Object.entries(data.territories).map(([code, t]) => ({
    code,
    name: t.name,
    flag: t.flag,
  }));

  return (
    <div className="space-y-6">
      {/* Critical Data Warning */}
      {data.metadata.dataStatus !== 'OFFICIEL' && (
        <DataSourceWarning 
          dataStatus={data.metadata.dataStatus}
          requiredSources={data.metadata.requiredSources}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">
            🧠 Indice d'Écart de Vie Réelle (IEVR)
          </h2>
          <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-mono">
            {data.metadata.officialId}
          </span>
        </div>
        <p className="text-blue-50">
          Ce que la vie coûte vraiment, là où vous vivez.
        </p>
        <p className="text-blue-100 text-sm mt-2">
          📋 Méthodologie {data.metadata.methodologyVersion} • Référence nationale : {data.metadata.reference}
        </p>
      </div>

      {/* Territory Selector */}
      <div>
        <label htmlFor="territory-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sélectionner un territoire
        </label>
        <select
          id="territory-select"
          value={territory}
          onChange={(e) => setTerritory(e.target.value)}
          className="w-full md:w-auto bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {territories.map((t) => (
            <option key={t.code} value={t.code}>
              {t.flag} {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Main Score Card */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl">{territoryData.flag}</span>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {territoryData.name}
            </h3>
          </div>

          {/* Score Gauge */}
          <div className="relative w-48 h-48 mx-auto mb-4">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
                className="dark:stroke-gray-700"
              />
              {/* Score arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={getScoreColor(currentScore)}
                strokeWidth="8"
                strokeDasharray={`${(currentScore / 100) * 251.2} 251.2`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold" style={{ color: getScoreColor(currentScore) }}>
                {currentScore}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                sur 100
              </div>
            </div>
          </div>

          {/* Explanation */}
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-4">
            {explanation}
          </p>

          {/* Territory Status Badge */}
          <div 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-lg"
            style={{ 
              backgroundColor: `${territoryStatus.color}20`,
              color: territoryStatus.color,
              border: `2px solid ${territoryStatus.color}`,
            }}
          >
            <span className="text-2xl">{territoryStatus.icon}</span>
            <span>{territoryStatus.label}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {territoryStatus.description}
          </p>
        </div>

        {/* Comparison to Reference */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              Écart avec {data.metadata.reference}
            </span>
            <span className={`text-xl font-bold ${
              comparison.difference < 0 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
            }`}>
              {comparison.difference > 0 ? '+' : ''}{comparison.difference} points
            </span>
          </div>
        </div>

        {/* Temporal Evolution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              vs mois précédent
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getTrendIcon(monthEvolution.trend)}</span>
              <span className={`text-lg font-semibold ${
                monthEvolution.change > 0
                  ? 'text-green-600 dark:text-green-400'
                  : monthEvolution.change < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
              }`}>
                {monthEvolution.change > 0 ? '+' : ''}{monthEvolution.change}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({monthEvolution.trend})
              </span>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              vs année précédente
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getTrendIcon(yearEvolution.trend)}</span>
              <span className={`text-lg font-semibold ${
                yearEvolution.change > 0
                  ? 'text-green-600 dark:text-green-400'
                  : yearEvolution.change < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
              }`}>
                {yearEvolution.change > 0 ? '+' : ''}{yearEvolution.change}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({yearEvolution.trend})
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Status History */}
      {territoryData.history && territoryData.history.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📅 Historique des statuts
          </h3>
          <div className="space-y-3">
            {[
              { date: territoryData.current.date, score: currentScore, status: territoryStatus.level },
              ...territoryData.history,
            ].map((entry, index) => {
              const entryStatus = index === 0 ? territoryStatus : getTerritoryStatus(entry.score);
              const date = new Date(entry.date);
              
              return (
                <div 
                  key={`${entry.date}-${index}`}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">
                      {date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{entryStatus.icon}</span>
                      <span className="font-semibold" style={{ color: entryStatus.color }}>
                        {entryStatus.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: entryStatus.color }}>
                      {entry.score}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      IEVR
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Category Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📊 Détail par catégorie
        </h3>
        <div className="space-y-4">
          {Object.entries(data.categories).map(([key, category]) => {
            const categoryScore = territoryData.current.categories[key];
            const percentage = (category.weight * 100).toFixed(0);
            
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {category.label}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      (pondération: {percentage}%)
                    </span>
                  </div>
                  <span className="text-lg font-bold" style={{ color: getScoreColor(categoryScore) }}>
                    {categoryScore}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${categoryScore}%`,
                      backgroundColor: getScoreColor(categoryScore),
                    }}
                  />
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {category.description}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Methodology Note */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          📝 Méthodologie officielle
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            <strong>Identifiant :</strong> {data.metadata.officialId}
          </p>
          <p>
            L'IEVR est un indicateur synthétique calculé à partir de 5 catégories de coûts incompressibles,
            avec des pondérations fixes et vérifiables.
          </p>
          <p>
            <strong>Score de référence :</strong> {data.metadata.reference} = {referenceScore}
          </p>
          <p>
            <strong>Pondérations :</strong> Alimentation (40%), Hygiène (15%), Transport (15%), Énergie (15%), Autres (15%)
          </p>
          <p>
            <strong>Principe :</strong> Plus le score est bas, plus la vie est difficile avec un revenu standard.
          </p>
          <p className="text-xs pt-2 border-t border-gray-300 dark:border-gray-600">
            Version {data.metadata.version} • Dernière mise à jour : {data.metadata.lastUpdate}
            {data.metadata.methodologyLocked && ' • 🔒 Méthodologie verrouillée'}
          </p>
          <p className="text-xs">
            📄 <a 
              href="/METHODOLOGIE_IEVR_v1.0.md" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Consulter la méthodologie complète (v{data.metadata.methodologyVersion})
            </a>
          </p>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          ℹ️ Cet indicateur fournit une mesure factuelle basée sur des données chiffrées.
          Aucune enseigne n'est citée, aucune accusation n'est portée.
          Les calculs sont transparents et vérifiables dans le code source.
        </p>
      </div>
    </div>
  );
}

export default IEVR;
