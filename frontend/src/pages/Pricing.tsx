import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Check,
  X,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Shield,
  Clock,
  Plus,
  Heart,
  Megaphone,
  GraduationCap,
  Users,
  Database,
  Gift,
  Building2,
  BadgeCheck,
  Phone,
} from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import PricingConversionBanner from '../components/PricingConversionBanner';
import { trackConversion } from '../services/subscriptionConversionService';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface PlanFeature {
  label: string;
  included: boolean;
}

interface PlanUI {
  id: string;
  icon: string;
  label: string;
  tagline: string;
  monthlyPrice: number | null; // null = sur devis
  yearlyPrice: number | null; // full yearly amount, null = sur devis
  yearlyMonthly: number | null; // monthly equivalent when billed yearly
  domDiscount: boolean;
  highlight: boolean;
  highlightLabel?: string;
  trialBadge?: string;
  alwaysFree?: boolean;
  ctaLabel: string;
  ctaHref: string;
  features: PlanFeature[];
}

interface AddOn {
  icon: string;
  title: string;
  price: string;
  description: string;
  includedIn?: string;
}

interface RevenueOption {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  priceDetail: string;
  color: string;
  borderColor: string;
  ctaLabel: string;
  ctaHref: string;
  badge?: string;
}

interface FaqItem {
  q: string;
  a: string;
}

/* ------------------------------------------------------------------ */
/* Données                                                             */
/* ------------------------------------------------------------------ */

const PLANS: PlanUI[] = [
  {
    id: 'FREE',
    icon: '🌱',
    label: 'Gratuit',
    tagline: "L'essentiel citoyen, sans jamais payer.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthly: null,
    domDiscount: false,
    highlight: false,
    alwaysFree: true,
    ctaLabel: 'Commencer gratuitement',
    ctaHref: '/inscription',
    features: [
      { label: 'Comparateur de prix (scan EAN)', included: true },
      { label: 'Observatoire des prix DOM', included: true },
      { label: 'Marchés locaux & Petits commerces', included: true },
      { label: 'Enquêtes éditoriales (eau, carburants)', included: true },
      { label: '10 recherches/jour', included: true },
      { label: '1 territoire', included: true },
      { label: 'Alertes prix', included: false },
      { label: 'Historique avancé', included: false },
      { label: 'Contacts directs commerçants', included: false },
    ],
  },
  {
    id: 'CITIZEN_PREMIUM',
    icon: '⭐',
    label: 'Citoyen',
    tagline: "L'outil citoyen complet. Moins d'un café par mois.",
    monthlyPrice: 3.99,
    yearlyPrice: 39,
    yearlyMonthly: 3.19,
    domDiscount: false,
    highlight: true,
    highlightLabel: 'Le plus populaire',
    trialBadge: '✨ 7 jours offerts — sans carte bancaire',
    ctaLabel: "Commencer l'essai gratuit 7j",
    ctaHref: '/subscribe?plan=CITIZEN_PREMIUM&trial=true',
    features: [
      { label: 'Tout le plan Gratuit', included: true },
      { label: 'Alertes prix personnalisées', included: true },
      { label: 'Historique 12 mois', included: true },
      { label: 'Scan OCR factures', included: true },
      { label: 'Contacts directs commerçants & producteurs', included: true },
      { label: 'Conférence expert (eau, carburants)', included: true },
      { label: '2 territoires', included: true },
      { label: 'Export CSV', included: true },
      { label: 'Multi-territoires (5+)', included: false },
      { label: 'Assistant IA illimité', included: false },
    ],
  },
  {
    id: 'PRO',
    icon: '🚀',
    label: 'Pro',
    tagline: 'Pour pros, associations et analystes.',
    monthlyPrice: 9.99,
    yearlyPrice: 95.88,
    yearlyMonthly: 7.99,
    domDiscount: true,
    highlight: false,
    trialBadge: '✨ 7 jours offerts',
    ctaLabel: 'Essayer Pro 7 jours',
    ctaHref: '/subscribe?plan=PRO&trial=true',
    features: [
      { label: 'Tout Citoyen +', included: true },
      { label: '5 territoires', included: true },
      { label: 'Export JSON & PDF', included: true },
      { label: 'Assistant IA illimité', included: true },
      { label: 'Rapport mensuel PDF automatique', included: true },
      { label: '-30% résidents DOM', included: true },
      { label: 'Listes équipe partagées', included: false },
      { label: 'Accès API', included: false },
    ],
  },
  {
    id: 'BUSINESS',
    icon: '💼',
    label: 'Business',
    tagline: 'Pour équipes, entreprises et exploitation intensive.',
    monthlyPrice: 49,
    yearlyPrice: 468,
    yearlyMonthly: 39,
    domDiscount: true,
    highlight: false,
    trialBadge: '✨ 7 jours offerts',
    ctaLabel: 'Essayer Business 7 jours',
    ctaHref: '/subscribe?plan=BUSINESS&trial=true',
    features: [
      { label: 'Tout Pro +', included: true },
      { label: '10 territoires', included: true },
      { label: 'Listes partagées équipe', included: true },
      { label: 'Tableau de bord budget', included: true },
      { label: 'Accès API basique', included: true },
      { label: 'Support prioritaire', included: true },
      { label: 'Rapports auto institutionnels', included: false },
      { label: 'Open-data export', included: false },
    ],
  },
];

