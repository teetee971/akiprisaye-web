/**
 * GuidePrixAlimentaireDOM.tsx — Guide complet des prix alimentaires dans les DOM
 *
 * Route: /guide-prix-alimentaire-dom
 * Pillar page targeting high-volume informational queries about food prices in DOM territories.
 */

import { Link } from 'react-router-dom';
import { SEOHead } from '../../components/ui/SEOHead';
import ConversionStickyBar from '../../components/business/ConversionStickyBar';
import { SITE_URL } from '../../utils/seoHelpers';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      '@id': `${SITE_URL}/guide-prix-alimentaire-dom#article`,
      headline: 'Guide complet des prix alimentaires dans les DOM-TOM 2026',
      description: 'Tout ce qu\'il faut savoir sur les prix alimentaires en Guadeloupe, Martinique, Guyane, La Réunion et Mayotte. Comparatif supermarchés, conseils économies, données inflation.',
      author: { '@type': 'Organization', name: 'A KI PRI SA YÉ' },
      datePublished: '2026-01-01',
      dateModified: '2026-06-01',
      url: `${SITE_URL}/guide-prix-alimentaire-dom`,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
        { '@type': 'ListItem', position: 3, name: 'Guide prix alimentaires DOM', item: `${SITE_URL}/guide-prix-alimentaire-dom` },
      ],
    },
  ],
};

