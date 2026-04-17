/**
 * CompetitorScoreCard.tsx — Compact retailer score card for comparison pages.
 */

import { formatEur } from '../../utils/currency';

interface CompetitorScoreCardProps {
  retailer: string;
  avgPrice: number;
  minPrice: number;
  winRatio: number; // 0-1
  topCategory: string;
  territory: string;
  retailerUrl: string | null;
  isWinner: boolean;
}

export default function CompetitorScoreCard({
  retailer,
  avgPrice,
  minPrice,
  winRatio,
  topCategory,
  retailerUrl,
  isWinner,
}: CompetitorScoreCardProps) {
  const winPct = Math.round(winRatio * 100);

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border p-5 transition ${
        isWinner ? 'border-emerald-400/40 bg-emerald-400/[0.05]' : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className={`text-lg font-extrabold ${isWinner ? 'text-emerald-400' : 'text-white'}`}>
          {retailer}
        </h3>
        {isWinner && (
          <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
            🏆 Moins cher
          </span>
        )}
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Prix min</p>
          <p className="text-xl font-extrabold tabular-nums text-white">{formatEur(minPrice)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Prix moyen</p>
          <p className="text-xl font-extrabold tabular-nums text-zinc-300">{formatEur(avgPrice)}</p>
        </div>
      </div>

      {/* Win ratio bar */}
      <div>
        <div className="mb-1 flex justify-between text-[10px] text-zinc-500">
          <span>Moins cher sur</span>
          <span className="font-bold text-zinc-300">{winPct}% des catégories</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full rounded-full transition-all ${
              isWinner ? 'bg-emerald-400' : 'bg-zinc-500'
            }`}
            style={{ width: `${winPct}%` }}
          />
        </div>
      </div>

      {/* Top category */}
      <p className="text-xs text-zinc-400">
        <span className="font-semibold text-zinc-200">Meilleur rayon :</span> {topCategory}
      </p>

      {/* CTA */}
      {retailerUrl && (
        <a
          href={retailerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto rounded-lg border border-emerald-400/30 bg-emerald-400/10 py-2 text-center text-xs font-extrabold uppercase tracking-wide text-emerald-300 transition hover:bg-emerald-400/20"
        >
          VOIR LES OFFRES →
        </a>
      )}
    </div>
  );
}
