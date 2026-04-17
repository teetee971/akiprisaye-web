/**
 * OuFaireCoursesDOMPage.tsx — Guide pratique : où faire ses courses dans les DOM
 *
 * Route: /ou-faire-courses-dom
 * Practical guide on which supermarket to choose, when and for what.
 */

import { Link } from 'react-router-dom';
import { SEOHead } from '../../components/ui/SEOHead';
import ConversionStickyBar from '../../components/business/ConversionStickyBar';
import { SITE_URL } from '../../utils/seoHelpers';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Où faire ses courses dans les DOM ? Guide pratique 2026',
  description:
    'Guide pratique pour optimiser ses courses dans les DOM-TOM. Quel supermarché choisir, pour quelle catégorie de produits, et comment économiser au maximum.',
  author: { '@type': 'Organization', name: 'A KI PRI SA YÉ' },
  url: `${SITE_URL}/ou-faire-courses-dom`,
};

const CATEGORY_TIPS = [
  {
    icon: '🥩',
    category: 'Viandes et poissons',
    best: 'Intermarché',
    alt: 'Marchés locaux',
    tip: 'Intermarché est reconnu pour la qualité de sa boucherie et poissonnerie dans les DOM. Pour la viande locale et le poisson frais, les marchés forains restent imbattables.',
    saving: '15-25%',
  },
  {
    icon: '🥛',
    category: 'Produits laitiers',
    best: 'Super U / Leader Price',
    alt: 'E.Leclerc',
    tip: 'Les marques distributeur de Super U sont excellentes en produits laitiers. Leader Price propose des prix très bas sur le lait UHT et les yaourts basiques.',
    saving: '20-35%',
  },
  {
    icon: '🌾',
    category: 'Épicerie sèche (riz, pâtes, conserves)',
    best: 'E.Leclerc',
    alt: 'Leader Price',
    tip: "E.Leclerc est systématiquement le moins cher sur les produits d'épicerie sèche dans les DOM. En quantité, Leader Price est très compétitif sur les basiques.",
    saving: '10-20%',
  },
  {
    icon: '🥬',
    category: 'Fruits et légumes',
    best: 'Marchés locaux',
    alt: 'Supermarchés locaux',
    tip: 'Pour les fruits et légumes, les marchés forains (Grand Marché de Pointe-à-Pitre, Marché de Fort-de-France) proposent des produits frais et locaux bien moins chers que la grande distribution.',
    saving: '30-50%',
  },
  {
    icon: '🧴',
    category: 'Hygiène et cosmétiques',
    best: 'Leader Price',
    alt: 'Carrefour',
    tip: "Leader Price casse les prix sur les produits d'hygiène de base. Pour les marques premium, Carrefour propose souvent des promotions régulières.",
    saving: '15-30%',
  },
  {
    icon: '🧹',
    category: "Produits d'entretien",
    best: 'Leader Price',
    alt: 'E.Leclerc',
    tip: "Les marques distributeur Leader Price sur les produits d'entretien sont très compétitives. Acheter en grands formats permet des économies supplémentaires.",
    saving: '20-40%',
  },
  {
    icon: '🍼',
    category: 'Produits bébé',
    best: 'Carrefour / Leclerc',
    alt: 'Pharmacies',
    tip: 'Carrefour et Leclerc proposent les meilleures offres sur les couches et le lait infantile, notamment via leurs programmes de fidélité bébé.',
    saving: '10-20%',
  },
  {
    icon: '🍦',
    category: 'Surgelés',
    best: 'Leader Price',
    alt: 'Super U',
    tip: 'Leader Price propose un excellent rapport qualité-prix sur les surgelés de base. Pour les produits plus élaborés, Super U offre une bonne alternative.',
    saving: '15-25%',
  },
];

const WEEKLY_STRATEGY = [
  {
    day: 'Lundi',
    tip: 'Jour de réassort dans la plupart des enseignes. Meilleur choix pour les produits frais.',
  },
  {
    day: 'Mercredi',
    tip: 'Début des nouvelles promotions hebdomadaires. Consultez les catalogues en ligne avant.',
  },
  { day: 'Jeudi', tip: 'Souvent le meilleur jour pour les soldes de la semaine précédente.' },
  { day: 'Week-end', tip: 'Évitez si possible : affluence maximale et rayons parfois dévalisés.' },
];

export default function OuFaireCoursesDOMPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 pb-24 sm:pb-8">
      <SEOHead
        title="Où faire ses courses dans les DOM ? Guide pratique par catégorie 2026"
        description="Guide pratique pour bien faire ses courses dans les DOM-TOM. Quel supermarché choisir pour la viande, les légumes, l'épicerie ? Stratégies économies par catégorie de produits."
        canonical={`${SITE_URL}/ou-faire-courses-dom`}
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
            <li className="text-zinc-300">Où faire ses courses dans les DOM ?</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-zinc-900/60 p-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-500">
            Guide pratique 2026
          </div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            Où faire ses courses dans les DOM ?
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            En Guadeloupe, Martinique, Guyane, La Réunion et Mayotte, choisir le bon supermarché
            pour chaque catégorie de produits peut faire économiser jusqu'à 200€ par mois à une
            famille. Voici le guide pratique par type de produit.
          </p>
        </div>

        {/* By category */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-4 text-sm font-bold text-white">
            Quel supermarché pour chaque catégorie ?
          </h2>
          <div className="space-y-3">
            {CATEGORY_TIPS.map(({ icon, category, best, alt, tip, saving }) => (
              <details
                key={category}
                className="group rounded-lg border border-white/8 bg-white/[0.02] p-3"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span className="text-xs font-semibold text-zinc-300 group-open:text-emerald-400">
                        {category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        {best}
                      </span>
                      <span className="text-[10px] text-zinc-600">Éco. {saving}</span>
                    </div>
                  </div>
                </summary>
                <div className="mt-3 space-y-2 text-xs text-zinc-500">
                  <p>{tip}</p>
                  <p className="text-zinc-600">
                    Alternative : <strong className="text-zinc-400">{alt}</strong>
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Weekly strategy */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-4 text-sm font-bold text-white">
            Stratégie hebdomadaire : quel jour faire ses courses ?
          </h2>
          <div className="space-y-2">
            {WEEKLY_STRATEGY.map(({ day, tip }) => (
              <div
                key={day}
                className="flex gap-3 rounded-lg border border-white/5 bg-white/[0.01] p-3"
              >
                <span className="w-20 shrink-0 text-xs font-bold text-emerald-400">{day}</span>
                <p className="text-xs text-zinc-500">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick tips */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-4 text-sm font-bold text-white">
            10 conseils pour économiser sur vos courses dans les DOM
          </h2>
          <div className="space-y-2">
            {[
              'Comparez les prix avec notre outil avant chaque visite',
              'Utilisez les cartes de fidélité de toutes les enseignes',
              'Achetez les produits secs en grand format lors des promotions',
              'Privilégiez les marchés locaux pour les fruits et légumes frais',
              'Consultez les catalogues hebdomadaires en ligne',
              'Évitez le gaspillage alimentaire : planifiez vos repas',
              'Optez pour les marques distributeur sur les basiques',
              'Profitez des foires alimentaires annuelles pour les stocks',
              'Comparez le prix au kilo plutôt que le prix affiché',
              'Signalez les prix abusifs sur notre plateforme pour aider la communauté',
            ].map((tip, i) => (
              <div key={i} className="flex gap-3 text-xs text-zinc-400">
                <span className="shrink-0 text-zinc-600">{i + 1}.</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Internal links */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Ressources utiles
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { to: '/guide-prix-alimentaire-dom', label: '📖 Guide prix alimentaires DOM' },
              { to: '/comparateur-supermarches-dom', label: '🏪 Comparateur supermarchés' },
              { to: '/inflation-alimentaire-dom', label: '📈 Analyse inflation DOM' },
              { to: '/comparateur', label: '🔍 Comparateur de prix' },
              { to: '/moins-cher/guadeloupe', label: '💰 Moins chers Guadeloupe' },
              { to: '/moins-cher/martinique', label: '💰 Moins chers Martinique' },
              { to: '/prix-enseigne/carrefour/guadeloupe', label: '🏪 Carrefour GP' },
              { to: '/prix-enseigne/leclerc/martinique', label: '🏪 Leclerc MQ' },
              { to: '/prix-enseigne/super-u/reunion', label: '🏪 Super U RE' },
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
        savings={25.8}
        retailer="E.Leclerc"
        retailerUrl="https://www.e.leclerc/"
        productName="panier alimentaire DOM"
        territory="GP"
      />
    </div>
  );
}
