/**
 * CompetitorComparisonHero.tsx — Hero block for retailer comparison pages.
 */

interface CompetitorComparisonHeroProps {
  retailer1: string;
  retailer2: string;
  territory: string;
  winner: string;
  winnerSavings: number; // avg savings vs loser in €
  totalProductsCompared: number;
}

export default function CompetitorComparisonHero({
  retailer1,
  retailer2,
  territory,
  winner,
  winnerSavings,
  totalProductsCompared,
}: CompetitorComparisonHeroProps) {
  const savingsFmt = winnerSavings.toFixed(2) + ' €';

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
      {/* Title */}
      <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
        ⚔️ {retailer1} vs {retailer2}
      </h1>
      <p className="mt-1 text-base text-zinc-400">en {territory}</p>

      {/* Winner badge */}
      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-2">
        <span className="text-base">🏆</span>
        <span className="text-sm font-bold text-emerald-300">
          {winner} est moins cher sur la majorité des produits
        </span>
      </div>

      {/* Savings */}
      <p className="mt-4 text-sm text-zinc-400">
        Économie moyenne : <span className="font-bold text-emerald-400">{savingsFmt}</span> par
        rapport à l'enseigne concurrente
      </p>

      {/* Sub-text */}
      <p className="mt-2 text-xs text-zinc-600">
        Comparaison basée sur {totalProductsCompared} produits du marché
      </p>
    </div>
  );
}
