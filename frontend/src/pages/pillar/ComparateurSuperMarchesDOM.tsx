/**
 * ComparateurSuperMarchesDOM.tsx — Comparateur des supermarchés dans les DOM
 *
 * Route: /comparateur-supermarches-dom
 * Pillar page comparing the 5 main retailers across all DOM territories.
 */

import { Link } from 'react-router-dom';
import { SEOHead } from '../../components/ui/SEOHead';
import ConversionStickyBar from '../../components/business/ConversionStickyBar';
import { formatEur } from '../../utils/currency';
import { SITE_URL } from '../../utils/seoHelpers';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline:
    'Comparateur supermarchés DOM-TOM 2026 : Carrefour, Leclerc, Super U, Leader Price, Intermarché',
  description:
    'Comparatif complet des 5 grandes enseignes de supermarché dans les DOM-TOM. Prix moyens, philosophie tarifaire, conseils par territoire.',
  author: { '@type': 'Organization', name: 'A KI PRI SA YÉ' },
  url: `${SITE_URL}/comparateur-supermarches-dom`,
};

// Mock comparison data
const RETAILER_DATA = [
  {
    name: 'E.Leclerc',
    icon: '🏅',
    rank: 1,
    avgBasket: 87.4,
    strengths: ['Meilleur prix global', 'Cartes de fidélité avantageuses', 'Large choix'],
    weaknesses: ['Moins présent à Mayotte', 'Peu de produits locaux'],
    territories: ['GP', 'MQ', 'GF', 'RE'],
    priceIndex: 100,
  },
  {
    name: 'Leader Price',
    icon: '💰',
    rank: 2,
    avgBasket: 89.2,
    strengths: ['Hard-discount', 'Prix plancher sur les basiques', 'Marques propres'],
    weaknesses: ['Gamme limitée', 'Moins de produits frais'],
    territories: ['GP', 'MQ', 'RE'],
    priceIndex: 102,
  },
  {
    name: 'Carrefour',
    icon: '🛒',
    rank: 3,
    avgBasket: 93.6,
    strengths: ['Large gamme', 'Produits bio', 'Click & Collect'],
    weaknesses: ['Prix moyens plus élevés', 'Promos moins fréquentes'],
    territories: ['GP', 'MQ', 'GF', 'RE', 'YT'],
    priceIndex: 107,
  },
  {
    name: 'Super U',
    icon: '🏪',
    rank: 4,
    avgBasket: 95.1,
    strengths: ['Qualité MDD', 'Produits locaux', 'Programmes fidélité'],
    weaknesses: ['Prix légèrement plus élevés', 'Réseau moins dense'],
    territories: ['GP', 'MQ', 'RE'],
    priceIndex: 109,
  },
  {
    name: 'Intermarché',
    icon: '🥩',
    rank: 5,
    avgBasket: 97.8,
    strengths: ['Excellence boucherie', 'Poissonnerie qualité', 'Produits de terroir'],
    weaknesses: ['Prix globalement plus élevés', 'Moins de discount alimentaire'],
    territories: ['GP', 'MQ', 'GF', 'RE'],
    priceIndex: 112,
  },
];

const TERRITORY_ADVICE: Array<{
  code: string;
  name: string;
  slug: string;
  best: string;
  note: string;
}> = [
  {
    code: 'GP',
    name: 'Guadeloupe',
    slug: 'guadeloupe',
    best: 'E.Leclerc',
    note: 'Leclerc Guadeloupe reste le leader sur les prix PGC. Leader Price excellent pour les produits secs.',
  },
  {
    code: 'MQ',
    name: 'Martinique',
    slug: 'martinique',
    best: 'E.Leclerc',
    note: 'Leclerc Martinique très compétitif. Carrefour Fort-de-France bien implanté.',
  },
  {
    code: 'GF',
    name: 'Guyane',
    slug: 'guyane',
    best: 'Carrefour',
    note: "Offre plus limitée en Guyane. Carrefour Cayenne est souvent l'option la plus accessible.",
  },
  {
    code: 'RE',
    name: 'La Réunion',
    slug: 'reunion',
    best: 'E.Leclerc',
    note: 'Marché très concurrentiel à La Réunion. Leclerc et Leader Price se disputent le leadership.',
  },
  {
    code: 'YT',
    name: 'Mayotte',
    slug: 'mayotte',
    best: 'Carrefour',
    note: 'Offre très limitée à Mayotte. Carrefour Mamoudzou est la principale grande surface.',
  },
];