const ADD_ONS: AddOn[] = [
  {
    icon: '🗺️',
    title: 'Territoire supplémentaire',
    price: '+1,99 €/mois/territoire',
    description: 'Ajoutez un territoire à tout plan',
  },
  {
    icon: '🔔',
    title: 'Alertes SMS',
    price: '+0,99 €/mois',
    description: 'Recevez vos alertes par SMS en plus des notifications',
    includedIn: 'Inclus Citoyen+',
  },
  {
    icon: '📰',
    title: 'Lettre hebdo économique',
    price: '+0,99 €/mois',
    description: 'Analyse économique DOM · Vie chère · Tendances',
    includedIn: 'Inclus PRO+',
  },
  {
    icon: '📊',
    title: 'Rapport à la demande',
    price: '9,99 €/rapport',
    description: 'Rapport PDF personnalisé sur votre territoire ou produit',
  },
  {
    icon: '🎓',
    title: 'Accès conférences expert',
    price: '2,99 €/accès',
    description: 'Conférences institutionnelles eau, carburants, etc.',
    includedIn: 'Inclus Citoyen+',
  },
  {
    icon: '📸',
    title: 'Crédits collecte terrain',
    price: 'dès 4,99 €',
    description: '10 relevés terrain rémunérés, convertibles en crédits abonnement',
  },
];

