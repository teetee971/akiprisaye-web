import type { PriceReliability } from '../../services/priceSearch/priceReliability';

type PriceInsightsPanelProps = {
  reliability: PriceReliability;
};

const CONFIDENCE_LABELS: Record<PriceReliability['confidenceLevel'], string> = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
};

export function PriceInsightsPanel({ reliability }: PriceInsightsPanelProps) {
  const tooltipText =
    'Les estimations sont calculées à partir de données publiques et déclaratives. Fiabilité basée sur fraîcheur, volume et cohérence.';

  return (
    <aside
      className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
      aria-label="Indicateurs de fiabilité"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">Insights observatoire</h3>
        <span
          className="cursor-help text-xs text-slate-600"
          title={tooltipText}
          aria-label={tooltipText}
        >
          ℹ️ Méthodologie
        </span>
      </div>

      {reliability.lowData && (
        <div className="mb-3 inline-flex rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-900">
          Données insuffisantes
        </div>
      )}

      <dl className="grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-3">
        <div>
          <dt className="font-medium">Nombre d'observations</dt>
          <dd>{reliability.count}</dd>
        </div>
        <div>
          <dt className="font-medium">Intervalle min / max</dt>
          <dd>
            {reliability.min != null && reliability.max != null
              ? `${reliability.min.toFixed(2)}€ / ${reliability.max.toFixed(2)}€`
              : 'Non disponible'}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Niveau de confiance</dt>
          <dd>{CONFIDENCE_LABELS[reliability.confidenceLevel]}</dd>
        </div>
      </dl>
    </aside>
  );
}
