/**
 * SmartSavingsTips
 *
 * Shows actionable savings tips based on real observatoire price data:
 * - Which products have the widest store price gaps (best arbitrage)
 * - Which products are trending cheaper (good to stock up)
 * - Cheapest products in the latest snapshot
 *
 * All data from real observatoire snapshots — no mocks.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, TrendingDown, ShoppingCart, ArrowRight } from 'lucide-react';
import { computePrediction } from '../services/predictionService';
import {
  buildObservatoirePriceSeries,
  KNOWN_OBSERVATOIRE_PRODUCTS,
} from '../services/observatoirePriceSeries';

interface Tip {
  icon: 'deal' | 'trend' | 'stock';
  product: string;
  message: string;
  detail: string;
}

interface SmartSavingsTipsProps {
  territory: string;
  /** Max number of tips to show (default 4) */
  maxTips?: number;
  className?: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
}

const ICON_CONFIG = {
  deal: { bg: 'bg-green-500/15 border-green-500/40', text: 'text-green-300', Icon: ShoppingCart },
  trend: { bg: 'bg-blue-500/15 border-blue-500/40', text: 'text-blue-300', Icon: TrendingDown },
  stock: { bg: 'bg-yellow-500/15 border-yellow-500/40', text: 'text-yellow-300', Icon: Lightbulb },
};

/** Map territory code to observatoire stem */
function toStem(territory: string): string {
  const map: Record<string, string> = {
    gp: 'guadeloupe',
    mq: 'martinique',
    gf: 'guyane',
    re: 'la_réunion',
    yt: 'mayotte',
    fr: 'hexagone',
    guadeloupe: 'guadeloupe',
    martinique: 'martinique',
    guyane: 'guyane',
    reunion: 'la_réunion',
    mayotte: 'mayotte',
    hexagone: 'hexagone',
  };
  return map[territory.toLowerCase()] ?? territory.toLowerCase();
}

/** Map territory stem to display name */
const TERRITORY_DISPLAY: Record<string, string> = {
  guadeloupe: 'Guadeloupe',
  martinique: 'Martinique',
  guyane: 'Guyane',
  la_réunion: 'La Réunion',
  mayotte: 'Mayotte',
  hexagone: 'Hexagone',
};

export default function SmartSavingsTips({
  territory,
  maxTips = 4,
  className = '',
}: SmartSavingsTipsProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const stem = toStem(territory);
  const territoryName = TERRITORY_DISPLAY[stem] ?? territory;

  useEffect(() => {
    let cancelled = false;

    async function buildTips() {
      setLoading(true);
      const generated: Tip[] = [];

      // Fetch multi-month series for all known products (in parallel, up to 6)
      const candidates = KNOWN_OBSERVATOIRE_PRODUCTS.slice(0, 8);
      const seriesList = await Promise.all(
        candidates.map((product) => buildObservatoirePriceSeries(stem, product))
      );

      for (let i = 0; i < candidates.length; i++) {
        const product = candidates[i];
        const series = seriesList[i];
        if (series.length < 2) continue;

        const prices = series.map((o) => o.price);
        const first = prices[0];
        const last = prices[prices.length - 1];
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const spread = max - min;
        const spreadPct = min > 0 ? (spread / min) * 100 : 0;

        // Tip 1: wide spread across time → negotiate / check different stores
        if (spreadPct >= 5 && generated.length < maxTips) {
          generated.push({
            icon: 'deal',
            product,
            message: `Comparez les enseignes pour ${product}`,
            detail: `Écart de ${spreadPct.toFixed(0)}% observé (${formatPrice(min)} → ${formatPrice(max)}) sur les derniers relevés en ${territoryName}.`,
          });
        }

        // Tip 2: falling trend → good time to buy / no need to stock
        const pred = computePrediction(series);
        if (pred.label === 'Baisse probable' && generated.length < maxTips) {
          generated.push({
            icon: 'trend',
            product,
            message: `${product} — tendance à la baisse`,
            detail: `La tendance statistique suggère une poursuite de la baisse. Prix récent : ${formatPrice(last)}. Attendez avant de stocker.`,
          });
        }

        // Tip 3: rising trend → consider stocking at current price
        if (pred.label === 'Hausse probable' && last > 0 && generated.length < maxTips) {
          const delta = ((last - first) / first) * 100;
          if (delta > 2) {
            generated.push({
              icon: 'stock',
              product,
              message: `${product} — hausse en cours (+${delta.toFixed(0)}%)`,
              detail: `Prix passé de ${formatPrice(first)} à ${formatPrice(last)} en ${territoryName}. Constituez un petit stock au prix actuel si possible.`,
            });
          }
        }

        if (generated.length >= maxTips) break;
      }

      if (!cancelled) {
        setTips(generated.slice(0, maxTips));
        setLoading(false);
      }
    }

    void buildTips();
    return () => {
      cancelled = true;
    };
  }, [stem, maxTips, territoryName]);

  if (loading) {
    return (
      <div className={`rounded-2xl border border-slate-700 bg-slate-900/60 p-4 ${className}`}>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
          Analyse des données de l'Observatoire…
        </div>
      </div>
    );
  }

  if (tips.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border border-slate-700 bg-slate-900/70 overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-yellow-400" />
        <h3 className="font-semibold text-sm">Conseils malins — {territoryName}</h3>
        <span className="ml-auto text-xs text-slate-500">Données Observatoire</span>
      </div>
      <div className="divide-y divide-slate-800">
        {tips.map((tip) => {
          const { bg, text, Icon } = ICON_CONFIG[tip.icon];
          return (
            <button
              key={tip.product}
              type="button"
              onClick={() => navigate(`/comparateur?q=${encodeURIComponent(tip.product)}`)}
              className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-lg border ${bg} flex items-center justify-center`}
              >
                <Icon className={`w-4 h-4 ${text}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{tip.message}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{tip.detail}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
            </button>
          );
        })}
      </div>
      <div className="px-4 py-2 border-t border-slate-800">
        <p className="text-xs text-slate-500">
          Basé sur les relevés mensuels de l'Observatoire citoyen · Mis à jour chaque mois
        </p>
      </div>
    </div>
  );
}
