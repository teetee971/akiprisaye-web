/**
 * MonetizationEcosystemPage.tsx — Complete monetization ecosystem overview.
 * Shows all 25 revenue streams, monthly projections, and status.
 * Route: /admin/monetisation (private, admin only)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/ui/SEOHead';
import { TrendingUp, DollarSign, Zap, Globe, Star } from 'lucide-react';

interface RevenueStream {
  id: string;
  tier: 1 | 2;
  icon: string;
  name: string;
  category: string;
  monthlyTarget: number; // €
  status: 'live' | 'beta' | 'planned';
  description: string;
  route?: string;
}

const REVENUE_STREAMS: RevenueStream[] = [
  // ── TIER 1 ─────────────────────────────────────────────────────────────────
  {
    id: 'subscriptions',
    tier: 1,
    icon: '💳',
    name: 'Abonnements (SumUp)',
    category: 'Core',
    monthlyTarget: 3000,
    status: 'live',
    description: 'Plans Citoyen/Pro/Business/Enterprise via SumUp & Stripe',
    route: '/pricing',
  },
  {
    id: 'api-marketplace',
    tier: 1,
    icon: '🔌',
    name: 'API Marketplace',
    category: 'B2B',
    monthlyTarget: 5000,
    status: 'beta',
    description: 'Accès API aux données prix DOM avec quotas par tier',
    route: '/portail-developpeurs',
  },
  {
    id: 'data-licensing',
    tier: 1,
    icon: '📊',
    name: 'Data Licensing',
    category: 'B2B',
    monthlyTarget: 1500,
    status: 'beta',
    description: 'Rapports de données agrégées anonymisées pour chercheurs/presse',
    route: '/contact?subject=rapport-donnees',
  },
  {
    id: 'sponsored-content',
    tier: 1,
    icon: '📢',
    name: 'Sponsored Content',
    category: 'Ads',
    monthlyTarget: 4000,
    status: 'beta',
    description: 'Contenus sponsorisés et bannières pour enseignes locales',
  },
  {
    id: 'affiliate-links',
    tier: 1,
    icon: '🔗',
    name: 'Affiliate Links',
    category: 'Affiliates',
    monthlyTarget: 2000,
    status: 'live',
    description: 'Commissions sur clics et achats via liens affiliés partenaires',
    route: '/revenue-dashboard',
  },
  {
    id: 'white-label',
    tier: 1,
    icon: '🏷️',
    name: 'White-Label',
    category: 'B2B',
    monthlyTarget: 2500,
    status: 'planned',
    description: 'Solution marque blanche pour collectivités et distributeurs',
  },
  {
    id: 'sms-push-premium',
    tier: 1,
    icon: '📱',
    name: 'SMS/Push Premium',
    category: 'Core',
    monthlyTarget: 1000,
    status: 'beta',
    description: 'Alertes prix SMS temps réel (add-on abonnement)',
  },
  {
    id: 'b2b2c',
    tier: 1,
    icon: '🏢',
    name: 'B2B2C Integration',
    category: 'B2B',
    monthlyTarget: 50000,
    status: 'planned',
    description: 'Intégration dans portails RH et avantages salariés',
  },
  {
    id: 'corporate-packages',
    tier: 1,
    icon: '💼',
    name: 'Corporate Packages',
    category: 'B2B',
    monthlyTarget: 5000,
    status: 'beta',
    description: 'Packages entreprises multi-utilisateurs et rapports dédiés',
    route: '/contact?subject=entreprise',
  },
  {
    id: 'saas',
    tier: 1,
    icon: '☁️',
    name: 'SaaS Ecosystem',
    category: 'B2B',
    monthlyTarget: 20000,
    status: 'planned',
    description: 'Plateforme SaaS pour retailers : gestion prix, veille concurrentielle',
  },
  // ── TIER 2 ─────────────────────────────────────────────────────────────────
  {
    id: 'marketplace-products',
    tier: 2,
    icon: '🛒',
    name: 'Marketplace Produits',
    category: 'Commerce',
    monthlyTarget: 10000,
    status: 'planned',
    description: 'Vente directe "Meilleur panier IA" avec commission 20%',
  },
  {
    id: 'subscription-box',
    tier: 2,
    icon: '📦',
    name: 'Écombox (Subscription Box)',
    category: 'Commerce',
    monthlyTarget: 8000,
    status: 'planned',
    description: "Box mensuelle 39€ — produits sélectionnés par l'IA",
  },
  {
    id: 'price-alerts-saas',
    tier: 2,
    icon: '🔔',
    name: 'PriceWatcher Pro (SaaS B2B)',
    category: 'SaaS',
    monthlyTarget: 50000,
    status: 'planned',
    description: 'Alertes prix temps réel et veille concurrentielle pour retailers',
  },
  {
    id: 'influencer-network',
    tier: 2,
    icon: '🌟',
    name: 'Réseau Influenceurs',
    category: 'Marketing',
    monthlyTarget: 25000,
    status: 'planned',
    description: 'Micro-influenceurs DOM (10k-100k abonnés) — 60/40 split',
  },
  {
    id: 'gamification',
    tier: 2,
    icon: '🎮',
    name: 'Gamification & Récompenses',
    category: 'Engagement',
    monthlyTarget: 10000,
    status: 'planned',
    description: 'Points fidélité, badges, classements et récompenses partenaires',
    route: '/gamification',
  },
  {
    id: 'price-lock-insurance',
    tier: 2,
    icon: '🔒',
    name: 'Price Lock Insurance',
    category: 'FinTech',
    monthlyTarget: 15000,
    status: 'planned',
    description: 'Assurance blocage prix 30 jours — prime 1-2% du montant',
  },
  {
    id: 'bnpl',
    tier: 2,
    icon: '💰',
    name: 'Buy Now Pay Later (BNPL)',
    category: 'FinTech',
    monthlyTarget: 25000,
    status: 'planned',
    description: 'Paiement 3× sans frais — commission 1-3% par transaction',
  },
  {
    id: 'online-courses',
    tier: 2,
    icon: '🎓',
    name: 'Cours en Ligne & Formation',
    category: 'Education',
    monthlyTarget: 8000,
    status: 'planned',
    description: '"Budget Mastery", "Inflation Hacks" — 29€-49€ par cours',
    route: '/contact?subject=formation-atelier',
  },
  {
    id: 'hyperlocal',
    tier: 2,
    icon: '📍',
    name: 'Services Hyperlocaux',
    category: 'Local',
    monthlyTarget: 15000,
    status: 'planned',
    description: 'Annuaire petits commerces + commandes en ligne — commission 2-5%',
    route: '/petits-commerces',
  },
  {
    id: 'government-contracts',
    tier: 2,
    icon: '🏛️',
    name: 'Contrats Gouvernementaux (B2G)',
    category: 'B2G',
    monthlyTarget: 50000,
    status: 'planned',
    description: 'Données inflation pour collectivités, Eurostat, OPMR',
    route: '/contact?subject=licence-institutionnelle',
  },
  {
    id: 'esg-scoring',
    tier: 2,
    icon: '🌿',
    name: 'ESG Impact Scoring',
    category: 'ESG',
    monthlyTarget: 20000,
    status: 'planned',
    description: 'Empreinte carbone par produit — badge "Achat responsable"',
  },
  {
    id: 'payment-processing',
    tier: 2,
    icon: '💳',
    name: 'Payment Processing',
    category: 'FinTech',
    monthlyTarget: 30000,
    status: 'planned',
    description: 'Micro-paiements DOM — frais 1,5% vs 2,9% Stripe standard',
  },
  {
    id: 'bi-analytics',
    tier: 2,
    icon: '📈',
    name: 'BI & Intelligence Marché',
    category: 'SaaS',
    monthlyTarget: 30000,
    status: 'planned',
    description: 'Prévisions demande, segmentation clients — 99€ à 2000€/mois',
  },
  {
    id: 'franchise',
    tier: 2,
    icon: '🌐',
    name: 'Modèle Franchise',
    category: 'Expansion',
    monthlyTarget: 50000,
    status: 'planned',
    description: '5-10 franchises territoriales — fee 25k€ + royalties 10%',
  },
  {
    id: 'classifieds',
    tier: 2,
    icon: '📰',
    name: 'Petites Annonces Communautaires',
    category: 'Community',
    monthlyTarget: 75000,
    status: 'planned',
    description: 'Annonces hyperlocales style Nextdoor — 5€/post sponsorisé',
  },
];

const STATUS_COLORS: Record<RevenueStream['status'], string> = {
  live: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  beta: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  planned: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const STATUS_LABELS: Record<RevenueStream['status'], string> = {
  live: '✅ En ligne',
  beta: '🚀 Bêta',
  planned: '📋 Planifié',
};

const TIER_MONTHLY_TARGETS = {
  1: REVENUE_STREAMS.filter((s) => s.tier === 1).reduce((acc, s) => acc + s.monthlyTarget, 0),
  2: REVENUE_STREAMS.filter((s) => s.tier === 2).reduce((acc, s) => acc + s.monthlyTarget, 0),
};

function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function MonetizationEcosystemPage() {
  const [tierFilter, setTierFilter] = useState<'all' | '1' | '2'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'beta' | 'planned'>('all');

  const filtered = REVENUE_STREAMS.filter((s) => {
    if (tierFilter !== 'all' && s.tier !== parseInt(tierFilter)) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  const totalMonthly = REVENUE_STREAMS.reduce((acc, s) => acc + s.monthlyTarget, 0);
  const liveMonthly = REVENUE_STREAMS.filter((s) => s.status === 'live').reduce(
    (acc, s) => acc + s.monthlyTarget,
    0
  );
  const betaMonthly = REVENUE_STREAMS.filter((s) => s.status === 'beta').reduce(
    (acc, s) => acc + s.monthlyTarget,
    0
  );

  return (
    <>
      <SEOHead
        title="Écosystème Monétisation — 25 Sources de Revenus"
        description="Vue complète des 25 sources de revenus de la plateforme Akiprisaye."
        noIndex
      />

      <div className="min-h-screen bg-slate-950 px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-emerald-400" aria-hidden="true" />
                Écosystème Monétisation
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                25 sources de revenus parallèles — objectif {formatEur(totalMonthly)}/mois
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              <span className="text-emerald-400 font-bold text-lg">
                {formatEur(totalMonthly * 12)}/an
              </span>
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Objectif mensuel
              </p>
              <p className="mt-1 text-xl font-extrabold text-white">{formatEur(totalMonthly)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                En ligne (live)
              </p>
              <p className="mt-1 text-xl font-extrabold text-emerald-400">
                {formatEur(liveMonthly)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">En bêta</p>
              <p className="mt-1 text-xl font-extrabold text-amber-400">{formatEur(betaMonthly)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Sources actives
              </p>
              <p className="mt-1 text-xl font-extrabold text-white">
                {REVENUE_STREAMS.filter((s) => s.status !== 'planned').length}
                <span className="text-zinc-500 text-sm font-normal">/{REVENUE_STREAMS.length}</span>
              </p>
            </div>
          </div>

          {/* Tier breakdown */}
          <div className="grid sm:grid-cols-2 gap-4">
            {([1, 2] as const).map((tier) => (
              <div key={tier} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    {tier === 1 ? (
                      <Star className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    )}
                    Tier {tier} — {tier === 1 ? 'Core & Existants' : 'Premium (Nouveaux)'}
                  </h2>
                  <span className="text-sm font-bold text-emerald-400">
                    {formatEur(TIER_MONTHLY_TARGETS[tier])}/mois
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${tier === 1 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                    style={{ width: `${(TIER_MONTHLY_TARGETS[tier] / totalMonthly) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {((TIER_MONTHLY_TARGETS[tier] / totalMonthly) * 100).toFixed(0)}% du total —{' '}
                  {REVENUE_STREAMS.filter((s) => s.tier === tier).length} sources
                </p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="tier-filter"
                className="text-[10px] font-bold uppercase tracking-wide text-zinc-500"
              >
                Tier
              </label>
              <select
                id="tier-filter"
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)}
                className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="all">Tous les tiers</option>
                <option value="1">Tier 1</option>
                <option value="2">Tier 2</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="status-filter"
                className="text-[10px] font-bold uppercase tracking-wide text-zinc-500"
              >
                Statut
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="all">Tous les statuts</option>
                <option value="live">En ligne</option>
                <option value="beta">Bêta</option>
                <option value="planned">Planifié</option>
              </select>
            </div>
          </div>

          {/* Revenue streams grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((stream) => (
              <div
                key={stream.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">
                      {stream.icon}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-zinc-100 leading-tight">{stream.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">
                        {stream.category} · Tier {stream.tier}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[stream.status]}`}
                  >
                    {STATUS_LABELS[stream.status]}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{stream.description}</p>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wide">
                      Objectif/mois
                    </p>
                    <p className="text-sm font-extrabold text-emerald-400">
                      {formatEur(stream.monthlyTarget)}
                    </p>
                  </div>
                  {stream.route && (
                    <Link
                      to={stream.route}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Voir →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Revenue ramp projection */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" aria-hidden="true" />
              Projection de montée en charge
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                    <th className="pb-2 pr-6">Mois</th>
                    <th className="pb-2 pr-6">Sources actives</th>
                    <th className="pb-2 pr-6">MRR estimé</th>
                    <th className="pb-2">ARR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { month: 'Mois 1', sources: 5, mrr: 50000 },
                    { month: 'Mois 2', sources: 10, mrr: 100000 },
                    { month: 'Mois 3', sources: 15, mrr: 150000 },
                    { month: 'Mois 4', sources: 20, mrr: 200000 },
                    { month: 'Mois 5', sources: 25, mrr: 244000 },
                  ].map((row) => (
                    <tr key={row.month}>
                      <td className="py-2 pr-6 font-semibold text-zinc-300">{row.month}</td>
                      <td className="py-2 pr-6 text-zinc-400">{row.sources}/25</td>
                      <td className="py-2 pr-6 text-emerald-400 font-bold">{formatEur(row.mrr)}</td>
                      <td className="py-2 text-zinc-400">{formatEur(row.mrr * 12)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
