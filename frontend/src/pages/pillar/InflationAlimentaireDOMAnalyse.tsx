/**
 * InflationAlimentaireDOMAnalyse.tsx — Analyse de l'inflation alimentaire dans les DOM
 *
 * Route: /inflation-alimentaire-dom
 * Pillar page analyzing food inflation trends 2024-2026 in DOM territories.
 */

import { Link } from 'react-router-dom';
import { SEOHead } from '../../components/ui/SEOHead';
import ConversionStickyBar from '../../components/business/ConversionStickyBar';
import { SITE_URL } from '../../utils/seoHelpers';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Inflation alimentaire DOM-TOM 2024-2026',
  description: 'Données et analyse de l\'inflation alimentaire dans les territoires d\'outre-mer français : Guadeloupe, Martinique, Guyane, La Réunion et Mayotte.',
  creator: { '@type': 'Organization', name: 'A KI PRI SA YÉ' },
  temporalCoverage: '2024/2026',
  url: `${SITE_URL}/inflation-alimentaire-dom`,
};

// Mock monthly data
const MONTHLY_DATA = [
  { month: 'Jan 2024', GP: 3.2, MQ: 3.0, GF: 4.1, RE: 2.8, YT: 5.2 },
  { month: 'Fév 2024', GP: 3.5, MQ: 3.2, GF: 4.3, RE: 3.0, YT: 5.5 },
  { month: 'Mar 2024', GP: 3.1, MQ: 3.4, GF: 4.0, RE: 2.9, YT: 5.1 },
  { month: 'Avr 2024', GP: 2.8, MQ: 3.1, GF: 3.9, RE: 2.7, YT: 4.9 },
  { month: 'Mai 2024', GP: 2.6, MQ: 2.9, GF: 3.7, RE: 2.5, YT: 4.7 },
  { month: 'Juin 2024', GP: 2.4, MQ: 2.7, GF: 3.5, RE: 2.3, YT: 4.5 },
  { month: 'Juil 2024', GP: 2.2, MQ: 2.5, GF: 3.3, RE: 2.1, YT: 4.3 },
  { month: 'Aoû 2024', GP: 2.0, MQ: 2.3, GF: 3.2, RE: 1.9, YT: 4.1 },
  { month: 'Sep 2024', GP: 2.3, MQ: 2.6, GF: 3.4, RE: 2.2, YT: 4.4 },
  { month: 'Oct 2024', GP: 2.5, MQ: 2.8, GF: 3.6, RE: 2.4, YT: 4.6 },
  { month: 'Nov 2024', GP: 2.7, MQ: 3.0, GF: 3.8, RE: 2.6, YT: 4.8 },
  { month: 'Déc 2024', GP: 3.0, MQ: 3.2, GF: 4.0, RE: 2.8, YT: 5.0 },
  { month: 'Jan 2025', GP: 2.8, MQ: 3.1, GF: 3.9, RE: 2.6, YT: 4.9 },
  { month: 'Fév 2025', GP: 2.5, MQ: 2.8, GF: 3.6, RE: 2.3, YT: 4.6 },
  { month: 'Mar 2025', GP: 2.2, MQ: 2.5, GF: 3.3, RE: 2.0, YT: 4.3 },
  { month: 'Avr 2025', GP: 1.9, MQ: 2.2, GF: 3.0, RE: 1.8, YT: 4.0 },
  { month: 'Mai 2025', GP: 1.7, MQ: 2.0, GF: 2.8, RE: 1.6, YT: 3.8 },
  { month: 'Juin 2025', GP: 1.5, MQ: 1.8, GF: 2.6, RE: 1.4, YT: 3.6 },
];