export default function ComparateurSuperMarchesDOM() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 pb-24 sm:pb-8">
      <SEOHead
        title="Comparateur supermarchés DOM-TOM 2026 : Carrefour, Leclerc, Super U, Leader Price"
        description="Comparatif complet des 5 grandes enseignes dans les DOM-TOM. Prix moyens, forces et faiblesses de chaque supermarché en Guadeloupe, Martinique, Guyane, La Réunion et Mayotte."
        canonical={`${SITE_URL}/comparateur-supermarches-dom`}
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-2xl space-y-6">
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
            <li className="text-zinc-300">Comparateur supermarchés DOM</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-zinc-900/60 p-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-500">
            Comparatif 2026
          </div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            Comparateur supermarchés dans les DOM
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Carrefour, E.Leclerc, Super U, Leader Price ou Intermarché : quel supermarché choisir
            dans les DOM-TOM pour payer le moins cher ? Notre analyse compare les 5 grandes
            enseignes sur l'ensemble des territoires.
          </p>
        </div>

        {/* Comparison table */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-4 text-sm font-bold text-white">
            Classement global par prix — panier moyen de référence
          </h2>
          <div className="space-y-3">
            {RETAILER_DATA.map((r) => (
              <div
                key={r.name}
                className={`rounded-xl border p-4 ${
                  r.rank === 1
                    ? 'border-emerald-400/30 bg-emerald-400/[0.06]'
                    : 'border-white/8 bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{r.icon}</span>
                    <div>
                      <div className="font-bold text-white">{r.name}</div>
                      <div className="text-[11px] text-zinc-500">
                        Présent : {r.territories.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-extrabold tabular-nums ${r.rank === 1 ? 'text-emerald-400' : 'text-white'}`}
                    >
                      {formatEur(r.avgBasket)}
                    </div>
                    <div className="text-[11px] text-zinc-500">Indice : {r.priceIndex}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase text-emerald-500">
                      ✅ Points forts
                    </p>
                    <ul className="space-y-0.5">
                      {r.strengths.map((s) => (
                        <li key={s} className="text-[11px] text-zinc-500">
                          • {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase text-rose-500">
                      ⚠️ Points faibles
                    </p>
                    <ul className="space-y-0.5">
                      {r.weaknesses.map((w) => (
                        <li key={w} className="text-[11px] text-zinc-500">
                          • {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-zinc-600">
            * Panier de référence : 40 produits courants. Indice de prix basé sur Leclerc = 100.
            Données indicatives.
          </p>
        </div>

        {/* By territory */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-4 text-sm font-bold text-white">Recommandation par territoire</h2>
          <div className="space-y-3">
            {TERRITORY_ADVICE.map(({ name, slug, best, note }) => (
              <div key={slug} className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/moins-cher/${slug}`}
                    className="font-semibold text-white hover:text-emerald-400 transition-colors"
                  >
                    {name}
                  </Link>
                  <span className="rounded-md bg-emerald-400/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                    {best}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">{note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Internal links */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Comparatifs détaillés
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { to: '/comparer/carrefour-vs-leclerc-guadeloupe', label: 'Carrefour vs Leclerc GP' },
              { to: '/comparer/leclerc-vs-super-u-martinique', label: 'Leclerc vs Super U MQ' },
              { to: '/comparer/carrefour-vs-super-u-reunion', label: 'Carrefour vs Super U RE' },
              {
                to: '/comparer/leclerc-vs-intermarche-guadeloupe',
                label: 'Leclerc vs Intermarché GP',
              },
              { to: '/prix-enseigne/carrefour/guadeloupe', label: '🏪 Carrefour Guadeloupe' },
              { to: '/prix-enseigne/leclerc/martinique', label: '🏪 Leclerc Martinique' },
              { to: '/guide-prix-alimentaire-dom', label: '📖 Guide prix alimentaires' },
              { to: '/inflation-alimentaire-dom', label: '📈 Inflation DOM' },
              { to: '/ou-faire-courses-dom', label: '🛒 Où faire ses courses ?' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-emerald-400/30 hover:text-emerald-300"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <ConversionStickyBar
        bestPrice={87.4}
        savings={10.4}
        retailer="E.Leclerc"
        retailerUrl="https://www.e.leclerc/"
        productName="panier alimentaire DOM"
        territory="GP"
      />
    </div>
  );
}