const REVENUE_OPTIONS: RevenueOption[] = [
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Don Citoyen',
    subtitle: "Soutenir l'Observatoire",
    description:
      "Un don unique pour soutenir la mission citoyenne : surveiller les prix et lutter contre la vie chère outre-mer. Chaque contribution finance les serveurs, les relevés terrain et le développement de l'application.",
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
      "Ateliers pratiques sur les droits des consommateurs, la lecture des prix, le BQP et l'utilisation de l'observatoire. Format présentiel ou visioconférence. Attestation de formation fournie.",
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
      "Parrainez un proche et recevez chacun 1 mois offert sur votre abonnement. Vos filleuls bénéficient d'un accès Premium 30 jours gratuit. Cumulable, sans limite de parrainages.",
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
      "Contribuez en relevant des prix dans votre enseigne locale et gagnez des bons d'achat ou des réductions d'abonnement. Programme ouvert à tous — aucune compétence technique requise, juste un smartphone.",
    price: 'Crédits offerts',
    priceDetail: "réductions abonnement ou bons d'achat partenaires",
    color: 'from-orange-900/30 to-red-900/20',
    borderColor: 'border-orange-700/40',
    ctaLabel: '📸 Devenir contributeur',
    ctaHref: '/contribuer',
    badge: '🤝 Communauté',
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui. Vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre compte. La différence de prix est calculée au prorata du mois en cours.',
  },
  {
    q: 'Comment fonctionne la remise DOM −30 % ?',
    a: 'La remise de 30 % est automatiquement appliquée aux plans Pro et Business pour les résidents des territoires DOM·ROM·COM. Elle est activée lors de votre abonnement dès que vous indiquez votre territoire.',
  },
  {
    q: 'Comment fonctionnent les liens vers les opérateurs ?',
    a: "Les liens « Voir l'offre » ouvrent toujours le site officiel de l'opérateur dans un nouvel onglet, afin que vous finalisiez directement votre choix sur la plateforme concernée.",
  },
  {
    q: 'Est-ce que mes données sont partagées avec des tiers ?',
    a: 'Non. Vos données personnelles et vos listes de prix ne sont jamais vendues ni partagées. Les données B2B proposées dans la section "Revenus additionnels" sont exclusivement des agrégats anonymisés.',
  },
  {
    q: 'Puis-je annuler sans frais ?',
    a: "Oui, à tout moment. Il n'y a pas de période d'engagement ni de frais de résiliation. Pour les plans annuels, le montant restant est remboursé au prorata.",
  },
  {
    q: "Qu'est-ce que le Bouclier Qualité Prix (BQP) mentionné dans l'app ?",
    a: "Le BQP est un dispositif légal (décret n°2012-848) qui impose un plafond de +30 % de surcoût vs métropole sur une liste de produits négociée annuellement. L'application vous alerte automatiquement quand ce seuil est dépassé.",
  },
  {
    q: "L'accès API est-il disponible en dehors du plan Institution ?",
    a: 'Un accès API limité est inclus dans le plan Business. Pour un accès complet avec quota personnalisé, contactez-nous via le formulaire "Données & Rapports B2B".',
  },
  {
    q: "Comment fonctionne l'essai gratuit 7 jours ?",
    a: "L'essai est activé sans carte bancaire. Vous accédez à toutes les fonctionnalités du plan choisi pendant 7 jours. Vous recevez un rappel 2 jours avant l'expiration. Si vous ne souhaitez pas continuer, aucun prélèvement n'est effectué.",
  },
  {
    q: 'Les add-ons peuvent-ils être annulés séparément ?',
    a: 'Oui. Chaque add-on est géré indépendamment et peut être résilié à tout moment depuis votre compte sans affecter votre plan principal.',
  },
];

