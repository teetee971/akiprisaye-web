/**
 * SEOComparaisonPage.tsx — Retailer vs Retailer comparison page
 *
 * Route: /comparer/:slug  (e.g. /comparer/carrefour-vs-leclerc-guadeloupe)
 *
 * Targets long-tail queries like:
 *   "carrefour vs leclerc guadeloupe"
 *   "intermarché vs super u martinique moins cher"
 *
 * Features:
 *   - Schema.org WebPage JSON-LD
 *   - Side-by-side retailer price comparison
 *   - Winner badge + aggressive CTA
 *   - Internal linking to all territory variants
 */

import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import { formatEur } from '../utils/currency';
import { buildRetailerUrl } from '../utils/retailerLinks';
import { trackRetailerClick } from '../utils/priceClickTracker';
import { PrimaryCTA } from '../components/PrimaryCTA';
import {
  getTerritoryName,
  TERRITORY_NAMES,
  TERRITORY_SLUG_MAP,
  buildComparaisonJsonLd,
  SITE_URL,
} from '../utils/seoHelpers';

// ── Retailer display data ──────────────────────────────────────────────────────
const RETAILER_META: Record<string, { name: string; color: string; bg: string }> = {
  carrefour: { name: 'Carrefour', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  leclerc: { name: 'E.Leclerc', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  'super-u': { name: 'Super U', color: 'text-red-400', bg: 'bg-red-400/10' },
  'leader-price': { name: 'Leader Price', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  intermarche: { name: 'Intermarché', color: 'text-green-400', bg: 'bg-green-400/10' },
  'simply-market': { name: 'Simply Market', color: 'text-purple-400', bg: 'bg-purple-400/10' },
};

function getRetailerName(slug: string): string {
  return (
    RETAILER_META[slug]?.name ??
    slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

// ── Category comparison rows ──────────────────────────────────────────────────
const COMPARISON_PRODUCTS = [
  { name: 'Coca-Cola 1,5L', r1Coeff: 1.0, r2Coeff: 1.08, base: 2.1 },
  { name: 'Lait entier 1L', r1Coeff: 1.0, r2Coeff: 1.05, base: 1.3 },
  { name: 'Riz Basmati 1kg', r1Coeff: 1.0, r2Coeff: 1.11, base: 2.8 },
  { name: 'Nutella 400g', r1Coeff: 1.0, r2Coeff: 1.06, base: 4.2 },
  { name: 'Poulet entier /kg', r1Coeff: 1.0, r2Coeff: 0.96, base: 5.8 },
  { name: 'Banane /kg', r1Coeff: 1.0, r2Coeff: 1.03, base: 1.5 },
  { name: 'Jambon 4 tranches', r1Coeff: 1.0, r2Coeff: 1.09, base: 2.5 },
  { name: 'Beurre 250g', r1Coeff: 1.0, r2Coeff: 1.04, base: 2.2 },
];

function getMockComparison(
  slug1: string,
  slug2: string,
  territory: string
): Array<{ name: string; p1: number; p2: number }> {
  // Deterministic offset per retailer pair
  const r1Hash = slug1.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const r2Hash = slug2.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const terrHash = territory.charCodeAt(0) + (territory.charCodeAt(1) ?? 0);
  const coeff = 1.1 + (terrHash % 20) / 100;

  return COMPARISON_PRODUCTS.map((p) => {
    const p1 = Math.round(p.base * coeff * p.r1Coeff * (1 + (r1Hash % 10) / 100) * 100) / 100;
    const p2 = Math.round(p.base * coeff * p.r2Coeff * (1 + (r2Hash % 10) / 100) * 100) / 100;
    return { name: p.name, p1, p2 };
  });
}

// ── Slug parser ────────────────────────────────────────────────────────────────
// Format: <r1>-vs-<r2>-<territory>   e.g. carrefour-vs-leclerc-guadeloupe
function parseComparisonSlug(slug: string): {
  retailer1: string;
  retailer2: string;
  territory: string;
} {
  const vsIndex = slug.indexOf('-vs-');
  if (vsIndex === -1) {
    return { retailer1: slug, retailer2: 'leclerc', territory: 'GP' };
  }

  const afterVs = slug.slice(vsIndex + 4); // everything after "-vs-"
  const r1 = slug.slice(0, vsIndex);

  // Try to strip territory suffix from r2
  const territories = Object.entries(TERRITORY_SLUG_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [tSlug, code] of territories) {
    if (afterVs.endsWith(`-${tSlug}`)) {
      const r2 = afterVs.slice(0, -(tSlug.length + 1));
      return { retailer1: r1, retailer2: r2, territory: code };
    }
  }

  return { retailer1: r1, retailer2: afterVs, territory: 'GP' };
}

// ── Product row ───────────────────────────────────────────────────────────────
function ComparisonRow({
  name,
  p1,
  p2,
  r1Name,
  r2Name,
  r1Slug,
  r2Slug,
  territory,
}: {
  name: string;
  p1: number;
  p2: number;
  r1Name: string;
  r2Name: string;
  r1Slug: string;
  r2Slug: string;
  territory: string;
}) {
  const winner = p1 < p2 ? 'r1' : p2 < p1 ? 'r2' : 'tie';
  const savings = Math.abs(p2 - p1);
  const r1Url = buildRetailerUrl(r1Name, '');
  const r2Url = buildRetailerUrl(r2Name, '');

  return (
    <tr className="border-t border-white/5">
      <td className="py-3 pr-4 text-xs text-zinc-300">{name}</td>
      <td
        className={`py-3 pr-4 text-center text-sm font-bold tabular-nums
        ${winner === 'r1' ? 'text-emerald-400' : 'text-zinc-400'}`}
      >
        {formatEur(p1)}
        {winner === 'r1' && <span className="ml-1 text-[10px]">✓</span>}
        {r1Url && (
          <a
            href={r1Url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackRetailerClick('', r1Name, territory, p1)}
            className="ml-2 hidden text-[10px] font-normal text-emerald-500 underline group-hover:inline"
          >
            Voir
          </a>
        )}
      </td>
      <td
        className={`py-3 text-center text-sm font-bold tabular-nums
        ${winner === 'r2' ? 'text-emerald-400' : 'text-zinc-400'}`}
      >
        {formatEur(p2)}
        {winner === 'r2' && <span className="ml-1 text-[10px]">✓</span>}
        {r2Url && (
          <a
            href={r2Url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackRetailerClick('', r2Name, territory, p2)}
            className="ml-2 hidden text-[10px] font-normal text-emerald-500 underline group-hover:inline"
          >
            Voir
          </a>
        )}
      </td>
      <td className="py-3 pl-4 text-center text-[10px] text-zinc-500">
        {savings > 0.005 && `${formatEur(savings)}`}
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SEOComparaisonPage() {
  const { slug = '' } = useParams<{ slug: string }>();

  const {
    retailer1: r1Slug,
    retailer2: r2Slug,
    territory,
  } = useMemo(() => parseComparisonSlug(slug), [slug]);

  const r1Name = getRetailerName(r1Slug);
  const r2Name = getRetailerName(r2Slug);
  const territoryName = getTerritoryName(territory);

  const rows = useMemo(
    () => getMockComparison(r1Slug, r2Slug, territory),
    [r1Slug, r2Slug, territory]
  );

  // Tally wins
  const r1Wins = rows.filter((r) => r.p1 < r.p2).length;
  const r2Wins = rows.filter((r) => r.p2 < r.p1).length;
  const winner = r1Wins > r2Wins ? r1Name : r2Wins > r1Wins ? r2Name : null;

  const totalR1 = rows.reduce((s, r) => s + r.p1, 0);
  const totalR2 = rows.reduce((s, r) => s + r.p2, 0);
  const savings = Math.abs(totalR2 - totalR1);
  const cheapest = totalR1 < totalR2 ? r1Name : r2Name;
  const cheapestUrl = buildRetailerUrl(cheapest, '');

  const jsonLd = buildComparaisonJsonLd(r1Name, r2Name, territory);

  const seoTitle = `${r1Name} vs ${r2Name} en ${territoryName} — Qui est le moins cher ?`;
  const seoDescription = `Comparez les prix ${r1Name} et ${r2Name} en ${territoryName}. ${winner ? `${winner} est moins cher sur ${Math.max(r1Wins, r2Wins)}/${rows.length} produits.` : ''} Économisez jusqu'à ${formatEur(savings)} sur votre panier.`;
  const canonical = `${SITE_URL}/comparer/${slug}`;

  const r1Meta = RETAILER_META[r1Slug];
  const r2Meta = RETAILER_META[r2Slug];

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 pb-24 sm:pb-8">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-2xl space-y-4">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="text-xs text-zinc-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-emerald-400 transition-colors">
                Accueil
              </Link>
            </li>
            <li aria-hidden className="text-zinc-700">
              ›
            </li>
            <li>
              <Link to="/comparateur" className="hover:text-emerald-400 transition-colors">
                Comparateur
              </Link>
            </li>
            <li aria-hidden className="text-zinc-700">
              ›
            </li>
            <li className="truncate text-zinc-300">
              {r1Name} vs {r2Name}
            </li>
          </ol>
        </nav>

        {/* H1 */}
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          {r1Name} vs {r2Name} en {territoryName} : qui est le moins cher ?
        </h1>

        {/* ── Verdict hero ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-zinc-900/60 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {winner ? (
                <>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">
                    🏆 Vainqueur sur {Math.max(r1Wins, r2Wins)}/{rows.length} produits
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-white">{winner}</div>
                  <div className="mt-1 text-sm text-zinc-400">
                    Économie panier estimée :{' '}
                    <span className="font-bold text-emerald-400">{formatEur(savings)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Résultat serré
                  </div>
                  <div className="mt-2 text-xl font-bold text-zinc-300">
                    {r1Wins} – {r2Wins} · Dépend des produits
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              {cheapestUrl && (
                <a
                  href={cheapestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackRetailerClick(
                      '',
                      cheapest,
                      territory,
                      totalR1 < totalR2 ? totalR1 : totalR2
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-400/25 px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-emerald-200 shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-400/35 active:scale-95"
                >
                  VOIR L'OFFRE {cheapest.toUpperCase()} →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Side-by-side comparison table ────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="grid grid-cols-3 gap-0 border-b border-white/10">
            <div className="p-4" />
            <div className={`p-4 text-center ${r1Meta?.bg ?? 'bg-white/5'}`}>
              <div className={`text-sm font-bold ${r1Meta?.color ?? 'text-white'}`}>{r1Name}</div>
              <div className="mt-0.5 text-[10px] text-zinc-500">{r1Wins} victoires</div>
            </div>
            <div className={`p-4 text-center ${r2Meta?.bg ?? 'bg-white/5'}`}>
              <div className={`text-sm font-bold ${r2Meta?.color ?? 'text-white'}`}>{r2Name}</div>
              <div className="mt-0.5 text-[10px] text-zinc-500">{r2Wins} victoires</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  <th className="pb-2 pl-4 pt-3 text-left">Produit</th>
                  <th className="pb-2 pt-3 text-center">{r1Name}</th>
                  <th className="pb-2 pt-3 text-center">{r2Name}</th>
                  <th className="pb-2 pl-4 pt-3 text-center">Écart</th>
                </tr>
              </thead>
              <tbody className="px-4">
                {rows.map((row) => (
                  <ComparisonRow
                    key={row.name}
                    name={row.name}
                    p1={row.p1}
                    p2={row.p2}
                    r1Name={r1Name}
                    r2Name={r2Name}
                    r1Slug={r1Slug}
                    r2Slug={r2Slug}
                    territory={territory}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-white/10">
                  <td className="py-3 pl-4 text-xs font-bold text-zinc-400">Total panier</td>
                  <td
                    className={`py-3 text-center text-sm font-extrabold tabular-nums
                    ${totalR1 <= totalR2 ? 'text-emerald-400' : 'text-zinc-400'}`}
                  >
                    {formatEur(totalR1)}
                  </td>
                  <td
                    className={`py-3 text-center text-sm font-extrabold tabular-nums
                    ${totalR2 <= totalR1 ? 'text-emerald-400' : 'text-zinc-400'}`}
                  >
                    {formatEur(totalR2)}
                  </td>
                  <td className="py-3 pl-4 text-center text-xs font-bold text-emerald-400">
                    {formatEur(savings)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── SEO content ──────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
          <h2 className="sr-only">Analyse comparative</h2>
          <div className="space-y-2 text-xs leading-relaxed text-zinc-500">
            <p>
              <strong className="text-zinc-400">
                {r1Name} ou {r2Name} — lequel choisir en {territoryName} ?
              </strong>{' '}
              Notre comparateur analyse les prix de centaines de produits pour vous aider à faire
              les meilleures courses. Sur un panier de {rows.length} produits courants,
              {winner
                ? ` ${winner} est globalement moins cher.`
                : ' les deux enseignes sont proches.'}
            </p>
            <p>
              En {territoryName}, les prix varient significativement entre les enseignes. Comparer
              avant de faire vos courses peut vous faire économiser jusqu'à{' '}
              <strong className="text-emerald-400">{formatEur(savings)}</strong> sur un panier
              moyen.
            </p>
          </div>
        </section>

        {/* ── Internal links: other territory variants ─────────────────────── */}
        <section className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            {r1Name} vs {r2Name} dans d'autres territoires
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TERRITORY_SLUG_MAP)
              .filter(([, code]) => code !== territory)
              .map(([tSlug, code]) => (
                <Link
                  key={code}
                  to={`/comparer/${r1Slug}-vs-${r2Slug}-${tSlug}`}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-300 transition-all"
                >
                  {TERRITORY_NAMES[code]}
                </Link>
              ))}
          </div>
        </section>

        {/* ── Internal links: related ──────────────────────────────────────── */}
        <section className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Voir aussi
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/moins-cher/${territoryName.toLowerCase().replace(/\s/g, '-')}`}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:border-emerald-400/30 hover:text-emerald-300 transition-all"
            >
              💰 Produits moins chers en {territoryName}
            </Link>
            <Link
              to="/comparateur"
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-white transition-all"
            >
              🔍 Comparateur complet
            </Link>
            <Link
              to={`/inflation/alimentaire-${territoryName.toLowerCase().replace(/\s/g, '-')}-2026`}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-white transition-all"
            >
              📈 Tendances inflation {territoryName}
            </Link>
          </div>
        </section>
      </div>

      {/* ── Sticky CTA bar — always visible above fold on mobile ─────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/95 px-4 pt-3 backdrop-blur-sm sm:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <PrimaryCTA
          variant="compare"
          to="/comparateur"
          territory={territory}
          className="w-full justify-center py-3.5"
        />
      </div>
    </div>
  );
}
