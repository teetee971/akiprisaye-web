/**
 * ⑬ 🏅 "PREUVE SOCIALE" : SCORE CONFIANCE + COUVERTURE DONNÉES
 * Rassure sur la fiabilité des données
 */

import { useState } from "react";
import { GlassCard } from "../ui/glass-card";
import { calculateConfidenceScore, type DataMetrics } from "../../utils/confidenceScore";

interface DataConfidenceCardProps {
  nbObservations: number;
  nbStores: number;
  lastUpdateDays: number;
  territory?: string;
  territoryStoreCoverage?: number; // 0-100
  className?: string;
}

export function DataConfidenceCard({
  nbObservations,
  nbStores,
  lastUpdateDays,
  territory = "Guadeloupe",
  territoryStoreCoverage = 72,
  className = ""
}: DataConfidenceCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const metrics: DataMetrics = {
    nbObservations,
    nbStores,
    recencyDays: lastUpdateDays
  };

  const score = calculateConfidenceScore(metrics);
  const scoreColor = getScoreColor(score.total);
  const scoreLabel = getScoreLabel(score.total);

  return (
    <GlassCard className={`bg-blue-900/10 border-blue-500/30 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-blue-300">
            🏅 Confiance des données
          </h3>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-xs text-gray-400 hover:text-gray-300 underline"
            aria-expanded={showExplanation}
          >
            Pourquoi ce score ?
          </button>
        </div>

        {/* Score principal */}
        <div className="text-center space-y-2">
          <div className={`text-5xl font-bold ${scoreColor}`}>
            {score.total}<span className="text-2xl">/100</span>
          </div>
          <div className="text-sm text-gray-400">{scoreLabel}</div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-2">
          <div
            className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={score.total}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Score de confiance : ${score.total} sur 100`}
          >
            <div
              className={`h-full transition-all duration-500 ${
                score.total >= 80 ? 'bg-green-500' :
                score.total >= 60 ? 'bg-blue-500' :
                score.total >= 40 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${score.total}%` }}
            />
          </div>
        </div>

        {/* Détails */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">• Relevés de prix</span>
            <span className="font-semibold text-white">{nbObservations}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">• Magasins contributeurs</span>
            <span className="font-semibold text-white">{nbStores}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">• Dernière mise à jour</span>
            <span className="font-semibold text-white">
              il y a {lastUpdateDays} jour{lastUpdateDays > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">• Couverture {territory}</span>
            <span className="font-semibold text-white">{territoryStoreCoverage} %</span>
          </div>
        </div>

        {/* Explication (collapsible) */}
        {showExplanation && (
          <div className="p-3 bg-slate-800/50 rounded-lg space-y-3 text-xs animate-slide-down">
            <div>
              <div className="font-semibold text-blue-300 mb-1">📊 Comment est calculé ce score ?</div>
              <p className="text-gray-400">
                Le score est transparent et basé sur 3 critères objectifs :
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-400 font-bold">{score.obsScore}/50</span>
                <div className="flex-1 text-gray-400">
                  <span className="font-semibold">Nombre d'observations</span>
                  <br />Plus il y a de relevés, plus les données sont fiables
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">{score.storeScore}/25</span>
                <div className="flex-1 text-gray-400">
                  <span className="font-semibold">Magasins couverts</span>
                  <br />Une bonne couverture permet de comparer efficacement
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className={`font-bold ${
                  score.recencyScore >= 20 ? 'text-green-400' :
                  score.recencyScore >= 10 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {score.recencyScore}/25
                </span>
                <div className="flex-1 text-gray-400">
                  <span className="font-semibold">Fraîcheur des données</span>
                  <br />Les prix récents sont plus pertinents
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700">
              <p className="text-gray-500 italic">
                Cette méthode transparente garantit que vous savez toujours sur quoi repose notre confiance.
              </p>
            </div>
          </div>
        )}

        {/* Badge transparence */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 border border-emerald-500/40 rounded-full text-xs text-emerald-200">
            <span>✓</span>
            <span>Données publiques vérifiables</span>
          </span>
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Couleur selon le score
 */
function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

/**
 * Label selon le score
 */
function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellente fiabilité";
  if (score >= 60) return "Bonne fiabilité";
  if (score >= 40) return "Fiabilité acceptable";
  return "Données limitées";
}
