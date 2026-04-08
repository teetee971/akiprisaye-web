/**
 * MonetizationDashboard — Tableau de bord de l'engine de monétisation
 * Route : /monetisation (admin only)
 *
 * Vue d'ensemble des 12 flux de revenus parallèles.
 */
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  TrendingUp,
  Zap,
  Database,
  Megaphone,
  Link,
  Building2,
  MessageSquare,
  Users,
  FileText,
  MapPin,
  Store,
  Cpu,
  Euro,
  BarChart3,
  CheckCircle,
  Clock,
  Beaker,
} from 'lucide-react';

interface RevenueStream {
  name: string;
  key: string;
  dailyRevenue: number;
  monthlyRevenue: number;
  status: 'active' | 'beta' | 'planned';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route?: string;
}

const REVENUE_STREAMS: RevenueStream[] = [
  {
    name: 'Abonnements',
    key: 'subscriptions',
    dailyRevenue: 100,
    monthlyRevenue: 3000,
    status: 'active',
    description: '4 plans × ~25 utilisateurs actifs',
    icon: Users,
    route: '/tarifs',
  },
  {
    name: 'API Marketplace',
    key: 'api_marketplace',
    dailyRevenue: 166,
    monthlyRevenue: 5000,
    status: 'beta',
    description: '100 commerces × 1k requêtes/jour',
    icon: Zap,
    route: '/marketplace-portal',
  },
  {
    name: 'Data Licensing',
    key: 'data_licensing',
    dailyRevenue: 50,
    monthlyRevenue: 1500,
    status: 'beta',
    description: '2 rapports/jour × 25€',
    icon: Database,
    route: '/data-marketplace',
  },
  {
    name: 'Contenu Sponsorisé',
    key: 'sponsored_content',
    dailyRevenue: 130,
    monthlyRevenue: 3900,
    status: 'planned',
    description: '2 sponsors × 1.3k + search ads',
    icon: Megaphone,
  },
  {
    name: 'Affiliation',
    key: 'affiliate',
    dailyRevenue: 75,
    monthlyRevenue: 2250,
    status: 'active',
    description: '50 conversions × 1.50€',
    icon: Link,
    route: '/portail-affilies',
  },
  {
    name: 'White-Label',
    key: 'white_label',
    dailyRevenue: 83,
    monthlyRevenue: 2500,
    status: 'planned',
    description: '5 clients × 500€/mois',
    icon: Store,
  },
  {
    name: 'SMS/Push Premium',
    key: 'sms_push',
    dailyRevenue: 33,
    monthlyRevenue: 1000,
    status: 'planned',
    description: '1000 users × 0.10€',
    icon: MessageSquare,
  },
  {
    name: 'Corporate B2B',
    key: 'corporate',
    dailyRevenue: 166,
    monthlyRevenue: 5000,
    status: 'planned',
    description: '10 clients × 500€/mois',
    icon: Building2,
    route: '/corporate',
  },
  {
    name: 'Rapports Premium',
    key: 'premium_reports',
    dailyRevenue: 20,
    monthlyRevenue: 600,
    status: 'beta',
    description: '100 rapports × 2€',
    icon: FileText,
    route: '/rapports-premium',
  },
  {
    name: 'Alertes Géoloc',
    key: 'geolocation',
    dailyRevenue: 66,
    monthlyRevenue: 2000,
    status: 'planned',
    description: '2000€/mois',
    icon: MapPin,
    route: '/offres-proximite',
  },
  {
    name: 'SaaS Marketplace',
    key: 'saas_marketplace',
    dailyRevenue: 333,
    monthlyRevenue: 10000,
    status: 'planned',
    description: '10k€/mois potentiel',
    icon: BarChart3,
    route: '/saas-marketplace',
  },
  {
    name: 'B2B2C Integration',
    key: 'b2b2c',
    dailyRevenue: 1666,
    monthlyRevenue: 50000,
    status: 'planned',
    description: '50k€/mois potentiel',
    icon: Cpu,
  },
];

