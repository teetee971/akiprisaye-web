/**
 * SaaSMarketplace — Page SaaS Marketplace & extensions
 * Route : /saas-marketplace
 */
import { Helmet } from 'react-helmet-async';
import {
  Store,
  Smartphone,
  MessageCircle,
  Mic,
  ExternalLink,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

const SAAS_PRODUCTS = [
  {
    id: 'extension',
    emoji: '🔌',
    icon: Store,
    title: 'Extensions Navigateur',
    subtitle: '"Best Price Finder" Chrome/Firefox',
    revenue: '50k€/mois potentiel',
    users: '100k utilisateurs',
    model: 'Freemium',
    paidRate: '5%',
    features: [
      'Comparaison prix en 1 clic',
      'Alerte prix sur Amazon, Cdiscount, etc.',
      'Historique de prix',
      'Cashback intégré',
    ],
    status: 'planned',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    cta: 'Pré-inscription',
  },
  {
    id: 'mobile-sdk',
    emoji: '📱',
    icon: Smartphone,
    title: 'Mobile SDKs',
    subtitle: 'Android/iOS — Intégration apps retail',
    revenue: '100k€+/mois potentiel',
    users: 'Apps partenaires',
    model: 'Revenue share',
    paidRate: '10% revenus app',
    features: [
      'SDK Android & iOS',
      'Prix DOM-TOM en temps réel',
      'Comparateur intégrable',
      'Documentation complète',
    ],
    status: 'planned',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    cta: 'Devenir partenaire',
  },
  {
    id: 'chatbots',
    emoji: '🤖',
    icon: MessageCircle,
    title: 'ChatBots',
    subtitle: 'Telegram, WhatsApp — "Meilleurs prix près de moi ?"',
    revenue: '50k€/mois potentiel',
    users: 'Tous messagers',
    model: 'Publicité supportée',
    paidRate: 'Ad revenue',
    features: [
      'Bot Telegram disponible',
      'WhatsApp Business API',
      'Commandes vocales',
      'Alertes personnalisées',
    ],
    status: 'beta',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    cta: 'Essayer le bot',
  },
  {
    id: 'smart-speakers',
    emoji: '🔊',
    icon: Mic,
    title: 'Smart Speakers',
    subtitle: 'Alexa, Google Home — "Trouve-moi du lait moins cher"',
    revenue: 'Affiliate revenue',
    users: 'Alexa/Google',
    model: 'Affiliation',
    paidRate: 'Par conversion',
    features: [
      'Alexa Skill disponible',
      'Google Action',
      'Commandes naturelles',
      'Intégration liste courses',
    ],
    status: 'planned',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    cta: 'Découvrir',
  },
];

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planifié', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  beta: { label: 'Beta', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  active: { label: 'Actif', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
};

const REVENUE_PROJECTION = [
  { source: 'Extensions navigateur', monthly: '50 000€', timeline: '6 mois' },
  { source: 'Mobile SDKs', monthly: '100 000€+', timeline: '9 mois' },
  { source: 'ChatBots', monthly: '50 000€', timeline: '3 mois' },
  { source: 'Smart Speakers', monthly: '10 000€', timeline: '12 mois' },
];

export default function SaaSMarketplace() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <Helmet>
        <title>SaaS Marketplace — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Extensions navigateur, SDKs mobiles, chatbots et skills smart speakers basés sur les données de prix Akiprisaye."
        />
      </Helmet>

      {/* Hero */}
      <div className="max-w-6xl mx-auto mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-4">
          <Store className="w-4 h-4 text-indigo-400" />
          <span className="text-indigo-400 text-sm">SaaS Marketplace</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Powered by Akiprisaye
          <br />
          <span className="text-indigo-400">Distribué partout</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Extensions, SDKs, chatbots et skills vocal. Distribuez les données de prix DOM-TOM dans
          tous les canaux. Potentiel 210k€+/mois.
        </p>
        <div className="mt-4 text-2xl font-bold text-white">
          Potentiel : <span className="text-indigo-400">210k€+/mois</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {SAAS_PRODUCTS.map((product) => {
          const ProductIcon = product.icon;
          const statusConfig = STATUS_LABEL[product.status];
          return (
            <div key={product.id} className={`border rounded-xl p-6 ${product.bgColor}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{product.emoji}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{product.title}</h3>
                    <p className="text-sm text-gray-400">{product.subtitle}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className={`text-sm font-bold ${product.color}`}>{product.revenue}</div>
                  <div className="text-xs text-gray-500">potentiel</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-white">{product.model}</div>
                  <div className="text-xs text-gray-500">{product.paidRate}</div>
                </div>
              </div>

              <ul className="space-y-1.5 mb-4">
                {product.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className={`w-3.5 h-3.5 ${product.color} shrink-0`} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full border rounded-lg py-2 text-sm font-medium transition-colors border-current ${product.color} hover:bg-white/5`}
              >
                {product.cta} <ExternalLink className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Revenue Projection */}
      <div className="max-w-6xl mx-auto bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          Projection de Revenus SaaS
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 pb-2 pr-4">Source</th>
                <th className="text-left text-gray-400 pb-2 pr-4">Revenus/mois</th>
                <th className="text-left text-gray-400 pb-2">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {REVENUE_PROJECTION.map((row) => (
                <tr key={row.source}>
                  <td className="py-2.5 pr-4 text-white">{row.source}</td>
                  <td className="py-2.5 pr-4 text-indigo-400 font-medium">{row.monthly}</td>
                  <td className="py-2.5 text-gray-400">{row.timeline}</td>
                </tr>
              ))}
              <tr className="border-t border-white/20">
                <td className="py-2.5 pr-4 font-bold text-white">Total</td>
                <td className="py-2.5 pr-4 font-bold text-indigo-400">210k€+/mois</td>
                <td className="py-2.5 text-gray-400">12 mois</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
