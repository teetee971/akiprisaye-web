// src/pages/Pricing.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { CivicButton } from '@/components/ui/CivicButton';
import { DataBadge } from '@/components/ui/DataBadge';
import { LimitNote } from '@/components/ui/LimitNote';
import { UltraSimpleToggle } from '@/components/ui/UltraSimpleToggle';

const plans = [
  {
    id: 'FREE',
    title: 'Citoyen – Gratuit',
    price: '0 €',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Accès essentiel pour tous',
    features: [
      'Liste de courses générique',
      'Carte des magasins',
      'Distances simples',
      'Sources publiques visibles',
      'Mode hors ligne basique',
    ],
    limits: [
      '1 territoire',
      'Historique 30 jours',
      'Pas d\'export',
    ],
  },
  {
    id: 'CITIZEN_PREMIUM',
    title: 'Citoyen Premium',
    price: '3,99 € / mois',
    priceMonthly: 3.99,
    priceYearly: 39,
    description: 'Pour optimiser ses dépenses quotidiennes',
    popular: true,
    features: [
      'Tout Gratuit +',
      'Optimisation multi-trajets',
      'Profils de foyers (INSEE)',
      'Export PDF',
      'Historique illimité',
      'Mode hors ligne renforcé',
    ],
    limits: [
      '3 territoires maximum',
      'Pas d\'API',
    ],
  },
  {
    id: 'PRO',
    title: 'Professionnel',
    price: '19 € / mois',
    priceMonthly: 19,
    priceYearly: 190,
    description: 'Veille économique locale',
    features: [
      'Tout Premium +',
      'Multi-territoires',
      'Tendances (hausse / baisse)',
      'Export CSV',
      'Support prioritaire',
    ],
    limits: [
      'API lecture seule',
      'Historique 2 ans',
    ],
    domDiscount: true,
  },
  {
    id: 'BUSINESS',
    title: 'Business',
    price: '99 € / mois',
    priceMonthly: 99,
    priceYearly: 990,
    description: 'Analyse territoriale structurée',
    features: [
      'Tout Pro +',
      'Tableaux de bord',
      'Rapports automatisés',
      'Accès API lecture (agrégée)',
      'Comptes multiples',
    ],
    limits: [
      'Historique 5 ans',
      'Pas de données concurrentielles',
    ],
    domDiscount: true,
  },
  {
    id: 'ENTERPRISE',
    title: 'Enterprise',
    price: 'Sur devis',
    priceRange: '2 500 € - 25 000 € / an',
    description: 'Analyse macro-territoriale',
    features: [
      'Tout Business +',
      'Multi-DOM / COM',
      'Historique complet',
      'Analyses prédictives',
      'Accompagnement dédié',
      'API étendue',
    ],
    limits: [
      'Secteur privé uniquement',
      'Pas de données sensibles',
    ],
  },
  {
    id: 'INSTITUTION',
    title: 'Institution',
    price: 'Licence publique',
    priceRange: '500 € - 50 000 € / an',
    description: 'Outil public numérique',
    features: [
      'Tout Enterprise +',
      'Rapports publics institutionnels',
      'Transparence totale',
      'Audit complet',
      'Support institutionnel',
      'Traçabilité complète',
    ],
    limits: [
      'Données 100% publiques',
      'Collectivités et organismes publics',
    ],
  },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isDOMTerritory, setIsDOMTerritory] = useState(false);

  const getDisplayPrice = (plan: typeof plans[0]) => {
    if (plan.id === 'FREE') return '0 €';
    if (plan.id === 'ENTERPRISE' || plan.id === 'INSTITUTION') return plan.priceRange;
    
    const isYearly = billingCycle === 'yearly';
    const basePrice = isYearly ? plan.priceYearly : plan.priceMonthly;
    const price = isDOMTerritory && plan.domDiscount ? basePrice * 0.7 : basePrice;
    
    return `${price.toFixed(2)} € / ${isYearly ? 'an' : 'mois'}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <GlassContainer className="max-w-7xl mx-auto p-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Un outil citoyen. Des usages professionnels.
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Les données sont publiques. Vous payez pour l'analyse, la clarté
            et le gain de temps.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className={billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}>
              Mensuel
            </span>
            <UltraSimpleToggle
              checked={billingCycle === 'yearly'}
              onChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <span className={billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}>
              Annuel
              <span className="ml-2 text-green-400 text-sm">(~17% d'économie)</span>
            </span>
          </div>

          {/* DOM Toggle */}
          <div className="flex items-center justify-center mb-8">
            <UltraSimpleToggle
              checked={isDOMTerritory}
              onChange={setIsDOMTerritory}
              label="Territoire DOM-ROM-COM (-30% sur Pro/Business)"
            />
          </div>

          <p className="text-sm text-gray-400 mb-4">
            Vous pouvez annuler à tout moment. •{' '}
            <Link to="/methodologie" className="text-blue-400 hover:underline">
              Comparer les plans en détail
            </Link>
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {plans.map((plan) => (
            <GlassCard
              key={plan.id}
              className={`flex flex-col ${
                plan.popular
                  ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/20'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 rounded-full text-sm font-bold">
                  POPULAIRE
                </div>
              )}

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{plan.title}</h2>
                <p className="text-3xl font-bold text-blue-400 mb-2">
                  {getDisplayPrice(plan)}
                </p>
                <p className="text-sm text-gray-400 mb-6">{plan.description}</p>

                {/* Features */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Inclus :</h3>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-300">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limits */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Limites :</h3>
                  <ul className="space-y-2">
                    {plan.limits.map((limit, idx) => (
                      <li key={idx} className="text-sm text-gray-400">
                        • {limit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Data Badge */}
                <div className="mb-6">
                  <DataBadge source="INSEE · OPMR · data.gouv.fr" />
                </div>

                <LimitNote>
                  Les données restent publiques et non modifiées.
                </LimitNote>
              </div>

              {/* CTA */}
              <div className="mt-6">
                <CivicButton
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    if (plan.id === 'FREE') {
                      window.location.href = '/';
                    } else if (plan.id === 'ENTERPRISE') {
                      window.location.href = '/contact?subject=devis-enterprise';
                    } else {
                      window.location.href = `/subscribe?plan=${plan.id}&cycle=${billingCycle}&dom=${isDOMTerritory}`;
                    }
                  }}
                >
                  {plan.id === 'ENTERPRISE'
                    ? 'Nous contacter'
                    : plan.id === 'FREE'
                    ? 'Commencer gratuitement'
                    : 'Choisir ce plan'}
                </CivicButton>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Transparency Section */}
        <GlassCard className="mb-12 bg-blue-900/10 border-blue-500/30">
          <h2 className="text-2xl font-bold text-white mb-4">Transparence totale</h2>
          <div className="space-y-3 text-gray-300">
            <p>
              <strong>Vous ne payez pas la donnée</strong>, vous payez le service :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Agrégation et mise à jour des sources publiques</li>
              <li>Calculs d'optimisation de trajets</li>
              <li>Infrastructure et hébergement sécurisé</li>
              <li>Support technique et maintenance</li>
            </ul>
            <p className="text-sm text-gray-400 mt-4">
              Aucune marque. Aucun sponsor. Aucune donnée vendue. Résiliation en 1 clic.
            </p>
          </div>
        </GlassCard>

        {/* FAQ */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-8 text-center">FAQ</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                Pourquoi payer si les données sont publiques ?
              </h3>
              <p className="text-gray-300 text-sm">
                Les données brutes sont gratuites, mais leur agrégation, leur mise en forme
                accessible et leur maintenance ont un coût réel.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                Les citoyens sont-ils exclus ?
              </h3>
              <p className="text-gray-300 text-sm">
                Non. L'essentiel reste gratuit : liste de courses, carte des magasins,
                géolocalisation et scanner basique.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                Comment annuler mon abonnement ?
              </h3>
              <p className="text-gray-300 text-sm">
                En 1 clic depuis votre compte. Aucune justification requise. Aucune relance.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                Mes données personnelles sont-elles stockées ?
              </h3>
              <p className="text-gray-300 text-sm">
                Non. Tout est en local (localStorage/IndexedDB). Seuls email et plan
                sont enregistrés pour la facturation.
              </p>
            </GlassCard>
          </div>
        </div>
      </GlassContainer>
    </div>
  );
}
