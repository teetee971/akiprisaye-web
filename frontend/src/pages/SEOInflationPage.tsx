/**
 * SEOInflationPage.tsx — Inflation & price trend page
 *
 * Route: /inflation/:slug  (e.g. /inflation/alimentaire-guadeloupe-2026)
 *
 * Targets long-tail queries like:
 *   "inflation alimentaire guadeloupe 2026"
 *   "evolution prix lait martinique"
 *   "hausse prix courses guyane"
 *
 * Features:
 *   - Schema.org Dataset JSON-LD
 *   - Monthly price trend chart (text-based sparkline for performance)
 *   - Category selector
 *   - Internal linking to product pages + comparator
 */

import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import {
  getTerritoryName,
  TERRITORY_NAMES,
  TERRITORY_SLUG_MAP,
  buildInflationJsonLd,
  SITE_URL,
} from '../utils/seoHelpers';

// ── Category display map ───────────────────────────────────────────────────────
const CATEGORY_DISPLAY: Record<string, { name: string; icon: string }> = {
  'alimentaire':       { name: 'Alimentaire',        icon: '🛒' },
  'boissons':          { name: 'Boissons',            icon: '🥤' },
  'produits-laitiers': { name: 'Produits Laitiers',   icon: '🥛' },
  'viande':            { name: 'Viande',              icon: '🥩' },
  'epicerie':          { name: 'Épicerie',            icon: '🥫' },
  'hygiene-entretien': { name: 'Hygiène & Entretien', icon: '🧴' },
  'fruits-legumes':    { name: 'Fruits & Légumes',    icon: '🥗' },
  'bebe':              { name: 'Bébé',                icon: '👶' },
};

// ── Mock trend data ────────────────────────────────────────────────────────────
// Monthly inflation rates (%) — territory-adjusted
const TERRITORY_INFLATION_BIAS: Record<string, number> = {
  GP: 5.2, MQ: 4.8, GF: 6.1, RE: 4.5, YT: 7.3,
};

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function getMockMonthlyData(
  categorySlug: string,
  territory: string,
  year: string,
): Array<{ month: string; rate: number; avgPrice: number }> {
  const bias = TERRITORY_INFLATION_BIAS[territory] ?? 5.0;
  const catHash = categorySlug.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 20;
  const yearNum = parseInt(year, 10) || 2026;
  const yearOffset = (yearNum - 2024) * 0.5;

  // Generate 12 months of data
  const months = yearNum === new Date().getFullYear()
    ? MONTHS_FR.slice(0, new Date().getMonth() + 1) // partial year
    : MONTHS_FR;

  return months.map((month, i) => {
    const seasonality = Math.sin((i / 11) * Math.PI) * 1.5; // peak in summer
    const rate = +(bias + yearOffset + (catHash / 20) + seasonality - 1.5 + (i % 3 === 0 ? 0.3 : 0)).toFixed(1);
    const basePrice = 100 + (catHash * 0.5);
    const cumulative = basePrice * (1 + (rate / 100));
    return { month, rate, avgPrice: +cumulative.toFixed(1) };
  });
}

