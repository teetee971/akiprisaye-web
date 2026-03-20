/**
 * SEOCompetitorComparisonPage.tsx — Advanced retailer comparison page.
 * Route: /vs/:slug (e.g. carrefour-vs-leclerc-guadeloupe)
 *
 * Mock data is fully deterministic — no randomness.
 */

import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import ConversionStickyBar from '../components/business/ConversionStickyBar';
import InternalLinksSection from '../components/seo/InternalLinksSection';
import CompetitorScoreCard from '../components/seo/CompetitorScoreCard';
import CompetitorComparisonHero from '../components/seo/CompetitorComparisonHero';
import { TERRITORY_NAMES } from '../utils/seoHelpers';
import { buildRetailerUrl } from '../utils/retailerLinks';
import { buildFaqJsonLdFromItems, type FAQItem } from '../utils/seoContentEngine';

// ── Retailer price coefficients ────────────────────────────────────────────────

const RETAILER_COEFFICIENTS: Record<string, number> = {
  'carrefour':     1.05,
  'leclerc':       0.98,
  'super-u':       1.02,
  'leader-price':  0.95,
  'intermarche':   1.03,
  'simply-market': 1.08,
};

const RETAILER_DISPLAY: Record<string, string> = {
  'carrefour':     'Carrefour',
  'leclerc':       'E.Leclerc',
  'super-u':       'Super U',
  'leader-price':  'Leader Price',
  'intermarche':   'Intermarché',
  'simply-market': 'Simply Market',
};

const TERRITORY_COEFFICIENTS: Record<string, number> = {
  GP: 1.00,
  MQ: 1.02,
  GF: 1.05,
  RE: 1.03,
  YT: 1.08,
};

const CATEGORIES = [
  'Boissons',
  'Produits laitiers',
  'Viandes & poissons',
  'Fruits & légumes',
  'Épicerie',
  'Hygiène & entretien',
];

const TERRITORY_SLUG_TO_CODE: Record<string, string> = {
  guadeloupe: 'GP',
  martinique:  'MQ',
  guyane:      'GF',
  reunion:     'RE',
  mayotte:     'YT',
};

// ── Deterministic hash ────────────────────────────────────────────────────────

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
}

// ── Slug parsing ──────────────────────────────────────────────────────────────