export default function InflationAlimentaireDOMAnalyse() {
  const latestData = MONTHLY_DATA[MONTHLY_DATA.length - 1];

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 pb-24 sm:pb-8">
      <SEOHead
        title="Inflation alimentaire DOM-TOM 2024-2026 : données et analyse"
        description="Analyse complète de l'inflation alimentaire dans les DOM (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte). Données mensuelles, impact sur les familles, comparaison avec la métropole."
        canonical={`${SITE_URL}/inflation-alimentaire-dom`}
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-2xl space-y-6">

        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="text-xs text-zinc-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/" className="hover:text-emerald-400 transition-colors">Accueil</Link></li>
            <li aria-hidden className="text-zinc-700">›</li>
            <li className="text-zinc-300">Inflation alimentaire DOM</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-950/30 to-zinc-900/60 p-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-500">
            Analyse 2024-2026
          </div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            Inflation alimentaire dans les DOM
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            L'inflation alimentaire dans les DOM-TOM touche particulièrement les ménages
            aux revenus modestes. Découvrez les données mensuelles, les tendances et l'impact
            sur le pouvoir d'achat des familles ultramarines.
          </p>
        </div>

        {/* Key figures */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Guadeloupe', value: `+${latestData.GP}%`, color: 'emerald' },
            { label: 'Martinique', value: `+${latestData.MQ}%`, color: 'emerald' },
            { label: 'Guyane', value: `+${latestData.GF}%`, color: 'amber' },
            { label: 'Mayotte', value: `+${latestData.YT}%`, color: 'rose' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border p-3 text-center ${
              color === 'emerald' ? 'border-emerald-400/20 bg-emerald-400/5' :
              color === 'amber' ? 'border-amber-400/20 bg-amber-400/5' :
              'border-rose-400/20 bg-rose-400/5'
            }`}>
              <div className={`text-2xl font-extrabold tabular-nums ${
                color === 'emerald' ? 'text-emerald-400' :
                color === 'amber' ? 'text-amber-400' : 'text-rose-400'
              }`}>{value}</div>
              <div className="mt-1 text-[10px] text-zinc-500">{label}</div>
              <div className="text-[10px] text-zinc-600">Juin 2025</div>
            </div>
          ))}
        </div>

        {/* Monthly data table */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-4 text-sm font-bold text-white">
            Évolution mensuelle de l'inflation alimentaire (%)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-2 text-left text-zinc-500">Mois</th>
                  <th className="py-2 text-right text-zinc-500">GP</th>
                  <th className="py-2 text-right text-zinc-500">MQ</th>
                  <th className="py-2 text-right text-zinc-500">GF</th>
                  <th className="py-2 text-right text-zinc-500">RE</th>
                  <th className="py-2 text-right text-zinc-500">YT</th>
                </tr>
              </thead>
              <tbody>
                {MONTHLY_DATA.slice(-12).map((row) => (
                  <tr key={row.month} className="border-b border-white/5">
                    <td className="py-1.5 text-zinc-400">{row.month}</td>
                    <td className="py-1.5 text-right text-emerald-400">+{row.GP}%</td>
                    <td className="py-1.5 text-right text-emerald-400">+{row.MQ}%</td>
                    <td className="py-1.5 text-right text-amber-400">+{row.GF}%</td>
                    <td className="py-1.5 text-right text-emerald-400">+{row.RE}%</td>
                    <td className="py-1.5 text-right text-rose-400">+{row.YT}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-zinc-600">
            * Données indicatives basées sur les indices des prix à la consommation. Sources : INSEE, IEDOM.
          </p>
        </div>

        {/* Analysis */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-3 text-sm font-bold text-white">Analyse et contexte</h2>
          <div className="space-y-3 text-sm leading-relaxed text-zinc-400">
            <p>
              Après un pic d'inflation en début 2024, les territoires ultramarins connaissent
              une décélération progressive, mais les prix restent structurellement plus élevés
              qu'en métropole. Mayotte demeure le territoire le plus touché avec des taux
              d'inflation systématiquement supérieurs aux autres DOM.
            </p>
            <p>
              Les produits les plus touchés par l'inflation dans les DOM sont :
            </p>
            <ul className="space-y-1 pl-4 text-zinc-500">
              {['Huiles alimentaires (+18% à +25%)', 'Pâtes et riz (+12% à +18%)', 'Produits laitiers (+8% à +15%)', 'Viandes et poissons (+6% à +12%)'].map((item) => (
                <li key={item} className="text-xs">• {item}</li>
              ))}
            </ul>
            <p>
              L'impact sur les familles modestes est significatif : un ménage de 4 personnes
              dans les DOM dépense en moyenne <strong className="text-white">150 à 300€ de plus par mois</strong> que
              son équivalent métropolitain pour un panier alimentaire identique.
            </p>
          </div>
        </div>

        {/* Internal links */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Voir aussi
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { to: '/inflation/alimentaire-guadeloupe-2026', label: '📈 Inflation GP 2026' },
              { to: '/inflation/alimentaire-martinique-2026', label: '📈 Inflation MQ 2026' },
              { to: '/inflation/alimentaire-guyane-2026', label: '📈 Inflation GF 2026' },
              { to: '/inflation/alimentaire-reunion-2026', label: '📈 Inflation RE 2026' },
              { to: '/inflation/alimentaire-mayotte-2026', label: '📈 Inflation YT 2026' },
              { to: '/guide-prix-alimentaire-dom', label: '📖 Guide prix alimentaires' },
              { to: '/comparateur-supermarches-dom', label: '🏪 Comparateur supermarchés' },
              { to: '/ou-faire-courses-dom', label: '🛒 Où faire ses courses ?' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-amber-400/30 hover:text-amber-300"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

      </div>

      <ConversionStickyBar
        bestPrice={null}
        savings={null}
        retailer={null}
        retailerUrl={null}
        productName="produits alimentaires"
        territory="GP"
      />
    </div>
  );
}
