import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Minus } from 'lucide-react'
import { HeroImage } from '../components/ui/HeroImage'
import { PAGE_HERO_IMAGES } from '../config/imageAssets'

/* ------------------------------------------------------------------ */
/* Données des plans — source unique pour l'UI                         */
/* Synchronisées avec billing/plans.ts + Subscribe.tsx                */
/* ------------------------------------------------------------------ */

interface PlanUI {
  id: string
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
      'Export CSV basique',
      '2 territoires',
    ],
    notIncluded: [
      'Multi-territoires (5+)',
      'Export avancé',
    ],
  },
  {
    id: 'PRO',
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
    ],
    notIncluded: [
      'Listes partagées équipe',
      'Tableau de bord budget',
    ],
  },
  {
    id: 'BUSINESS',
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
      'Historique avancé',
      'Alertes prix',
      'Export avancé',
      '10 territoires',
      'Listes partagées équipe',
      'Tableau de bord budget',
    ],
    notIncluded: [
      'Rapports automatiques',
      'Accès API',
    ],
  },
  {
    id: 'INSTITUTION',
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
      'Accès API',
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Composant principal                                                  */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')

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
              Commence gratuitement. Passe ensuite au niveau adapté à ton usage.
            </p>
          </HeroImage>
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
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    Recommandé
                  </div>
                )}

                <div className="flex-1">
                  {/* Nom & tagline */}
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {plan.label}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {plan.tagline}
                  </p>

                  {/* Prix */}
                  <div className="mt-4">
                    {price === null ? (
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        Sur devis
                      </p>
                    ) : price === 0 ? (
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
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
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
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
                  <ul className="mt-5 space-y-1.5" aria-label={`Fonctionnalités ${plan.label}`}>
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
        <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          * Remise de 30 % applicable aux plans Pro et Business pour les résidents des territoires
          DOM · ROM · COM — activée automatiquement lors de l'abonnement.
        </p>

        {/* Lien vers tarifs détaillés */}
        <div className="mt-6 text-center">
          <Link
            to="/tarifs-details"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Voir la comparaison complète des fonctionnalités →
          </Link>
        </div>

      </div>
    </div>
  )
}
