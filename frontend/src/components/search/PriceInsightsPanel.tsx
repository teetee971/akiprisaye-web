import { lazy, Suspense, useMemo } from 'react';
import type { ScanData } from '../../types/scanHubResult';
import {
  computeReliability,
  type PriceObservationSource,
} from '../../utils/priceReliability';

const Sparkline = lazy(() => import('../Sparkline'));

interface PriceInsightsPanelProps {
  result: ScanData;
}

function formatDate(value?: string) {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return date.toLocaleDateString('fr-FR');
}

const RELIABILITY_LABELS = {
  faible: {
    label: '🔴 Fiabilité faible',
    tone: 'text-rose-200 bg-rose-500/10 border-rose-500/30',
  },
  moyenne: {
    label: '🟠 Fiabilité moyenne',
    tone: 'text-amber-200 bg-amber-500/10 border-amber-500/30',
  },
  élevée: {
    label: '🟢 Fiabilité élevée',
    tone: 'text-emerald-200 bg-emerald-500/10 border-emerald-500/30',
  },
} as const;

const SOURCE_BADGES: Record<
  PriceObservationSource,
  { label: string; tone: string }
> = {
  open_food_facts: {
    label: '📊 Donnée collaborative',
    tone: 'text-cyan-200 bg-cyan-500/10 border-cyan-500/30',
  },
  open_prices: {
    label: '🏛 Donnée publique',
    tone: 'text-indigo-200 bg-indigo-500/10 border-indigo-500/30',
  },
  user_report: {
    label: '👤 Signalement utilisateur',
    tone: 'text-fuchsia-200 bg-fuchsia-500/10 border-fuchsia-500/30',
  },
};

export default function PriceInsightsPanel({ result }: PriceInsightsPanelProps) {
  const sortedObservations = useMemo(
    () =>
      [...(result.observations ?? [])].sort((a, b) => {
        const aTime = a.observedAt ? new Date(a.observedAt).getTime() : 0;
        const bTime = b.observedAt ? new Date(b.observedAt).getTime() : 0;
        return aTime - bTime;
      }),
    [result.observations]
  );

  const chartValues = sortedObservations.map((observation) => observation.price).slice(-18);
  const reliability = useMemo(
    () => computeReliability(sortedObservations),
    [sortedObservations]
  );
  const reliabilityBadge = RELIABILITY_LABELS[reliability.level];

  return (
    <details className="bg-slate-900/70 border border-slate-700 rounded-2xl p-5" open>
      <summary className="cursor-pointer text-white font-semibold">Détails des observations</summary>
      <div className="mt-4 space-y-4 text-sm">
        <div className="bg-slate-950 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs border rounded-lg px-2.5 py-1 ${reliabilityBadge.tone}`}
              title="Score basé sur fraîcheur, nombre d'observations et cohérence des prix."
            >
              {reliabilityBadge.label}
            </span>
            <span className="text-xs text-slate-400">Score global: {reliability.score}/100</span>
          </div>
          <p className="text-slate-300 mb-2">Mini tendance des prix</p>
          <Suspense fallback={<div className="h-8 w-full animate-pulse bg-slate-800 rounded" />}>
            <Sparkline data={chartValues} width={320} height={40} stroke="#38bdf8" />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 rounded-lg p-4">
            <p className="text-slate-300">Fraîcheur</p>
            <p className="text-xl font-semibold mt-1">{reliability.freshnessScore}/100</p>
          </div>
          <div className="bg-slate-950 rounded-lg p-4">
            <p className="text-slate-300">Volume</p>
            <p className="text-xl font-semibold mt-1">{reliability.volumeScore}/100</p>
          </div>
          <div className="bg-slate-950 rounded-lg p-4">
            <p className="text-slate-300">Cohérence</p>
            <p className="text-xl font-semibold mt-1">{reliability.stabilityScore}/100</p>
          </div>
          <div className="bg-slate-950 rounded-lg p-4">
            <p className="text-slate-300">Source</p>
            <p className="text-xl font-semibold mt-1">{reliability.sourceScore}/100</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.values(SOURCE_BADGES).map((sourceBadge) => (
            <span
              key={sourceBadge.label}
              className={`text-xs border rounded-lg px-2.5 py-1 ${sourceBadge.tone}`}
            >
              {sourceBadge.label}
            </span>
          ))}
        </div>

        <ul className="space-y-2">
          {sortedObservations.length === 0 ? (
            <li className="text-slate-400">Aucune observation détaillée disponible.</li>
          ) : (
            sortedObservations.map((observation, index) => {
              const sourceBadge = SOURCE_BADGES[observation.source];
              return (
                <li key={`${observation.source}-${observation.observedAt ?? index}`} className="bg-slate-950 rounded-lg p-3">
                  <p className="text-slate-200">{observation.price.toFixed(2)}€</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(observation.observedAt)}
                  </p>
                  <span className={`inline-block mt-1 text-[11px] border rounded px-2 py-0.5 ${sourceBadge.tone}`}>
                    {sourceBadge.label}
                  </span>
                </li>
              );
            })
          )}
        </ul>

        <details className="bg-slate-950 rounded-lg p-4">
          <summary className="cursor-pointer font-semibold text-slate-100">
            Comment sont calculés les prix ?
          </summary>
          <ul className="mt-3 list-disc list-inside text-slate-300 space-y-1">
            <li>Filtrage des valeurs aberrantes (outliers).</li>
            <li>Pondération par fraîcheur des observations.</li>
            <li>Pondération par fiabilité de la source (publique/collaborative/signalement).</li>
          </ul>
        </details>
      </div>
    </details>
  );
}