const STATUS_BADGE = {
  active: { label: 'Actif', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', Icon: CheckCircle },
  beta: { label: 'Beta', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', Icon: Beaker },
  planned: { label: 'Planifié', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', Icon: Clock },
};

export default function MonetizationDashboard() {
  const [filter, setFilter] = useState<'all' | 'active' | 'beta' | 'planned'>('all');

  const filtered = filter === 'all' ? REVENUE_STREAMS : REVENUE_STREAMS.filter((s) => s.status === filter);
  const totalDaily = REVENUE_STREAMS.reduce((sum, s) => sum + s.dailyRevenue, 0);
  const totalMonthly = REVENUE_STREAMS.reduce((sum, s) => sum + s.monthlyRevenue, 0);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <Helmet>
        <title>Moteur de Monétisation — A KI PRI SA YÉ</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Euro className="w-8 h-8 text-emerald-400" />
          <h1 className="text-3xl font-bold text-white">Moteur de Monétisation</h1>
        </div>
        <p className="text-gray-400">12 flux de revenus parallèles — Objectif 94k€/mois</p>
      </div>

      {/* KPI Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Revenus/jour', value: `${totalDaily.toLocaleString('fr-FR')}€`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Revenus/mois', value: `${(totalMonthly / 1000).toFixed(0)}k€`, icon: BarChart3, color: 'text-blue-400' },
          { label: 'Revenus/an', value: `${(totalMonthly * 12 / 1000000).toFixed(1)}M€`, icon: Euro, color: 'text-purple-400' },
          { label: 'Flux actifs', value: String(REVENUE_STREAMS.filter((s) => s.status === 'active').length), icon: CheckCircle, color: 'text-amber-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <kpi.icon className={`w-5 h-5 ${kpi.color} mb-2`} />
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
            <div className="text-sm text-gray-400">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto flex gap-2 mb-6 flex-wrap">
        {(['all', 'active', 'beta', 'planned'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-emerald-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : f === 'beta' ? 'Beta' : 'Planifiés'}
          </button>
        ))}
      </div>

      {/* Revenue Streams Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filtered.map((stream) => {
          const badge = STATUS_BADGE[stream.status];
          const pct = Math.round((stream.dailyRevenue / totalDaily) * 100);
          return (
            <div
              key={stream.key}
              className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <stream.icon className="w-5 h-5 text-emerald-400" />
                  <span className="font-semibold text-white text-sm">{stream.name}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-gray-400 text-xs mb-3">{stream.description}</p>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xl font-bold text-white">{stream.dailyRevenue.toLocaleString('fr-FR')}€/j</div>
                  <div className="text-xs text-gray-500">{stream.monthlyRevenue.toLocaleString('fr-FR')}€/mois</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">{pct}% du total</div>
                  <div className="w-20 h-1.5 bg-white/10 rounded-full mt-1">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(pct * 3, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              {stream.route && (
                <RouterLink
                  to={stream.route}
                  className="mt-3 block text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Gérer →
                </RouterLink>
              )}
            </div>
          );
        })}
      </div>

      {/* Revenue Projection */}
      <div className="max-w-7xl mx-auto bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Projection de Revenus
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-400 mb-1">Court terme (actuel)</div>
            <div className="text-3xl font-bold text-emerald-400">
              {(REVENUE_STREAMS.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.monthlyRevenue, 0)).toLocaleString('fr-FR')}€/mois
            </div>
            <div className="text-xs text-gray-500">Flux actifs uniquement</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Moyen terme (3 mois)</div>
            <div className="text-3xl font-bold text-blue-400">
              {(REVENUE_STREAMS.filter((s) => s.status !== 'planned').reduce((sum, s) => sum + s.monthlyRevenue, 0)).toLocaleString('fr-FR')}€/mois
            </div>
            <div className="text-xs text-gray-500">Actifs + Beta</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Long terme (12 mois)</div>
            <div className="text-3xl font-bold text-purple-400">
              {(totalMonthly).toLocaleString('fr-FR')}€/mois
            </div>
            <div className="text-xs text-gray-500">Tous les flux déployés</div>
          </div>
        </div>
      </div>
    </div>
  );
}