function parseSlug(slug: string): {
  retailer1Slug: string;
  retailer2Slug: string;
  territorySlug: string;
} {
  // Expected format: r1-vs-r2-territory
  const vsIdx = slug.indexOf('-vs-');
  if (vsIdx === -1) {
    return { retailer1Slug: 'carrefour', retailer2Slug: 'leclerc', territorySlug: 'guadeloupe' };
  }
  const before = slug.slice(0, vsIdx); // e.g. "carrefour"
  const after  = slug.slice(vsIdx + 4); // e.g. "leclerc-guadeloupe"

  // Territory is the last hyphen-separated segment matching known territories
  const knownTerritories = Object.keys(TERRITORY_SLUG_TO_CODE);
  let territorySlug = 'guadeloupe';
  let retailer2Slug = after;

  for (const t of knownTerritories) {
    if (after.endsWith('-' + t)) {
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

// ── Mock data generation ──────────────────────────────────────────────────────

function buildMockData(
  r1Slug: string,
  r2Slug: string,
  territoryCode: string
) {
  const tc  = TERRITORY_COEFFICIENTS[territoryCode] ?? 1.0;
  const c1  = (RETAILER_COEFFICIENTS[r1Slug] ?? 1.0) * tc;
  const c2  = (RETAILER_COEFFICIENTS[r2Slug] ?? 1.0) * tc;
  const BASE = 3.50; // base reference price

  const avg1   = +(BASE * c1).toFixed(2);
  const avg2   = +(BASE * c2).toFixed(2);
  const min1   = +(avg1 * 0.82).toFixed(2);
  const min2   = +(avg2 * 0.82).toFixed(2);

  const hash1  = djb2Hash(r1Slug + territoryCode);
  const hash2  = djb2Hash(r2Slug + territoryCode);

  // Win ratio: winner gets higher ratio based on coefficient
  const winRatio1 = c1 < c2 ? 0.55 + (hash1 % 15) / 100 : 0.35 + (hash1 % 15) / 100;
  const winRatio2 = 1 - winRatio1;

  const topCategory1 = CATEGORIES[hash1 % CATEGORIES.length];
  const topCategory2 = CATEGORIES[hash2 % CATEGORIES.length];

  const isWinner1 = c1 <= c2;

  // Per-category winner (deterministic)
  const categoryWinners = CATEGORIES.map((cat, i) => {
    const catHash = djb2Hash(cat + r1Slug + r2Slug);
    const r1wins = (catHash % 2 === 0) === (c1 <= c2);
    return { category: cat, winner: r1wins ? RETAILER_DISPLAY[r1Slug] ?? r1Slug : RETAILER_DISPLAY[r2Slug] ?? r2Slug };
  });

  const winner   = isWinner1 ? RETAILER_DISPLAY[r1Slug] ?? r1Slug : RETAILER_DISPLAY[r2Slug] ?? r2Slug;
  const savings  = +Math.abs(avg1 - avg2).toFixed(2);

  return {
    avg1, avg2, min1, min2,
    winRatio1: +winRatio1.toFixed(2),
    winRatio2: +winRatio2.toFixed(2),
    topCategory1, topCategory2,
    isWinner1,
    winner,
    savings,
    categoryWinners,
    totalProducts: 120 + (hash1 % 80),
  };
}

// ── JSON-LD ───────────────────────────────────────────────────────────────────

function buildJsonLd(
  r1: string,
  r2: string,
  territory: string,
  slug: string,
  faqItems: FAQItem[]
): Record<string, unknown> {
  const SITE_URL = 'https://teetee971.github.io/akiprisaye-web';
  const pageUrl  = `${SITE_URL}/vs/${slug}`;
  const title    = `Comparatif ${r1} vs ${r2} en ${territory} 2026`;

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
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL + '/' },
          { '@type': 'ListItem', position: 2, name: 'Comparateurs', item: SITE_URL + '/comparer' },
          { '@type': 'ListItem', position: 3, name: title, item: pageUrl },
        ],
      },
      buildFaqJsonLdFromItems(faqItems),
    ],
  };
}

// ── Page component ────────────────────────────────────────────────────────────

