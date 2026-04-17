/**
 * PricingComparator — 6-plan comparison table with social proof, badges, and cycle toggle
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Star } from 'lucide-react';

type BillingCycle = 'monthly' | 'yearly';

interface PlanFeature {
  label: string;
  included: boolean;
}

interface ComparatorPlan {
  id: string;
  icon: string;
  label: string;
  tagline: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  yearlyMonthly: number | null;
  highlight: boolean;
  highlightLabel?: string;
  socialProof?: string;
  alwaysFree?: boolean;
  ctaLabel: string;
  features: PlanFeature[];
}

const PLANS: ComparatorPlan[] = [
  {
    id: 'FREE',
    icon: '🌱',
    label: 'Gratuit',
    tagline: "L'essentiel citoyen, sans jamais payer.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthly: null,
    highlight: false,
    alwaysFree: true,
    ctaLabel: 'Commencer gratuitement',
    features: [
      { label: 'Comparateur de prix (scan EAN)', included: true },
      { label: 'Observatoire des prix DOM', included: true },
      { label: '10 recherches/jour', included: true },
      { label: '1 territoire', included: true },
      { label: 'Alertes prix', included: false },
      { label: 'Export CSV', included: false },
      { label: 'API Access', included: false },
    ],
  },
  {
    id: 'CITIZEN_PREMIUM',
    icon: '⭐',
    label: 'Citoyen',
    tagline: "L'outil citoyen complet.",
    monthlyPrice: 3.99,
    yearlyPrice: 39,
    yearlyMonthly: 3.19,
    highlight: true,
    highlightLabel: '⭐ Populaire',
    socialProof: '90% des nouveaux abonnés choisissent ce plan',
    ctaLabel: 'Choisir ce plan',
    features: [
      { label: 'Tout le plan Gratuit', included: true },
      { label: 'Alertes prix personnalisées', included: true },
      { label: 'Historique 12 mois', included: true },
      { label: 'Scan OCR factures', included: true },
      { label: '2 territoires', included: true },
      { label: 'Export CSV', included: true },
      { label: 'API Access', included: false },
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
    highlight: false,
    ctaLabel: 'Choisir ce plan',
    features: [
      { label: 'Tout Citoyen +', included: true },
      { label: '5 territoires', included: true },
      { label: 'Export JSON & PDF', included: true },
      { label: 'Assistant IA illimité', included: true },
      { label: 'Rapport mensuel PDF auto', included: true },
      { label: '-30% résidents DOM', included: true },
      { label: 'API Access', included: false },
    ],
  },
  {
    id: 'BUSINESS',
    icon: '💼',
    label: 'Business',
    tagline: 'Pour équipes et entreprises.',
    monthlyPrice: 49,
    yearlyPrice: 468,
    yearlyMonthly: 39,
    highlight: false,
    ctaLabel: 'Choisir ce plan',
    features: [
      { label: 'Tout Pro +', included: true },
      { label: '10 territoires', included: true },
      { label: 'Listes partagées équipe', included: true },
      { label: 'Tableau de bord budget', included: true },
      { label: 'Accès API basique', included: true },
      { label: 'Support prioritaire', included: true },
      { label: 'Open-data export', included: false },
    ],
  },
  {
    id: 'ENTERPRISE',
    icon: '🏢',
    label: 'Enterprise',
    tagline: 'Solution sur-mesure pour grandes organisations.',
    monthlyPrice: null,
    yearlyPrice: null,
    yearlyMonthly: null,
    highlight: false,
    ctaLabel: 'Nous contacter',
    features: [
      { label: 'Tout Business +', included: true },
      { label: 'Historique complet', included: true },
      { label: 'Analyses prédictives', included: true },
      { label: 'API étendue', included: true },
      { label: 'Accompagnement dédié', included: true },
      { label: 'SLA garanti', included: true },
      { label: 'Facturation sur devis', included: true },
    ],
  },
  {
    id: 'RESEARCH',
    icon: '🔬',
    label: 'Recherche',
    tagline: 'Pour institutions publiques et chercheurs.',
    monthlyPrice: null,
    yearlyPrice: null,
    yearlyMonthly: null,
    highlight: false,
    ctaLabel: 'Nous contacter',
    features: [
      { label: 'Accès données ouvertes complet', included: true },
      { label: 'Export open-data', included: true },
      { label: 'API illimitée', included: true },
      { label: 'Rapport institutionnel', included: true },
      { label: 'Conformité RGPD audit', included: true },
      { label: 'Support institutionnel', included: true },
      { label: 'Convention annuelle', included: true },
    ],
  },
];

interface PricingComparatorProps {
  highlightPlanId?: string;
}

export default function PricingComparator({ highlightPlanId }: PricingComparatorProps) {
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<BillingCycle>('yearly');

  const getPrice = (plan: ComparatorPlan): string => {
    if (plan.alwaysFree) return 'Gratuit';
    if (plan.monthlyPrice === null) return 'Sur devis';
    if (cycle === 'yearly' && plan.yearlyMonthly !== null) {
      return `${plan.yearlyMonthly.toFixed(2)} €/mois`;
    }
    return `${(plan.monthlyPrice ?? 0).toFixed(2)} €/mois`;
  };

  const getYearlyNote = (plan: ComparatorPlan): string | null => {
    if (plan.alwaysFree || plan.yearlyPrice === null) return null;
    if (cycle === 'yearly') return `${plan.yearlyPrice.toFixed(0)} € facturés annuellement`;
    return null;
  };

  const handleCTA = (plan: ComparatorPlan) => {
    if (plan.id === 'ENTERPRISE' || plan.id === 'RESEARCH') {
      navigate('/contact');
    } else if (plan.id === 'FREE') {
      navigate('/inscription');
    } else {
      navigate(`/subscribe?plan=${plan.id}&cycle=${cycle}`);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Cycle Toggle */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-1 bg-white/[0.06] border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setCycle('monthly')}
            aria-pressed={cycle === 'monthly'}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              cycle === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setCycle('yearly')}
            aria-pressed={cycle === 'yearly'}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              cycle === 'yearly' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Annuel
            <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full">-20%</span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isHighlighted = plan.highlight || plan.id === highlightPlanId;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                isHighlighted
                  ? 'border-blue-500 bg-blue-900/20 ring-2 ring-blue-500/30 shadow-lg shadow-blue-900/20'
                  : 'border-white/10 bg-white/[0.04] hover:border-white/20'
              }`}
            >
              {/* Highlight Badge */}
              {plan.highlightLabel && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    <Star className="w-3 h-3" />
                    {plan.highlightLabel}
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{plan.icon}</span>
                  <h3 className="text-xl font-bold text-white">{plan.label}</h3>
                </div>
                <p className="text-gray-400 text-sm">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-3xl font-extrabold text-white">{getPrice(plan)}</p>
                {getYearlyNote(plan) && (
                  <p className="text-gray-400 text-xs mt-1">{getYearlyNote(plan)}</p>
                )}
              </div>

              {/* Social Proof */}
              {plan.socialProof && (
                <div className="mb-4 text-xs text-blue-300 bg-blue-900/20 border border-blue-500/20 rounded-lg px-3 py-2">
                  ✨ {plan.socialProof}
                </div>
              )}

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2 text-sm">
                    {f.included ? (
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={f.included ? 'text-gray-200' : 'text-gray-500'}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleCTA(plan)}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 ${
                  isHighlighted
                    ? 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-400'
                    : plan.id === 'FREE'
                      ? 'bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/20 focus:ring-white/20'
                      : 'bg-white/[0.06] hover:bg-white/[0.10] text-gray-200 border border-white/10 focus:ring-white/10'
                }`}
              >
                {plan.ctaLabel}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <p className="text-center text-gray-500 text-xs mt-8">
        Résiliation en 1 clic · Sans engagement · Facturation transparente
      </p>
    </div>
  );
}