export default function GuidePrixAlimentaireDOM() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 pb-24 sm:pb-8">
      <SEOHead
        title="Guide complet des prix alimentaires dans les DOM-TOM 2026"
        description="Tout sur les prix alimentaires en Guadeloupe, Martinique, Guyane, La Réunion et Mayotte. Comparatif supermarchés, conseils économies, données inflation 2026."
        canonical={`${SITE_URL}/guide-prix-alimentaire-dom`}
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-2xl space-y-6">

        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="text-xs text-zinc-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/" className="hover:text-emerald-400 transition-colors">Accueil</Link></li>
            <li aria-hidden className="text-zinc-700">›</li>
            <li className="text-zinc-300">Guide prix alimentaires DOM</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-zinc-900/60 p-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-500">
            Guide complet 2026
          </div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            Prix alimentaires dans les DOM-TOM
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            En Guadeloupe, Martinique, Guyane, La Réunion et Mayotte, les prix alimentaires
            sont structurellement plus élevés qu'en métropole. Ce guide vous explique pourquoi,
            comment comparer et comment économiser efficacement sur vos courses.
          </p>
        </div>

        {/* Section 1 — Contexte */}
        <details className="group rounded-xl border border-white/10 bg-white/[0.03] p-5" open>
          <summary className="cursor-pointer list-none">
            <h2 className="text-base font-bold text-white group-open:text-emerald-400">
              📊 Contexte : pourquoi les prix sont-ils plus élevés dans les DOM ?
            </h2>
          </summary>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
            <p>
              Les territoires d'outre-mer (DOM-TOM) font face à des prix alimentaires
              structurellement plus élevés qu'en France métropolitaine. Plusieurs facteurs
              expliquent cette réalité :
            </p>
            <ul className="space-y-2 pl-4">
              <li className="flex gap-2"><span>🚢</span><span><strong className="text-zinc-300">Fret maritime</strong> — La quasi-totalité des produits doit être importée depuis la métropole ou l'international, ce qui représente un surcoût logistique de 10 à 20% selon les produits.</span></li>
              <li className="flex gap-2"><span>💰</span><span><strong className="text-zinc-300">Octroi de mer</strong> — Cette taxe locale sur les produits importés alimente les budgets des collectivités mais renchérit le coût des produits de base.</span></li>
              <li className="flex gap-2"><span>🏪</span><span><strong className="text-zinc-300">Concentration du marché</strong> — Quelques grandes enseignes dominent le marché local, ce qui limite la concurrence par les prix.</span></li>
              <li className="flex gap-2"><span>📦</span><span><strong className="text-zinc-300">Coûts de stockage</strong> — Les petits marchés insulaires imposent des volumes de stockage plus faibles et des rotations moins rapides.</span></li>
            </ul>
            <p>
              En moyenne, les ménages des DOM dépensent <strong className="text-white">25 à 35%</strong> de
              leurs revenus pour l'alimentation, contre 15 à 20% en métropole. L'écart de prix
              moyen se situe entre <strong className="text-emerald-400">15% et 30%</strong> selon
              les territoires et les catégories de produits.
            </p>
          </div>
        </details>

        {/* Section 2 — Supermarchés */}
        <details className="group rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <summary className="cursor-pointer list-none">
            <h2 className="text-base font-bold text-white group-open:text-emerald-400">
              🏪 Les supermarchés dans les DOM : qui est le moins cher ?
            </h2>
          </summary>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
            <p>
              Cinq grandes enseignes dominent le paysage de la grande distribution dans les DOM :
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { name: 'E.Leclerc', pos: '1er', note: 'Généralement le moins cher, fort en PGC', color: 'emerald' },
                { name: 'Leader Price', pos: '2ème', note: 'Prix agressifs, fort en hard-discount', color: 'emerald' },
                { name: 'Carrefour', pos: '3ème', note: 'Bon rapport qualité-prix, large gamme', color: 'amber' },
                { name: 'Super U', pos: '4ème', note: 'Qualité marques distributeur', color: 'amber' },
                { name: 'Intermarché', pos: '5ème', note: 'Fort en produits frais et viande', color: 'zinc' },
              ].map(({ name, pos, note, color }) => (
                <div key={name} className={`rounded-lg border p-3 ${
                  color === 'emerald' ? 'border-emerald-400/20 bg-emerald-400/5' :
                  color === 'amber' ? 'border-amber-400/20 bg-amber-400/5' :
                  'border-white/10 bg-white/[0.02]'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{name}</span>
                    <span className={`text-xs font-bold ${
                      color === 'emerald' ? 'text-emerald-400' :
                      color === 'amber' ? 'text-amber-400' : 'text-zinc-500'
                    }`}>{pos}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{note}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-600">
              ⚠️ Ce classement est indicatif et peut varier selon les territoires, les catégories et les périodes promotionnelles.
              Consultez notre comparateur pour les prix actuels.
            </p>
          </div>
        </details>

        {/* Section 3 — Économies */}
        <details className="group rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <summary className="cursor-pointer list-none">
            <h2 className="text-base font-bold text-white group-open:text-emerald-400">
              💰 Comment économiser sur vos courses dans les DOM ?
            </h2>
          </summary>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
            <p>Plusieurs stratégies permettent de réduire significativement votre budget alimentaire :</p>
            <div className="space-y-3">
              {[
                { icon: '🔍', title: 'Comparer avant d\'acheter', desc: 'Utilisez notre comparateur pour identifier l\'enseigne la moins chère pour chaque produit avant de vous déplacer. L\'écart peut aller jusqu\'à 30% pour un même produit.' },
                { icon: '🏷️', title: 'Privilégier les marques distributeur', desc: 'Les MDD (marques de distributeur) proposent des produits de qualité similaire 20 à 40% moins chers que les grandes marques nationales.' },
                { icon: '📅', title: 'Profiter des promotions', desc: 'Les grandes foires alimentaires (Foire de la Guadeloupe, Foire de Fort-de-France) offrent des réductions importantes. Planifiez vos achats en conséquence.' },
                { icon: '🛒', title: 'Acheter en gros', desc: 'Pour les produits non-périssables (riz, pâtes, conserves), acheter en plus grande quantité lors des promotions permet de réduire le coût à l\'unité.' },
                { icon: '🌿', title: 'Favoriser les produits locaux', desc: 'Les fruits et légumes locaux sont souvent moins chers et plus frais que les produits importés. Ils ont aussi un impact environnemental réduit.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className="font-semibold text-white">{title}</p>
                    <p className="text-xs text-zinc-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* Section 4 — Conseils */}
        <details className="group rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <summary className="cursor-pointer list-none">
            <h2 className="text-base font-bold text-white group-open:text-emerald-400">
              💡 Conseils pratiques par territoire
            </h2>
          </summary>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
            {[
              { code: 'GP', name: 'Guadeloupe', tip: 'Profitez des marchés locaux de Pointe-à-Pitre pour les fruits et légumes. Les prix y sont souvent 30% moins chers que la grande distribution.' },
              { code: 'MQ', name: 'Martinique', tip: 'Le marché du Lamentin offre d\'excellents prix sur les produits frais. Pour le sec, Leclerc Martinique est généralement compétitif.' },
              { code: 'GF', name: 'Guyane', tip: 'Les prix en Guyane sont les plus élevés des DOM (-GF a le coefficient le plus haut). Privilégiez les coopératives d\'achats et les groupements.' },
              { code: 'RE', name: 'La Réunion', tip: 'La Réunion bénéficie d\'une production locale importante (fruits, légumes, viande). Privilégiez les circuits courts et les marchés forains.' },
              { code: 'YT', name: 'Mayotte', tip: 'Mayotte a les prix les plus élevés de tous les DOM. Les marchés informels proposent des alternatives moins chères pour les produits frais.' },
            ].map(({ code, name, tip }) => (
              <div key={code} className="rounded-lg border border-white/5 bg-white/[0.01] p-3">
                <p className="font-bold text-white">{name}</p>
                <p className="mt-1 text-xs text-zinc-500">{tip}</p>
              </div>
            ))}
          </div>
        </details>

        {/* Territory quick links */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Comparer par territoire
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              { code: 'GP', name: 'Guadeloupe', slug: 'guadeloupe' },
              { code: 'MQ', name: 'Martinique', slug: 'martinique' },
              { code: 'GF', name: 'Guyane', slug: 'guyane' },
              { code: 'RE', name: 'La Réunion', slug: 'reunion' },
              { code: 'YT', name: 'Mayotte', slug: 'mayotte' },
            ].map(({ name, slug }) => (
              <Link
                key={slug}
                to={`/moins-cher/${slug}`}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center text-xs font-medium text-zinc-400 transition-all hover:border-emerald-400/30 hover:text-emerald-300"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>

        {/* Internal links */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Aller plus loin
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { to: '/comparateur-supermarches-dom', label: '🏪 Comparateur supermarchés DOM' },
              { to: '/inflation-alimentaire-dom', label: '📈 Analyse inflation DOM' },
              { to: '/ou-faire-courses-dom', label: '🛒 Où faire ses courses ?' },
              { to: '/prix/coca-cola-1-5l-guadeloupe', label: '🥤 Prix Coca-Cola Guadeloupe' },
              { to: '/prix/riz-basmati-1kg-martinique', label: '🌾 Prix Riz Martinique' },
              { to: '/comparer/carrefour-vs-leclerc-guadeloupe', label: '⚖️ Carrefour vs Leclerc GP' },
              { to: '/inflation/alimentaire-guadeloupe-2026', label: '📊 Inflation GP 2026' },
              { to: '/moins-cher/guadeloupe', label: '💰 Moins chers Guadeloupe' },
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
        bestPrice={1.89}
        savings={0.60}
        retailer="E.Leclerc"
        retailerUrl="https://www.courses.leclerc.fr/"
        productName="produits alimentaires DOM"
        territory="GP"
      />
    </div>
  );
}