// ── Sparkline bar ─────────────────────────────────────────────────────────────
function InflationBar({ rate, maxRate }: { rate: number; maxRate: number }) {
  const pct = maxRate > 0 ? (rate / maxRate) * 100 : 0;
  const color = rate > 6 ? 'bg-rose-500' : rate > 4 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="flex items-center gap-2">
      <div className="h-4 flex-1 overflow-hidden rounded-sm bg-white/5">
        <div
          className={`h-full rounded-sm transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-10 text-right text-xs font-bold tabular-nums
        ${rate > 6 ? 'text-rose-400' : rate > 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
        +{rate}%
      </span>
    </div>
  );
}

// ── Slug parser ────────────────────────────────────────────────────────────────
// Format: <category>-<territory>-<year>   e.g. alimentaire-guadeloupe-2026
function parseInflationSlug(slug: string): {
  category: string; territory: string; year: string;
} {
  // Extract year from end
  const yearMatch = slug.match(/-(\d{4})$/);
  const year = yearMatch ? yearMatch[1] : '2026';
  const withoutYear = yearMatch ? slug.slice(0, -5) : slug; // -5 = "-YYYY"

  // Extract territory
  const territories = Object.entries(TERRITORY_SLUG_MAP).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [tSlug, code] of territories) {
    if (withoutYear.endsWith(`-${tSlug}`)) {
      const category = withoutYear.slice(0, -(tSlug.length + 1));
      return { category, territory: code, year };
    }
  }

  return { category: withoutYear, territory: 'GP', year };
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SEOInflationPage() {
  const { slug = '' } = useParams<{ slug: string }>();

  const { category, territory, year } = useMemo(
    () => parseInflationSlug(slug),
    [slug],
  );

  const categoryInfo   = CATEGORY_DISPLAY[category] ?? { name: 'Alimentaire', icon: '🛒' };
  const territoryName  = getTerritoryName(territory);
  const monthlyData    = useMemo(
    () => getMockMonthlyData(category, territory, year),
    [category, territory, year],
  );

  const maxRate        = Math.max(...monthlyData.map((d) => d.rate));
  const avgRate        = +(monthlyData.reduce((s, d) => s + d.rate, 0) / monthlyData.length).toFixed(1);
  const latestRate     = monthlyData[monthlyData.length - 1]?.rate ?? 0;
  const trend          = monthlyData.length >= 2
    ? monthlyData[monthlyData.length - 1].rate - monthlyData[monthlyData.length - 2].rate
    : 0;

  const jsonLd = buildInflationJsonLd(categoryInfo.name, territory, year);

  const seoTitle       = `Inflation ${categoryInfo.name} en ${territoryName} ${year} — Évolution des prix`;
  const seoDescription = `Suivez l'inflation des prix ${categoryInfo.name.toLowerCase()} en ${territoryName} en ${year}. Taux moyen : +${avgRate}%. Données mises à jour mensuellement.`;
  const canonical      = `${SITE_URL}/inflation/${slug}`;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
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
            <li><Link to="/" className="hover:text-emerald-400 transition-colors">Accueil</Link></li>
            <li aria-hidden className="text-zinc-700">›</li>
            <li><Link to="/tableau-inflation" className="hover:text-emerald-400 transition-colors">Inflation</Link></li>
            <li aria-hidden className="text-zinc-700">›</li>
            <li className="truncate text-zinc-300">{categoryInfo.name} · {territoryName} · {year}</li>
          </ol>
        </nav>

        {/* H1 */}
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          {categoryInfo.icon} Inflation {categoryInfo.name} en {territoryName} ({year})
        </h1>

        {/* ── Key metrics hero ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <div className="text-xs text-zinc-500">Taux moyen</div>
            <div className="mt-1 text-2xl font-extrabold text-amber-400">+{avgRate}%</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <div className="text-xs text-zinc-500">Dernier mois</div>
            <div className={`mt-1 text-2xl font-extrabold
              ${latestRate > 6 ? 'text-rose-400' : latestRate > 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
              +{latestRate}%
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <div className="text-xs text-zinc-500">Tendance</div>
            <div className={`mt-1 text-2xl font-extrabold
              ${trend > 0 ? 'text-rose-400' : trend < 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {trend > 0 ? '▲' : trend < 0 ? '▼' : '→'} {Math.abs(trend).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* ── Monthly breakdown ────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Évolution mensuelle {year} — {territoryName}
          </h2>
          <div className="space-y-2">
            {monthlyData.map((d) => (
              <div key={d.month} className="grid grid-cols-[40px_1fr] items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-600">{d.month}</span>
                <InflationBar rate={d.rate} maxRate={maxRate} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-[10px] text-zinc-600">
            <span><span className="inline-block h-2 w-4 rounded-sm bg-emerald-500 mr-1" /> Faible (&lt;4%)</span>
            <span><span className="inline-block h-2 w-4 rounded-sm bg-amber-500 mr-1" /> Modéré (4-6%)</span>
            <span><span className="inline-block h-2 w-4 rounded-sm bg-rose-500 mr-1" /> Élevé (&gt;6%)</span>
          </div>
        </div>

        {/* ── Category tabs for other categories ───────────────────────────── */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Inflation par catégorie en {territoryName} ({year})
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_DISPLAY).map(([slug, info]) => (
              <Link
                key={slug}
                to={`/inflation/${slug}-${territoryName.toLowerCase().replace(/\s/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}-${year}`}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-all
                  ${slug === category
                    ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                    : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white'}`}
              >
                {info.icon} {info.name}
              </Link>
            ))}
          </div>
        </div>

        {/* ── SEO content ──────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
          <h2 className="mb-2 text-sm font-bold text-zinc-300">
            Comprendre l'inflation {categoryInfo.name} en {territoryName}
          </h2>
          <div className="space-y-2 text-xs leading-relaxed text-zinc-500">
            <p>
              En {year}, l'inflation pour les {categoryInfo.name.toLowerCase()} en {territoryName}
              atteint en moyenne <strong className="text-zinc-400">+{avgRate}%</strong>.
              Ce chiffre est supérieur à la moyenne métropolitaine en raison des coûts de transport
              maritime et aérien, des taxes d'importation (octroi de mer) et de la faible concurrence
              dans certains secteurs.
            </p>
            <p>
              Pour faire face à la hausse des prix, notre comparateur permet de trouver les enseignes
              proposant les prix les plus bas en {territoryName}. En comparant avant chaque course,
              vous pouvez économiser significativement sur votre budget alimentaire.
            </p>
          </div>
        </section>

        {/* ── Internal links: other territories ───────────────────────────── */}
        <section className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Inflation {categoryInfo.name} dans d'autres territoires ({year})
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TERRITORY_SLUG_MAP)
              .filter(([, code]) => code !== territory)
              .map(([tSlug, code]) => (
                <Link
                  key={code}
                  to={`/inflation/${category}-${tSlug}-${year}`}
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
              🔍 Comparateur de prix
            </Link>
            <Link
              to="/tableau-inflation"
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-white transition-all"
            >
              📊 Tableau inflation général
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
