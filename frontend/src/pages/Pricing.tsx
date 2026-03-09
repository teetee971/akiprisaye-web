import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Minus, Heart, Megaphone, GraduationCap, Users, Database, Gift, ChevronDown, ChevronUp, Sparkles, Zap } from 'lucide-react'
import { HeroImage } from '../components/ui/HeroImage'
import { PAGE_HERO_IMAGES } from '../config/imageAssets'

/* ------------------------------------------------------------------ */
/* Données des plans — source unique pour l'UI                         */
/* Synchronisées avec billing/plans.ts + Subscribe.tsx                */
/* ------------------------------------------------------------------ */

interface PlanUI {
  id: string
  icon: string
  label: string
  tagline: string
  monthly: number | null     // null = sur devis
  yearly: number | null      // null = sur devis
  domDiscount: boolean       // remise -30% DOM disponible
  highlight: boolean         // carte mise en avant
  cta: string
  ctaHref: (cycle: 'monthly' | 'yearly') => string
  features: string[]
  notIncluded?: string[]
}

const PLANS: PlanUI[] = [
  {
    id: 'FREE',
    icon: '🌱',
    label: 'Gratuit',
    tagline: 'Découvrir et contribuer.',
    monthly: 0,
    yearly: 0,
    domDiscount: false,
    highlight: false,
    cta: 'Commencer gratuitement',
    ctaHref: () => '/inscription',
    features: [
      '30 articles suivis',
      'Actualisation des prix (10×/jour)',
      'Historique basique',
      'Export CSV basique',
      '1 territoire',
    ],
    notIncluded: [
      'Alertes prix',
      'Historique avancé',
      'Multi-territoires',
    ],
  },
  {
    id: 'CITIZEN_PREMIUM',
    icon: '⭐',
    label: 'Citoyen Premium',
    tagline: 'Outil citoyen complet.',
    monthly: 3.99,
    yearly: 39,
    domDiscount: false,
    highlight: false,
    cta: 'Choisir Citoyen Premium',
    ctaHref: (c) => `/subscribe?plan=CITIZEN_PREMIUM&cycle=${c}`,
    features: [
      '100 articles suivis',
      'Actualisation des prix (50×/jour)',
      'Historique avancé (12 mois)',
      'Alertes prix locales',
      'Export CSV',
      '2 territoires',
    ],
    notIncluded: [
      'Multi-territoires (5+)',
      'Export avancé',
    ],
  },
  {
    id: 'PRO',
    icon: '🚀',
    label: 'Pro',
    tagline: 'Pour pros, associations, analystes.',
    monthly: 19,
    yearly: 190,
    domDiscount: true,
    highlight: true,
    cta: 'Choisir Pro',
    ctaHref: (c) => `/subscribe?plan=PRO&cycle=${c}`,
    features: [
      '300 articles suivis',
      'Actualisation (500×/jour)',
      'Historique avancé',
      'Alertes prix',
      'Export avancé (CSV, JSON)',
      '5 territoires',
      'Rapport mensuel PDF',
    ],
    notIncluded: [
      'Listes partagées équipe',
      'Accès API',
    ],
  },
  {
    id: 'BUSINESS',
    icon: '💼',
    label: 'Business',
    tagline: 'Pour équipes et exploitation intensive.',
    monthly: 99,
    yearly: 990,
    domDiscount: true,
    highlight: false,
    cta: 'Choisir Business',
    ctaHref: (c) => `/subscribe?plan=BUSINESS&cycle=${c}`,
    features: [
      '2 000 articles suivis',
      'Actualisation (5 000×/jour)',
      'Historique complet',
      'Alertes prix avancées',
      'Export avancé',
      '10 territoires',
      'Listes partagées équipe',
      'Tableau de bord budget',
      'Rapport mensuel PDF',
    ],
    notIncluded: [
      'Rapports automatiques',
      'Accès API complet',
    ],
  },
  {
    id: 'INSTITUTION',
    icon: '🏛️',
    label: 'Institution',
    tagline: 'Collectivités, organismes publics, chercheurs.',
    monthly: null,
    yearly: null,
    domDiscount: false,
    highlight: false,
    cta: 'Demander un devis',
    ctaHref: () => '/contact?subject=licence-institutionnelle',
    features: [
      '20 000 articles suivis',
      'Actualisation illimitée',
      'Historique complet',
      'Alertes prix',
      'Export avancé + open-data',
      '20 territoires',
      'Listes partagées',
      'Tableau de bord budget',
      'Rapports automatiques',
      'Accès API complet',
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Nouvelles sources de revenus                                         */
/* ------------------------------------------------------------------ */

interface RevenueOption {
  icon: React.ReactNode
  title: string
  subtitle: string
  description: string
  price: string
  priceDetail: string
  color: string          // Tailwind bg colour class
  borderColor: string
  ctaLabel: string
  ctaHref: string
  badge?: string
}

const REVENUE_OPTIONS: RevenueOption[] = [
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Don Citoyen',
    subtitle: 'Soutenir l\'Observatoire',
    description:
      'Un don unique pour soutenir la mission citoyenne : surveiller les prix et lutter contre la vie chère outre-mer. Chaque contribution finance les serveurs, les relevés terrain et le développement de l\'application.',
    price: 'Dès 2 €',
    priceDetail: 'don unique, déductible des impôts *',
    color: 'from-rose-900/30 to-pink-900/20',
    borderColor: 'border-rose-700/40',
    ctaLabel: '❤️ Faire un don',
    ctaHref: '/contact?subject=don-citoyen',
    badge: '💝 Mission citoyenne',
  },
  {
    icon: <Megaphone className="w-6 h-6" />,
    title: 'Publicité Locale',
    subtitle: 'Toucher les consommateurs DOM',
    description:
      'Faites connaître votre enseigne, vos promotions ou vos services directement aux citoyens qui comparent les prix. Visibilité ciblée par territoire (Guadeloupe, Martinique, Guyane, Réunion, Mayotte).',
    price: 'Dès 49 €/mois',
    priceDetail: 'par territoire — bannière ou encart sponsorisé',
    color: 'from-amber-900/30 to-yellow-900/20',
    borderColor: 'border-amber-700/40',
    ctaLabel: '📢 Annoncer ici',
    ctaHref: '/contact?subject=publicite-locale',
    badge: '📣 Commerçants & enseignes',
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: 'Formations & Ateliers',
    subtitle: 'Associations, mairies, syndicats',
    description:
      'Ateliers pratiques sur les droits des consommateurs, la lecture des prix, le BQP et l\'utilisation de l\'observatoire. Format présentiel ou visioconférence. Attestation de formation fournie.',
    price: '150 € – 500 €',
    priceDetail: 'par session (2–4h) · devis gratuit',
    color: 'from-violet-900/30 to-purple-900/20',
    borderColor: 'border-violet-700/40',
    ctaLabel: '🎓 Demander un atelier',
    ctaHref: '/contact?subject=formation-atelier',
    badge: '🏅 Éligible subventions',
  },
  {
    icon: <Gift className="w-6 h-6" />,
    title: 'Programme Parrainage',
    subtitle: 'Invitez vos amis, gagnez des mois gratuits',
    description:
      'Parrainez un proche et recevez chacun 1 mois offert sur votre abonnement. Vos filleuls bénéficient d\'un accès Premium 30 jours gratuit. Cumulable, sans limite de parrainages.',
    price: '1 mois offert',
    priceDetail: 'par filleul activé — pour vous et pour lui',
    color: 'from-emerald-900/30 to-teal-900/20',
    borderColor: 'border-emerald-700/40',
    ctaLabel: '🔗 Obtenir mon lien',
    ctaHref: '/mon-compte?tab=parrainage',
    badge: '🎁 Sans limite',
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: 'Données & Rapports B2B',
    subtitle: 'Études, journalistes, chercheurs',
    description:
      'Rapports de tendances tarifaires par territoire, par catégorie ou par produit. Données anonymisées et agrégées. Formats CSV, JSON, PDF. Idéal pour études de marché, articles de presse, mémoires universitaires.',
    price: 'Dès 50 €',
    priceDetail: 'par rapport personnalisé — sur devis pour flux continu',
    color: 'from-blue-900/30 to-cyan-900/20',
    borderColor: 'border-blue-700/40',
    ctaLabel: '📊 Commander un rapport',
    ctaHref: '/contact?subject=rapport-donnees',
    badge: '📈 Données vérifiées',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Collecte Terrain Rémunérée',
    subtitle: 'Devenez contributeur officiel',
    description:
      'Contribuez en relevant des prix dans votre enseigne locale et gagnez des bons d\'achat ou des réductions d\'abonnement. Programme ouvert à tous — aucune compétence technique requise, juste un smartphone.',
    price: 'Crédits offerts',
    priceDetail: 'réductions abonnement ou bons d\'achat partenaires',
    color: 'from-orange-900/30 to-red-900/20',
    borderColor: 'border-orange-700/40',
    ctaLabel: '📸 Devenir contributeur',
    ctaHref: '/contribuer',
    badge: '🤝 Communauté',
  },
]

/* ------------------------------------------------------------------ */
/* FAQ abonnements                                                       */
/* ------------------------------------------------------------------ */

const FAQ_ITEMS = [
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui. Vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre compte. La différence de prix est calculée au prorata du mois en cours.',
  },
  {
    q: 'Comment fonctionne la remise DOM −30 % ?',
    a: 'La remise de 30 % est automatiquement appliquée aux plans Pro et Business pour les résidents des territoires DOM·ROM·COM. Elle est activée lors de votre abonnement dès que vous indiquez votre territoire.',
  },
  {
    q: 'Est-ce que mes données sont partagées avec des tiers ?',
    a: 'Non. Vos données personnelles et vos listes de prix ne sont jamais vendues ni partagées. Les données B2B proposées dans la section "Revenus additionnels" sont exclusivement des agrégats anonymisés.',
  },
  {
    q: 'Puis-je annuler sans frais ?',
    a: 'Oui, à tout moment. Il n\'y a pas de période d\'engagement ni de frais de résiliation. Pour les plans annuels, le montant restant est remboursé au prorata.',
  },
  {
    q: 'Qu\'est-ce que le Bouclier Qualité Prix (BQP) mentionné dans l\'app ?',
    a: 'Le BQP est un dispositif légal (décret n°2012-848) qui impose un plafond de +30 % de surcoût vs métropole sur une liste de produits négociée annuellement. L\'application vous alerte automatiquement quand ce seuil est dépassé.',
  },
  {
    q: 'L\'accès API est-il disponible en dehors du plan Institution ?',
    a: 'Un accès API limité est inclus dans le plan Business. Pour un accès complet avec quota personnalisé, contactez-nous via le formulaire "Données & Rapports B2B".',
  },
]

/* ------------------------------------------------------------------ */
/* Composant principal                                                  */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Hero banner */}
        <div className="mb-10 animate-fade-in">
          <HeroImage
            src={PAGE_HERO_IMAGES.pricing}
            alt="Abonnements — options tarifaires A KI PRI SA YÉ"
            gradient="from-slate-900 to-blue-950"
            height="h-36 sm:h-48"
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow">
              Abonnements &amp; Options
            </h1>
            <p className="text-slate-200 text-sm drop-shadow max-w-2xl">
              Commence gratuitement. Passe au niveau adapté à ton usage. Soutiens la mission citoyenne.
            </p>
          </HeroImage>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { value: '5 000+', label: 'citoyens actifs' },
            { value: '15 territoires', label: 'couverts' },
            { value: '50 000+', label: 'prix observés' },
            { value: '100 %', label: 'open-data citoyen' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* En-tête */}
        <header className="text-center mb-12">
          {/* Bandeau Espace Pro */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl px-5 py-3">
            <span className="text-xl">💼</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Vous êtes commerçant ou prestataire ?</p>
              <p className="text-xs text-blue-700 dark:text-blue-400">Publiez vos prix avec toutes vos infos. Compte pro dédié.</p>
            </div>
            <Link
              to="/inscription-pro"
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Espace Pro →
            </Link>
          </div>

          {/* Cycle toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-1.5 shadow-sm">
            <button
              onClick={() => setCycle('monthly')}
              aria-pressed={cycle === 'monthly'}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                cycle === 'monthly'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setCycle('yearly')}
              aria-pressed={cycle === 'yearly'}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                cycle === 'yearly'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Annuel{' '}
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                −17 %
              </span>
            </button>
          </div>
        </header>

        {/* Grille des plans */}
        <section
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          aria-label="Plans d'abonnement"
        >
          {PLANS.map((plan) => {
            const price =
              plan.monthly === null
                ? null
                : cycle === 'yearly'
                ? plan.yearly
                : plan.monthly
            const monthlyEquiv =
              cycle === 'yearly' && plan.yearly !== null && plan.monthly !== null && plan.monthly > 0
                ? plan.yearly / 12
                : null

            return (
              <article
                key={plan.id}
                className={`rounded-2xl p-6 flex flex-col ${
                  plan.highlight
                    ? 'border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-900 shadow-lg relative'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    Recommandé
                  </div>
                )}

                <div className="flex-1">
                  {/* Icône + Nom & tagline */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl" aria-hidden="true">{plan.icon}</span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {plan.label}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    {plan.tagline}
                  </p>

                  {/* Prix */}
                  <div className="mt-2 mb-5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    {price === null ? (
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        Sur devis
                      </p>
                    ) : price === 0 ? (
                      <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        Gratuit
                      </p>
                    ) : (
                      <>
                        <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                          {price.toFixed(2).replace('.', ',')} €
                          <span className="text-sm font-medium text-slate-500 ml-1">
                            /{cycle === 'yearly' ? 'an' : 'mois'}
                          </span>
                        </p>
                        {monthlyEquiv !== null && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                            <Zap className="w-3 h-3" aria-hidden="true" />
                            soit {monthlyEquiv.toFixed(2).replace('.', ',')} €/mois
                          </p>
                        )}
                        {plan.domDiscount && cycle === 'monthly' && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                            −30 % DOM disponible *
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Features incluses */}
                  <ul className="mt-2 space-y-1.5" aria-label={`Fonctionnalités ${plan.label}`}>
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                    {plan.notIncluded?.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-400 dark:text-slate-600">
                        <Minus className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <Link
                  to={plan.ctaHref(cycle)}
                  className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition ${
                    plan.highlight
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </article>
            )
          })}
        </section>

        {/* Note DOM */}
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          * Remise de 30 % applicable aux plans Pro et Business pour les résidents des territoires
          DOM · ROM · COM — activée automatiquement lors de l'abonnement.
        </p>

        {/* Liens vers comparaisons */}
        <div className="mt-5 text-center space-y-2">
          <Link to="/tarifs-details" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Voir la comparaison complète des fonctionnalités →
          </Link>
          <br />
          <Link to="/comparatif-concurrence" className="text-sm text-slate-500 dark:text-slate-400 hover:underline">
            ⚖️ Comparer avec la concurrence →
          </Link>
        </div>

        {/* ========================================================= */}
        {/* SECTION : Autres sources de revenus                        */}
        {/* ========================================================= */}
        <section className="mt-20" aria-labelledby="revenus-heading">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-emerald-600 dark:text-emerald-400 mb-3">
              Soutien & Partenariats
            </span>
            <h2 id="revenus-heading" className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              D'autres façons de participer
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
              Au-delà des abonnements, voici toutes les options pour soutenir la mission, collaborer ou générer des économies supplémentaires.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {REVENUE_OPTIONS.map((opt) => (
              <article
                key={opt.title}
                className={`relative flex flex-col bg-gradient-to-br ${opt.color} border ${opt.borderColor} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}
              >
                {opt.badge && (
                  <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/20 backdrop-blur-sm">
                    {opt.badge}
                  </span>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/10 rounded-xl text-white">
                    {opt.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">{opt.title}</h3>
                    <p className="text-xs text-white/60">{opt.subtitle}</p>
                  </div>
                </div>

                <p className="text-sm text-white/80 leading-relaxed flex-1 mb-4">
                  {opt.description}
                </p>

                <div className="mb-4 p-3 bg-black/20 rounded-xl">
                  <p className="text-lg font-extrabold text-white">{opt.price}</p>
                  <p className="text-xs text-white/50 mt-0.5">{opt.priceDetail}</p>
                </div>

                <Link
                  to={opt.ctaHref}
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-colors"
                >
                  {opt.ctaLabel}
                </Link>
              </article>
            ))}
          </div>

          {/* Note don fiscal */}
          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            * Les dons versés à une association citoyenne reconnue peuvent être déductibles des impôts à hauteur de 66 %. Contactez-nous pour les modalités.
          </p>
        </section>

        {/* ========================================================= */}
        {/* SECTION : Idées de monétisation supplémentaires (éditoriale) */}
        {/* ========================================================= */}
        <section className="mt-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="text-3xl shrink-0">💡</div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                Pistes de revenus complémentaires — Feuille de route
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                En tant que plateforme citoyenne d'observation des prix en outre-mer, voici d'autres leviers de revenus identifiés pour la prochaine phase de développement :
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: '🏪', title: 'Listings commerçants sponsorisés', desc: 'Les enseignes paient pour apparaître en tête des résultats de recherche dans leur zone géographique.' },
                  { icon: '🤝', title: 'Partenariats associatifs', desc: 'Licences groupées pour réseaux associatifs de défense des consommateurs (CLCV, UFC-Que Choisir, etc.).' },
                  { icon: '📱', title: 'Application mobile premium', desc: 'Version mobile avec fonctionnalités exclusives (scan offline, alerte géolocalisée, widget écran d\'accueil).' },
                  { icon: '🎙️', title: 'Podcast & Lettre hebdo premium', desc: 'Abonnement à une lettre économique hebdomadaire ciblée sur la vie chère en outre-mer (5 €/mois).' },
                  { icon: '🏆', title: 'Challenges & Concours citoyens', desc: 'Partenariats marques pour challenges de relevés de prix récompensés — financement externe.' },
                  { icon: '🌐', title: 'Licence internationale', desc: 'Export du modèle vers d\'autres territoires insulaires francophones (Nouvelle-Calédonie, Polynésie, Caraïbe anglophone).' },
                ].map((idea) => (
                  <div key={idea.title} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-xl shrink-0">{idea.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{idea.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{idea.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/roadmap"
                  className="inline-flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition"
                >
                  Voir la roadmap complète →
                </Link>
                <Link
                  to="/dossier-investisseurs"
                  className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  📄 Dossier investisseurs →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION : FAQ                                               */}
        {/* ========================================================= */}
        <section className="mt-16" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-bold text-slate-900 dark:text-white text-center mb-8">
            Questions fréquentes
          </h2>
          <div className="max-w-3xl mx-auto divide-y divide-slate-200 dark:divide-slate-800">
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left"
                  aria-expanded={openFaq === idx}
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.q}</span>
                  {openFaq === idx
                    ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  }
                </button>
                {openFaq === idx && (
                  <p className="pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white max-w-2xl shadow-lg">
            <p className="text-2xl font-extrabold mb-2">Prêt à rejoindre la mission ?</p>
            <p className="text-blue-100 text-sm mb-6">
              Plus de 5 000 citoyens observent déjà les prix pour lutter contre la vie chère dans les DOM.
              Rejoins-les gratuitement.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/inscription"
                className="bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition text-sm"
              >
                Commencer gratuitement →
              </Link>
              <Link
                to="/contact"
                className="border border-white/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition text-sm"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