/* ------------------------------------------------------------------ */
/* Composant principal                                                 */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [marketOpen, setMarketOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Track pricing page view for conversion analytics
  useEffect(() => {
    trackConversion({ type: 'pricing_view' });
  }, []);

  function formatPrice(n: number): string {
    return n % 1 === 0 ? `${n}` : n.toFixed(2).replace('.', ',');
  }

  return (
    <>
      <Helmet>
        <title>Abonnements &amp; Tarifs — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Choisissez votre formule : Gratuit, Citoyen 3,99€/mo, Pro 9,99€/mo ou Business 49€/mo. Essai 7 jours inclus sur tous les plans payants."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/pricing" />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ====================================================== */}
          {/* 1. Hero                                                 */}
          {/* ====================================================== */}
          <div className="mb-10 animate-fade-in">
            <HeroImage
              src={PAGE_HERO_IMAGES.pricing}
              alt="Abonnements & Tarifs A KI PRI SA YÉ"
              gradient="from-slate-900 to-indigo-950"
              height="h-40 sm:h-56"
            >
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow">
                Abonnements &amp; Tarifs
              </h1>
              <p className="text-slate-200 text-sm drop-shadow max-w-2xl mt-1">
                Choisissez d’abord le bon parcours : découvrir gratuitement, suivre vos économies ou
                équiper une organisation.
              </p>
            </HeroImage>

            {/* Badge row */}
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {[
                '🆓 Gratuit à vie pour l’essentiel',
                '⏱️ Essai 7 jours sur les plans payants',
                '🌴 -30% résidents DOM',
              ].map((badge) => (
                <span
                  key={badge}
                  className="px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-full text-xs font-medium text-slate-200"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* ====================================================== */}
          {/* Conversion Banner (FOMO + countdown)                   */}
          {/* ====================================================== */}
          <PricingConversionBanner />

          <section className="mb-10 grid gap-4 lg:grid-cols-3">
            {[
              {
                title: 'Je découvre',
                description: 'Comparer les prix, comprendre le service et tester sans friction.',
                cta: 'Le plan Gratuit est le bon point de départ.',
              },
              {
                title: 'Je veux aller plus loin',
                description:
                  'Alertes, historique et suivi plus poussé pour gagner du temps et de l’argent.',
                cta: 'Le plan Citoyen concentre l’essentiel premium.',
              },
              {
                title: 'Je représente une structure',
                description:
                  'Besoin d’accès multi-utilisateurs, de données ou d’un cadre institutionnel.',
                cta: 'Les offres Pro, Business et Institution sont dédiées à cet usage.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
              >
                <h2 className="text-base font-bold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                <p className="mt-3 text-sm font-medium text-indigo-300">{item.cta}</p>
              </div>
            ))}
          </section>

          {/* ====================================================== */}
          {/* 2. Mini étude de marché (collapsible)                  */}
          {/* ====================================================== */}
          <section className="mb-10 bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
            <button
              onClick={() => setMarketOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-800/50 transition-colors"
              aria-expanded={marketOpen}
            >
              <span className="text-base font-bold text-white">
                📊 Pourquoi ces prix ? — contexte et positionnement
              </span>
              {marketOpen ? (
                <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
              )}
            </button>

            {marketOpen && (
              <div className="px-6 pb-6">
                {/* Comparison table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 pr-4 text-slate-400 font-semibold text-xs uppercase tracking-wide">
                          App / Service
                        </th>
                        <th className="text-left py-2 pr-4 text-slate-400 font-semibold text-xs uppercase tracking-wide">
                          Cible
                        </th>
                        <th className="text-left py-2 pr-4 text-slate-400 font-semibold text-xs uppercase tracking-wide">
                          Prix base
                        </th>
                        <th className="text-left py-2 text-slate-400 font-semibold text-xs uppercase tracking-wide">
                          Points clés
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {[
                        {
                          name: 'UFC-Que Choisir',
                          target: 'Consommateurs FR',
                          price: '0–35 €/an',
                          keys: 'Généraliste France métro, peu de DOM',
                          highlight: false,
                        },
                        {
                          name: 'Jow (courses)',
                          target: 'Familles',
                          price: '0–4,99 €/mo',
                          keys: 'Recettes+courses, pas comparateur prix',
                          highlight: false,
                        },
                        {
                          name: 'Too Good To Go',
                          target: 'Conso anti-gaspi',
                          price: 'Gratuit',
                          keys: 'Invendus seulement, pas de prix DOM',
                          highlight: false,
                        },
                        {
                          name: 'Pandaloc / Hosman',
                          target: 'Immobilier',
                          price: '0–200 €',
                          keys: 'Hors sujet, marché différent',
                          highlight: false,
                        },
                        {
                          name: 'A KI PRI SA YÉ',
                          target: 'Citoyens DOM',
                          price: '0–49 €/mo',
                          keys: 'Seul outil 100% dédié aux DOM-TOM',
                          highlight: true,
                        },
                      ].map((row) => (
                        <tr key={row.name} className={row.highlight ? 'bg-indigo-900/30' : ''}>
                          <td
                            className={`py-2.5 pr-4 font-semibold ${row.highlight ? 'text-indigo-300' : 'text-slate-200'}`}
                          >
                            {row.name}
                          </td>
                          <td className="py-2.5 pr-4 text-slate-400 text-xs">{row.target}</td>
                          <td
                            className={`py-2.5 pr-4 text-xs font-mono ${row.highlight ? 'text-indigo-300 font-bold' : 'text-slate-300'}`}
                          >
                            {row.price}
                          </td>
                          <td
                            className={`py-2.5 text-xs ${row.highlight ? 'text-indigo-200 font-semibold' : 'text-slate-400'}`}
                          >
                            {row.keys}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Key insights */}
                <div className="mt-5 grid sm:grid-cols-3 gap-3">
                  <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-xl p-4">
                    <p className="text-sm font-bold text-indigo-300 mb-1">
                      🎯 Aucun concurrent direct en DOM
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Marché non adressé, opportunité unique
                    </p>
                  </div>
                  <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4">
                    <p className="text-sm font-bold text-emerald-300 mb-1">
                      💶 Prix DOM: +17 à +40% vs métropole
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Valeur réelle de l'économie potentielle
                    </p>
                  </div>
                  <div className="bg-amber-900/30 border border-amber-700/40 rounded-xl p-4">
                    <p className="text-sm font-bold text-amber-300 mb-1">
                      📱 3,99 €/mo = moins d'un café
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      ROI immédiat dès 1 produit suivi
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ====================================================== */}
          {/* 3. Toggle mensuel / annuel                             */}
          {/* ====================================================== */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-full p-1 shadow-lg">
              <button
                onClick={() => setCycle('monthly')}
                aria-pressed={cycle === 'monthly'}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  cycle === 'monthly'
                    ? 'bg-white text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setCycle('yearly')}
                aria-pressed={cycle === 'yearly'}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                  cycle === 'yearly'
                    ? 'bg-white text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Annuel
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-700/60 text-emerald-300 font-bold">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* ====================================================== */}
          {/* 4. Plans grid (4 plans)                                */}
          {/* ====================================================== */}
          <section
            className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Plans d'abonnement"
          >
            {PLANS.map((plan) => {
              const displayPrice =
                plan.monthlyPrice === null
                  ? null
                  : cycle === 'yearly'
                    ? plan.yearlyMonthly
                    : plan.monthlyPrice;

              const yearlyTotal =
                cycle === 'yearly' && plan.yearlyPrice !== null && plan.yearlyPrice > 0
                  ? plan.yearlyPrice
                  : null;

              return (
                <article
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl p-6 ${
                    plan.highlight
                      ? 'border-2 border-indigo-500 bg-indigo-950/60 shadow-xl shadow-indigo-900/30'
                      : 'border border-slate-700/60 bg-slate-900/70 shadow-sm'
                  }`}
                >
                  {/* Popular badge */}
                  {plan.highlight && plan.highlightLabel && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      {plan.highlightLabel}
                    </div>
                  )}

                  {/* Always free / DOM badge */}
                  {plan.alwaysFree && (
                    <div className="absolute top-4 right-4">
                      <span className="text-xs bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                        Toujours gratuit
                      </span>
                    </div>
                  )}
                  {plan.domDiscount && !plan.alwaysFree && (
                    <div className="absolute top-4 right-4">
                      <span className="text-xs bg-amber-900/60 border border-amber-700/50 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                        -30% DOM
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    {/* Icon + name */}
                    <div className="flex items-center gap-2 mb-1 mt-1">
                      <span className="text-2xl" aria-hidden="true">
                        {plan.icon}
                      </span>
                      <h2 className="text-lg font-bold text-white">{plan.label}</h2>
                    </div>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">{plan.tagline}</p>

                    {/* Trial badge */}
                    {plan.trialBadge && (
                      <div className="mb-4 px-3 py-1.5 bg-indigo-900/40 border border-indigo-700/40 rounded-lg text-xs text-indigo-300 font-medium text-center">
                        {plan.trialBadge}
                      </div>
                    )}

                    {/* Price block */}
                    <div className="mb-5 p-4 bg-slate-800/60 rounded-xl">
                      {displayPrice === null ? (
                        <p className="text-2xl font-extrabold text-white">Sur devis</p>
                      ) : displayPrice === 0 ? (
                        <>
                          <p className="text-2xl font-extrabold text-emerald-400">0 €</p>
                          <p className="text-xs text-slate-400 mt-0.5">Pour toujours</p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-extrabold text-white">
                            {formatPrice(displayPrice)} €
                            <span className="text-sm font-medium text-slate-400 ml-1">/mois</span>
                          </p>
                          {yearlyTotal !== null && (
                            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                              <Zap className="w-3 h-3" aria-hidden="true" />
                              soit {formatPrice(yearlyTotal)} €/an
                            </p>
                          )}
                          {plan.domDiscount && cycle === 'monthly' && (
                            <p className="text-xs text-amber-400 mt-0.5">−30 % DOM disponible *</p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2" aria-label={`Fonctionnalités ${plan.label}`}>
                      {plan.features.map((feat) => (
                        <li
                          key={feat.label}
                          className={`flex items-start gap-2 text-xs leading-relaxed ${
                            feat.included ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {feat.included ? (
                            <Check
                              className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                          ) : (
                            <X
                              className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                          )}
                          {feat.label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <Link
                    to={plan.ctaHref}
                    className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:opacity-90 ${
                      plan.highlight
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40'
                        : plan.monthlyPrice === 0
                          ? 'bg-slate-700 hover:bg-slate-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                    }`}
                  >
                    {plan.ctaLabel}
                  </Link>
                </article>
              );
            })}
          </section>

          {/* ====================================================== */}
          {/* 5. Institution plan (full-width)                       */}
          {/* ====================================================== */}
          <article className="mt-5 bg-slate-900/70 border border-slate-700/60 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
            <div className="shrink-0 text-4xl" aria-hidden="true">
              🏛️
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-white">Institution</h2>
                <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                  Sur devis · À partir de 500 €/an
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Collectivités, organismes publics, chercheurs, presse.
              </p>
              <ul className="grid sm:grid-cols-2 gap-1.5">
                {[
                  'Open-data complet',
                  'API complète avec quota personnalisé',
                  'Données agrégées anonymisées',
                  'Support dédié prioritaire',
                  'Rapports automatiques institutionnels',
                  '20 territoires couverts',
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-xs text-slate-300">
                    <BadgeCheck
                      className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="shrink-0">
              <Link
                to="/contact?subject=licence-institutionnelle"
                className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition text-sm whitespace-nowrap"
              >
                <Building2 className="w-4 h-4" aria-hidden="true" />
                Demander un devis
              </Link>
            </div>
          </article>

          {/* ====================================================== */}
          {/* 6. Add-ons                                             */}
          {/* ====================================================== */}
          <section className="mt-16" aria-labelledby="addons-heading">
            <div className="text-center mb-8">
              <h2 id="addons-heading" className="text-2xl font-extrabold text-white">
                🧩 Options complémentaires
              </h2>
              <p className="mt-2 text-slate-400 text-sm">
                À consulter après avoir choisi votre plan principal.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ADD_ONS.map((addon) => (
                <div
                  key={addon.title}
                  className="flex gap-4 items-start bg-slate-900/70 border border-slate-700/60 rounded-xl p-5 hover:border-slate-600 transition-colors"
                >
                  <span className="text-2xl shrink-0" aria-hidden="true">
                    {addon.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white">{addon.title}</h3>
                      {addon.includedIn && (
                        <span className="text-xs bg-emerald-900/50 border border-emerald-700/40 text-emerald-400 px-1.5 py-0.5 rounded-full">
                          {addon.includedIn}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-300 font-semibold mb-1">{addon.price}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{addon.description}</p>
                  </div>
                  <Plus className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
                </div>
              ))}
            </div>
          </section>

          {/* ====================================================== */}
          {/* 7. Trial explanation box                               */}
          {/* ====================================================== */}
          <section className="mt-10 bg-indigo-950/60 border border-indigo-700/50 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="shrink-0 p-3 bg-indigo-800/50 rounded-xl">
                <Clock className="w-7 h-7 text-indigo-300" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-3">
                  ✨ Essai gratuit 7 jours — Comment ça marche ?
                </h2>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {[
                    { icon: '🚫', label: 'Aucune carte bancaire requise pour démarrer' },
                    { icon: '🔓', label: 'Accès à TOUTES les fonctionnalités du plan choisi' },
                    { icon: '🔔', label: 'Rappel 2 jours avant l’expiration de l’essai' },
                    { icon: '❌', label: 'Annulation en 1 clic, à tout moment' },
                  ].map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center gap-3 text-sm text-indigo-200"
                    >
                      <span className="text-base" aria-hidden="true">
                        {item.icon}
                      </span>
                      {item.label}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to="/subscribe?plan=CITIZEN_PREMIUM&trial=true"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
                  >
                    <Zap className="w-4 h-4" aria-hidden="true" />
                    Démarrer l'essai gratuit
                  </Link>
                  <Link
                    to="/inscription"
                    className="inline-flex items-center gap-2 border border-indigo-600/60 text-indigo-300 hover:bg-indigo-900/40 font-semibold px-5 py-2.5 rounded-xl text-sm transition"
                  >
                    Commencer avec le plan Gratuit
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ====================================================== */}
          {/* 8. DOM discount box                                    */}
          {/* ====================================================== */}
          <section className="mt-6 bg-amber-950/50 border border-amber-700/50 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="shrink-0 p-3 bg-amber-800/50 rounded-xl">
                <TrendingDown className="w-7 h-7 text-amber-300" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">
                  🌴 -30% pour les résidents des territoires DOM · ROM · COM
                </h2>
                <p className="text-sm text-amber-200/80 leading-relaxed max-w-2xl">
                  La vie est déjà chère en outre-mer. Nous appliquons automatiquement une remise de
                  30&nbsp;% sur les plans Pro et Business pour tous les résidents des DOM-TOM. Cette
                  remise est activée dès que vous renseignez votre territoire lors de l'abonnement.
                </p>
              </div>
            </div>
          </section>

          {/* ====================================================== */}
          {/* 9. Revenue options                                     */}
          {/* ====================================================== */}
          <section id="partners" className="mt-16" aria-labelledby="revenus-heading">
            <div className="text-center mb-10">
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-emerald-500 mb-3">
                Hors abonnements
              </span>
              <h2 id="revenus-heading" className="text-2xl sm:text-3xl font-extrabold text-white">
                Partenariats, soutien et demandes spécifiques
              </h2>
              <p className="mt-3 text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
                Cette section ne remplace pas les offres grand public. Elle regroupe les demandes
                particulières : partenariats locaux, accompagnement, dons et besoins B2B.
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
                    <div className="p-2 bg-white/10 rounded-xl text-white">{opt.icon}</div>
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
            <p className="mt-6 text-center text-xs text-slate-500">
              * Les dons versés à une association citoyenne reconnue peuvent être déductibles des
              impôts à hauteur de 66 %. Contactez-nous pour les modalités.
            </p>
          </section>

          {/* ====================================================== */}
          {/* 10. FAQ                                                */}
          {/* ====================================================== */}
          <section className="mt-16" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-2xl font-extrabold text-white text-center mb-8">
              Questions fréquentes
            </h2>
            <div className="max-w-3xl mx-auto divide-y divide-slate-800">
              {FAQ_ITEMS.map((item, idx) => (
                <div key={idx}>
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 py-4 text-left"
                    aria-expanded={openFaq === idx}
                  >
                    <span className="text-sm font-semibold text-white">{item.q}</span>
                    {openFaq === idx ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                  {openFaq === idx && (
                    <p className="pb-4 text-sm text-slate-400 leading-relaxed">{item.a}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ====================================================== */}
          {/* 11. Final CTA                                          */}
          {/* ====================================================== */}
          <div className="mt-16 text-center">
            <div className="inline-block bg-gradient-to-r from-indigo-700 to-blue-700 rounded-2xl p-8 text-white max-w-2xl w-full shadow-xl shadow-indigo-900/40">
              <div className="flex justify-center mb-3">
                <Shield className="w-8 h-8 text-indigo-200" aria-hidden="true" />
              </div>
              <p className="text-2xl font-extrabold mb-2">Prêt à rejoindre la mission ?</p>
              <p className="text-blue-200 text-sm mb-6">
                Plus de 5 000 citoyens observent déjà les prix pour lutter contre la vie chère dans
                les DOM. Rejoins-les gratuitement.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/inscription"
                  className="bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 transition text-sm"
                >
                  Commencer gratuitement →
                </Link>
                <Link
                  to="/subscribe?plan=CITIZEN_PREMIUM&trial=true"
                  className="bg-indigo-500/40 hover:bg-indigo-500/60 border border-indigo-400/50 text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
                >
                  Essai gratuit 7 jours
                </Link>
                <Link
                  to="/contact"
                  className="border border-white/30 text-white/80 hover:bg-white/10 font-semibold px-6 py-3 rounded-xl transition text-sm"
                >
                  <Phone className="w-3.5 h-3.5 inline mr-1.5" aria-hidden="true" />
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
