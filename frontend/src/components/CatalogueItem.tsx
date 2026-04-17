import React, { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { GlassCard } from './ui/glass-card';
import { CatalogueItemRaw } from '../services/catalogueService';
import { computeComparison } from '../services/comparisonService';
import { computePrediction } from '../services/predictionService';
import { EcartHexagone } from './EcartHexagone';
import { useTiPanier } from '../hooks/useTiPanier';
import { recordHistory } from './HistoryList';

/* ------------------------------------------------------------------ */
/* Nutri-Score / NOVA helpers                                           */
/* ------------------------------------------------------------------ */
const NUTRI_COLORS: Record<string, string> = {
  A: 'bg-green-600',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-600',
};
const NOVA_COLORS: Record<number, string> = {
  1: 'bg-green-600',
  2: 'bg-lime-500',
  3: 'bg-orange-500',
  4: 'bg-red-600',
};

interface NutriInfo {
  nutriScore?: string;
  novaGroup?: number;
  ingredients?: string;
  loaded: boolean;
}

async function fetchNutriInfo(ean: string): Promise<NutriInfo> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json?fields=nutriscore_grade,nova_group,ingredients_text_fr,ingredients_text`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return { loaded: true };
    const data = (await res.json()) as {
      status?: number;
      product?: {
        nutriscore_grade?: string;
        nova_group?: number;
        ingredients_text_fr?: string;
        ingredients_text?: string;
      };
    };
    if (data.status !== 1 || !data.product) return { loaded: true };
    const p = data.product;
    const rawIng = (p.ingredients_text_fr || p.ingredients_text || '').trim();
    return {
      nutriScore: p.nutriscore_grade ? p.nutriscore_grade.toUpperCase() : undefined,
      novaGroup: p.nova_group,
      ingredients: rawIng ? rawIng.slice(0, 280) : undefined,
      loaded: true,
    };
  } catch {
    return { loaded: true };
  }
}

/* ------------------------------------------------------------------ */
/* Props                                                                */
/* ------------------------------------------------------------------ */
type Props = {
  item: CatalogueItemRaw;
  metrics: {
    latestPrice: number | null;
    lastObservationDate: string | null;
    avg7: number | null;
    avg30: number | null;
    percentFrom30: number | null;
    isSignificantDecrease: boolean;
  };
};

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */
export default function CatalogueItem({ item, metrics }: Props) {
  const { addItem } = useTiPanier();
  const [expanded, setExpanded] = useState(false);
  const [nutri, setNutri] = useState<NutriInfo>({ loaded: false });
  const [nutriLoading, setNutriLoading] = useState(false);

  const allObsWithStore = useMemo(() => {
    const observations = (item['observations'] ?? []) as Array<Record<string, unknown>>;
    return observations
      .map((o: Record<string, unknown>) => ({
        ...o,
        store: o['store'] ?? item['store'] ?? 'Inconnu',
      }))
      .filter((o: Record<string, unknown>) => Boolean(o['store']));
  }, [item]);

  const comparison = useMemo(() => computeComparison(allObsWithStore as any), [allObsWithStore]);
  const prediction = useMemo(() => computePrediction(item.observations || []), [item]);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: `${item.id}:${item.store ?? ''}:${item.territory ?? ''}`,
      quantity: 1,
      meta: {
        name: item.name,
        price: metrics.latestPrice ?? '',
        store: item.store,
        territory: item.territory,
      },
    });
    recordHistory({
      id: item.id,
      name: item.name,
      price: metrics.latestPrice ?? '',
      store: item.store,
      territory: item.territory,
    });
  };

  const handleToggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      if (next && !nutri.loaded && !nutriLoading && item.id) {
        setNutriLoading(true);
        fetchNutriInfo(String(item.id))
          .then(setNutri)
          .finally(() => setNutriLoading(false));
      }
      return next;
    });
  }, [item.id, nutri.loaded, nutriLoading]);

  const percent = metrics.percentFrom30;

  /* Retailer URL: may live on the item itself or first observation */
  const retailerUrl: string | undefined =
    (item as any).url ||
    ((item['observations'] as Array<Record<string, unknown>> | undefined)?.[0]?.['url'] as
      | string
      | undefined);

  return (
    <GlassCard className="relative p-0 overflow-hidden">
      {/* ---- Clickable header ---- */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={expanded}
        className="w-full text-left p-4 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{item.name}</h3>
            <div className="text-sm text-gray-400 truncate">
              {item.store} — {item.territory}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-base font-bold text-white mr-1">
              {metrics.latestPrice !== null
                ? `${metrics.latestPrice.toFixed(2)} ${(item as any).currency ?? '€'}`
                : '—'}
            </span>

            {percent !== null &&
              (percent < -1 ? (
                <TrendingDown className="w-4 h-4 text-green-400" aria-label="Prix en baisse" />
              ) : percent > 1 ? (
                <TrendingUp className="w-4 h-4 text-red-400" aria-label="Prix en hausse" />
              ) : null)}

            {prediction.label !== 'Données insuffisantes' && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-indigo-700 text-white text-xs"
                title={prediction.explanation}
              >
                🔮
              </span>
            )}

            {typeof (item as any).ecartPercent === 'number' && (
              <EcartHexagone
                ecartPercent={(item as any).ecartPercent}
                priceRef={(item as any).priceRef}
                size="sm"
              />
            )}

            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </div>
        </div>
      </button>

      {/* ---- Expanded panel ---- */}
      {expanded && (
        <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-3">
          {/* Nutri-Score + NOVA */}
          {nutriLoading && (
            <div className="text-xs text-gray-400">Chargement infos nutritionnelles…</div>
          )}
          {!nutriLoading && nutri.loaded && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {nutri.nutriScore ? (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-xs text-white ${NUTRI_COLORS[nutri.nutriScore] ?? 'bg-gray-500'}`}
                    title="Nutri-Score : qualité nutritionnelle (A = meilleure, E = à éviter)"
                  >
                    Nutri-Score {nutri.nutriScore}
                  </span>
                ) : null}
                {nutri.novaGroup != null ? (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-xs text-white ${NOVA_COLORS[nutri.novaGroup] ?? 'bg-gray-500'}`}
                    title={`NOVA ${nutri.novaGroup} : niveau de transformation (1 = non transformé, 4 = ultra-transformé)`}
                  >
                    NOVA {nutri.novaGroup}
                  </span>
                ) : null}
                {!nutri.nutriScore && nutri.novaGroup == null && (
                  <span className="text-xs text-gray-500">
                    Nutri-Score non disponible pour ce produit
                  </span>
                )}
              </div>

              {nutri.ingredients && (
                <details>
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-200">
                    Ingrédients ▾
                  </summary>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{nutri.ingredients}</p>
                </details>
              )}
            </div>
          )}

          {/* Last observation + trend */}
          <div className="text-xs text-gray-400">
            Dernière obs. :{' '}
            {metrics.lastObservationDate
              ? new Date(metrics.lastObservationDate).toLocaleDateString('fr-FR')
              : '—'}
            {percent !== null && (
              <span
                className={`ml-2 font-medium ${percent < 0 ? 'text-green-300' : 'text-red-300'}`}
              >
                {percent < 0 ? '' : '+'}
                {percent.toFixed(1)}% vs moy. 30j
              </span>
            )}
          </div>

          {/* Price comparison per store */}
          {comparison.list.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">
                Prix par enseigne
              </div>
              <ul className="space-y-1">
                {comparison.list.map((row) => (
                  <li
                    key={row.store}
                    className="flex justify-between items-center text-xs text-gray-200"
                  >
                    <span
                      className={`font-medium ${comparison.best?.store === row.store ? 'text-green-400' : ''}`}
                    >
                      {comparison.best?.store === row.store ? '✓ ' : ''}
                      {row.store}
                    </span>
                    <span
                      className={
                        comparison.best?.store === row.store ? 'text-green-400 font-bold' : ''
                      }
                    >
                      {row.price.toFixed(2)} {(item as any).currency ?? '€'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA row */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-medium transition-colors"
              aria-label={`Ajouter ${item.name} au ti-panier`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Ti-panier
            </button>

            {retailerUrl && (
              <a
                href={retailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs rounded-lg font-medium transition-colors"
                aria-label={`Voir ${item.name} chez ${(item as any).store}`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Voir chez {(item as any).store ?? "l'enseigne"}
              </a>
            )}

            <Link
              to={`/produit/${encodeURIComponent(item.id)}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-medium transition-colors"
              aria-label={`Voir la fiche complète de ${item.name}`}
            >
              Fiche complète →
            </Link>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