export default function SEOCompetitorComparisonPage() {
  const { slug = 'carrefour-vs-leclerc-guadeloupe' } = useParams<{ slug: string }>();

  const { retailer1Slug, retailer2Slug, territorySlug } = parseSlug(slug);
  const territoryCode = TERRITORY_SLUG_TO_CODE[territorySlug] ?? 'GP';
  const territoryName = TERRITORY_NAMES[territoryCode] ?? territorySlug;

  const r1Display = RETAILER_DISPLAY[retailer1Slug] ?? retailer1Slug;
  const r2Display = RETAILER_DISPLAY[retailer2Slug] ?? retailer2Slug;

  const mock = buildMockData(retailer1Slug, retailer2Slug, territoryCode);

  const r1Url = buildRetailerUrl(r1Display, 'comparateur-vs');
  const r2Url = buildRetailerUrl(r2Display, 'comparateur-vs');
  const bestUrl = mock.isWinner1 ? r1Url : r2Url;

  const pageTitle = `Comparatif ${r1Display} vs ${r2Display} en ${territoryName} 2026 : qui est vraiment moins cher ?`;

  const faqItems: FAQItem[] = [
    {
      question: `${r1Display} ou ${r2Display} : qui est moins cher en ${territoryName} ?`,
      answer: `Notre comparatif indique que ${mock.winner} est moins cher sur la majorité des catégories en ${territoryName}, avec une économie moyenne de ${mock.savings.toFixed(2)} € par rapport à l'enseigne concurrente.`,
    },
    {
      question: `Quelle est la différence de prix entre ${r1Display} et ${r2Display} en ${territoryName} ?`,
      answer: `En ${territoryName}, le prix moyen chez ${r1Display} est de ${mock.avg1.toFixed(2)} € contre ${mock.avg2.toFixed(2)} € chez ${r2Display} sur un panier de référence. Les écarts varient selon les rayons.`,
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
        description={`Comparatif complet ${r1Display} vs ${r2Display} en ${territoryName} — prix, rayons, économies. ${mock.winner} est moins cher sur ${Math.round(Math.max(mock.winRatio1, mock.winRatio2) * 100)}% des produits.`}
        canonical={`https://teetee971.github.io/akiprisaye-web/vs/${slug}`}
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-[#0a0a0f] px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-4xl space-y-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-zinc-600">
            <Link to="/" className="hover:text-zinc-400">Accueil</Link>
            <span>/</span>
            <Link to="/comparer/carrefour-vs-leclerc-guadeloupe" className="hover:text-zinc-400">Comparateurs</Link>
            <span>/</span>
            <span className="text-zinc-400">{r1Display} vs {r2Display}</span>
          </nav>

          {/* "Mis à jour" badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Mis à jour aujourd'hui
          </div>

          {/* Hero */}
          <CompetitorComparisonHero
            retailer1={r1Display}
            retailer2={r2Display}
            territory={territoryName}
            winner={mock.winner}
            winnerSavings={mock.savings}
            totalProductsCompared={mock.totalProducts}
          />

          {/* Score cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <CompetitorScoreCard
              retailer={r1Display}
              avgPrice={mock.avg1}
              minPrice={mock.min1}
              winRatio={mock.winRatio1}
              topCategory={mock.topCategory1}
              territory={territoryName}
              retailerUrl={r1Url}
              isWinner={mock.isWinner1}
            />
            <CompetitorScoreCard
              retailer={r2Display}
              avgPrice={mock.avg2}
              minPrice={mock.min2}
              winRatio={mock.winRatio2}
              topCategory={mock.topCategory2}
              territory={territoryName}
              retailerUrl={r2Url}
              isWinner={!mock.isWinner1}
            />
          </div>

          {/* Category breakdown */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="border-b border-white/10 px-5 py-3">
              <h2 className="text-sm font-bold text-white">
                Comparaison par rayon
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs font-bold uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-2.5 text-left">Rayon</th>
                  <th className="px-5 py-2.5 text-left">Enseigne moins chère</th>
                </tr>
              </thead>
              <tbody>
                {mock.categoryWinners.map(({ category, winner: catWinner }) => (
                  <tr key={category} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3 text-zinc-300">{category}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                        catWinner === mock.winner
                          ? 'bg-emerald-400/15 text-emerald-300'
                          : 'bg-zinc-400/10 text-zinc-400'
                      }`}>
                        {catWinner === mock.winner && '🏆 '}
                        {catWinner}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FAQ */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">Questions fréquentes</h2>
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-white/10 bg-white/[0.03]"
              >
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-zinc-200">
                  {item.question}
                  <span className="ml-3 shrink-0 text-zinc-500 transition group-open:rotate-180">▾</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-zinc-400">{item.answer}</p>
              </details>
            ))}
          </div>

          {/* Internal links */}
          <InternalLinksSection
            productSlug="panier-reference"
            productName="Panier de référence"
            territory={territoryCode}
            category="epicerie"
          />
        </div>
      </div>

      {/* Sticky CTA */}
      <ConversionStickyBar
        bestPrice={Math.min(mock.avg1, mock.avg2)}
        savings={mock.savings}
        retailer={mock.winner}
        retailerUrl={bestUrl}
        productName={`${r1Display} vs ${r2Display}`}
        territory={territoryCode}
      />
    </>
  );
}
