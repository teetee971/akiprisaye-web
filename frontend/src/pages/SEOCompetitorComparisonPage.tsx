/**
 * SEOCompetitorComparisonPage.tsx — Advanced retailer comparison page.
 * Route: /vs/:slug (e.g. carrefour-vs-leclerc-guadeloupe)
 *
 * Live-only data: no deterministic/mock fallback.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import ConversionStickyBar from '../components/business/ConversionStickyBar';
import InternalLinksSection from '../components/seo/InternalLinksSection';
import CompetitorScoreCard from '../components/seo/CompetitorScoreCard';
import CompetitorComparisonHero from '../components/seo/CompetitorComparisonHero';
import { TERRITORY_NAMES } from '../utils/seoHelpers';
import { buildRetailerUrl } from '../utils/retailerLinks';
import { buildFaqJsonLdFromItems, type FAQItem } from '../utils/seoContentEngine';
import { fetchCompare } from '../services/compare.service';

const RETAILER_DISPLAY: Record<string, string> = {
  carrefour: 'Carrefour',
  leclerc: 'E.Leclerc',
  'super-u': 'Super U',
  'leader-price': 'Leader Price',
  intermarche: 'Intermarché',
  'simply-market': 'Simply Market',
};

const TERRITORY_SLUG_TO_CODE: Record<string, string> = {
  guadeloupe: 'GP',
  martinique: 'MQ',
  guyane: 'GF',
  reunion: 'RE',
  mayotte: 'YT',
};

const CATEGORY_QUERIES = [
  { category: 'Boissons', query: 'jus de fruit' },
  { category: 'Produits laitiers', query: 'yaourt nature' },
  { category: 'Viandes & poissons', query: 'thon en boite' },
  { category: 'Fruits & légumes', query: 'banane' },
  { category: 'Épicerie', query: 'riz basmati' },
  { category: 'Hygiène & entretien', query: 'lessive liquide' },
] as const;

type LiveComparison = {
  avg1: number;
  avg2: number;
  min1: number;
  min2: number;
  winRatio1: number;
  winRatio2: number;
  topCategory1: string;
  topCategory2: string;
  isWinner1: boolean;
  winner: string;
  savings: number;
  categoryWinners: Array<{ category: string; winner: string }>;
  totalProducts: number;
};

function parseSlug(slug: string): {
  retailer1Slug: string;
  retailer2Slug: string;
  territorySlug: string;
} {
  const vsIdx = slug.indexOf('-vs-');
  if (vsIdx === -1) {
    return { retailer1Slug: 'carrefour', retailer2Slug: 'leclerc', territorySlug: 'guadeloupe' };
  }

  const before = slug.slice(0, vsIdx);
  const after = slug.slice(vsIdx + 4);
  const knownTerritories = Object.keys(TERRITORY_SLUG_TO_CODE);

  let territorySlug = 'guadeloupe';
  let retailer2Slug = after;

  for (const t of knownTerritories) {
    if (after.endsWith(`-${t}`)) {
      territorySlug = t;
      retailer2Slug = after.slice(0, after.length - t.length - 1);
      break;
    }
    if (after === t) {
      territorySlug = t;
      retailer2Slug = 'leclerc';
      break;
    }
  }

  return { retailer1Slug: before, retailer2Slug, territorySlug };
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function computeLiveComparison(
  r1Display: string,
  r2Display: string,
  rows: Array<{
    category: string;
    avg1: number | null;
    avg2: number | null;
    min1: number | null;
    min2: number | null;
    count1: number;
    count2: number;
  }>
): LiveComparison | null {
  const validRows = rows.filter((r) => r.avg1 != null && r.avg2 != null);

  if (validRows.length === 0) {
    return null;
  }

  const categoryWinners = rows.map((r) => {
    if (r.avg1 == null || r.avg2 == null)
      return { category: r.category, winner: 'Données insuffisantes' };
    return { category: r.category, winner: r.avg1 <= r.avg2 ? r1Display : r2Display };
  });

  const r1Wins = validRows.filter((r) => (r.avg1 ?? Infinity) <= (r.avg2 ?? Infinity)).length;
  const r2Wins = validRows.length - r1Wins;

  const avg1 = round2(validRows.reduce((sum, r) => sum + (r.avg1 ?? 0), 0) / validRows.length);
  const avg2 = round2(validRows.reduce((sum, r) => sum + (r.avg2 ?? 0), 0) / validRows.length);

  const min1Candidates = validRows.map((r) => r.min1).filter((v): v is number => v != null);
  const min2Candidates = validRows.map((r) => r.min2).filter((v): v is number => v != null);
  const min1 = min1Candidates.length > 0 ? round2(Math.min(...min1Candidates)) : 0;
  const min2 = min2Candidates.length > 0 ? round2(Math.min(...min2Candidates)) : 0;

  const topCategory1 =
    validRows.reduce(
      (best, row) => {
        const diff = (row.avg2 ?? 0) - (row.avg1 ?? 0);
        if (!best || diff > best.diff) return { category: row.category, diff };
        return best;
      },
      null as null | { category: string; diff: number }
    )?.category ?? 'N/A';

  const topCategory2 =
    validRows.reduce(
      (best, row) => {
        const diff = (row.avg1 ?? 0) - (row.avg2 ?? 0);
        if (!best || diff > best.diff) return { category: row.category, diff };
        return best;
      },
      null as null | { category: string; diff: number }
    )?.category ?? 'N/A';

  const isWinner1 = avg1 <= avg2;
  const winner = isWinner1 ? r1Display : r2Display;

  return {
    avg1,
    avg2,
    min1,
    min2,
    winRatio1: round2(r1Wins / validRows.length),
    winRatio2: round2(r2Wins / validRows.length),
    topCategory1,
    topCategory2,
    isWinner1,
    winner,
    savings: round2(Math.abs(avg1 - avg2)),
    categoryWinners,
    totalProducts: rows.reduce((sum, r) => sum + Math.max(r.count1, r.count2), 0),
  };
}

function buildJsonLd(
  r1: string,
  r2: string,
  territory: string,
  slug: string,
  faqItems: FAQItem[]
): Record<string, unknown> {
  const SITE_URL = 'https://teetee971.github.io/akiprisaye-web';
  const pageUrl = `${SITE_URL}/vs/${slug}`;
  const title = `Comparatif ${r1} vs ${r2} en ${territory} 2026`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        inLanguage: 'fr',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Comparateurs', item: `${SITE_URL}/comparer` },
          { '@type': 'ListItem', position: 3, name: title, item: pageUrl },
        ],
      },
      buildFaqJsonLdFromItems(faqItems),
    ],
  };
}

export default function SEOCompetitorComparisonPage() {
  const { slug = 'carrefour-vs-leclerc-guadeloupe' } = useParams<{ slug: string }>();

  const { retailer1Slug, retailer2Slug, territorySlug } = parseSlug(slug);
  const territoryCode = TERRITORY_SLUG_TO_CODE[territorySlug] ?? 'GP';
  const territoryName = TERRITORY_NAMES[territoryCode] ?? territorySlug;

  const r1Display = RETAILER_DISPLAY[retailer1Slug] ?? retailer1Slug;
  const r2Display = RETAILER_DISPLAY[retailer2Slug] ?? retailer2Slug;

  const [state, setState] = useState<{
    status: 'loading' | 'success' | 'error';
    comparison: LiveComparison | null;
  }>({
    status: 'loading',
    comparison: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setState({ status: 'loading', comparison: null });
      try {
        const rows = await Promise.all(
          CATEGORY_QUERIES.map(async ({ category, query }) => {
            const [r1, r2] = await Promise.all([
              fetchCompare({ query, territory: territoryCode, retailer: r1Display }),
              fetchCompare({ query, territory: territoryCode, retailer: r2Display }),
            ]);

            return {
              category,
              avg1: r1.summary.average,
              avg2: r2.summary.average,
              min1: r1.summary.min,
              min2: r2.summary.min,
              count1: r1.summary.count,
              count2: r2.summary.count,
            };
          })
        );

        if (cancelled) return;
        const comparison = computeLiveComparison(r1Display, r2Display, rows);
        if (!comparison) {
          setState({ status: 'error', comparison: null });
          return;
        }
        setState({ status: 'success', comparison });
      } catch {
        if (cancelled) return;
        setState({ status: 'error', comparison: null });
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [r1Display, r2Display, territoryCode]);

  const live = state.comparison;

  const r1Url = buildRetailerUrl(r1Display, 'comparateur-vs');
  const r2Url = buildRetailerUrl(r2Display, 'comparateur-vs');
  const bestUrl = live ? (live.isWinner1 ? r1Url : r2Url) : null;

  const pageTitle = `Comparatif ${r1Display} vs ${r2Display} en ${territoryName} 2026 : qui est vraiment moins cher ?`;

  const faqItems: FAQItem[] = [
    {
      question: `${r1Display} ou ${r2Display} : qui est moins cher en ${territoryName} ?`,
      answer: live
        ? `Notre comparatif live indique que ${live.winner} est moins cher sur la majorité des catégories en ${territoryName}, avec une économie moyenne de ${live.savings.toFixed(2)} € par rapport à l'enseigne concurrente.`
        : `Les données live sont en cours de chargement pour comparer ${r1Display} et ${r2Display} en ${territoryName}.`,
    },
    {
      question: `Quelle est la différence de prix entre ${r1Display} et ${r2Display} en ${territoryName} ?`,
      answer: live
        ? `En ${territoryName}, le prix moyen chez ${r1Display} est de ${live.avg1.toFixed(2)} € contre ${live.avg2.toFixed(2)} € chez ${r2Display} sur un panier de référence. Les écarts varient selon les rayons.`
        : `La différence de prix sera affichée dès réception des données live API.`,
    },
    {
      question: `Les promotions de ${r1Display} et ${r2Display} sont-elles valables en ${territoryName} ?`,
      answer: `Oui, les deux enseignes proposent des promotions spécifiques à leurs magasins en ${territoryName}. Notre observatoire recense les meilleures offres en temps réel pour vous aider à économiser.`,
    },
  ];

  const jsonLd = buildJsonLd(r1Display, r2Display, territoryName, slug, faqItems);

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={`Comparatif complet ${r1Display} vs ${r2Display} en ${territoryName} — prix, rayons, économies.${live ? ` ${live.winner} est moins cher sur ${Math.round(Math.max(live.winRatio1, live.winRatio2) * 100)}% des catégories comparées.` : ''}`}
        canonical={`https://teetee971.github.io/akiprisaye-web/vs/${slug}`}
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-slate-950 px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-4xl space-y-8">
          <nav className="flex items-center gap-2 text-xs text-zinc-600">
            <Link to="/" className="hover:text-zinc-400">
              Accueil
            </Link>
            <span>/</span>
            <Link to="/comparer/carrefour-vs-leclerc-guadeloupe" className="hover:text-zinc-400">
              Comparateurs
            </Link>
            <span>/</span>
            <span className="text-zinc-400">
              {r1Display} vs {r2Display}
            </span>
          </nav>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {state.status === 'loading' ? 'Mise à jour en cours…' : 'Mis à jour via API live'}
          </div>

          {state.status === 'error' && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
              API live indisponible : comparaison momentanément non disponible.
            </div>
          )}

          {live && (
            <>
              <CompetitorComparisonHero
                retailer1={r1Display}
                retailer2={r2Display}
                territory={territoryName}
                winner={live.winner}
                winnerSavings={live.savings}
                totalProductsCompared={live.totalProducts}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <CompetitorScoreCard
                  retailer={r1Display}
                  avgPrice={live.avg1}
                  minPrice={live.min1}
                  winRatio={live.winRatio1}
                  topCategory={live.topCategory1}
                  territory={territoryName}
                  retailerUrl={r1Url}
                  isWinner={live.isWinner1}
                />
                <CompetitorScoreCard
                  retailer={r2Display}
                  avgPrice={live.avg2}
                  minPrice={live.min2}
                  winRatio={live.winRatio2}
                  topCategory={live.topCategory2}
                  territory={territoryName}
                  retailerUrl={r2Url}
                  isWinner={!live.isWinner1}
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <div className="border-b border-white/10 px-5 py-3">
                  <h2 className="text-sm font-bold text-white">Comparaison par rayon</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs font-bold uppercase tracking-wide text-zinc-500">
                      <th className="px-5 py-2.5 text-left">Rayon</th>
                      <th className="px-5 py-2.5 text-left">Enseigne moins chère</th>
                    </tr>
                  </thead>
                  <tbody>
                    {live.categoryWinners.map(({ category, winner: catWinner }) => (
                      <tr key={category} className="border-b border-white/5 last:border-0">
                        <td className="px-5 py-3 text-zinc-300">{category}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                              catWinner === live.winner
                                ? 'bg-emerald-400/15 text-emerald-300'
                                : 'bg-zinc-400/10 text-zinc-400'
                            }`}
                          >
                            {catWinner === live.winner && '🏆 '}
                            {catWinner}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">Questions fréquentes</h2>
            {faqItems.map((item, i) => (
              <details key={i} className="group rounded-xl border border-white/10 bg-white/[0.03]">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-zinc-200">
                  {item.question}
                  <span className="ml-3 shrink-0 text-zinc-500 transition group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <p className="px-5 pb-4 text-sm text-zinc-400">{item.answer}</p>
              </details>
            ))}
          </div>

          <InternalLinksSection
            productSlug="panier-reference"
            productName="Panier de référence"
            territory={territoryCode}
            category="epicerie"
          />
        </div>
      </div>

      <ConversionStickyBar
        bestPrice={live ? Math.min(live.avg1, live.avg2) : null}
        savings={live?.savings ?? null}
        retailer={live?.winner ?? null}
        retailerUrl={bestUrl}
        productName={`${r1Display} vs ${r2Display}`}
        territory={territoryCode}
      />
    </>
  );
}
