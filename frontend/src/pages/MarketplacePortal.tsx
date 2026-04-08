/**
 * MarketplacePortal — Portail API Marketplace
 * Route : /marketplace-portal
 *
 * Permet aux commerces et développeurs de générer des clés API,
 * consulter les tiers de prix et accéder à la documentation SDK.
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Zap, Key, Code2, Shield, CheckCircle, Copy, ChevronRight, ExternalLink } from 'lucide-react';

const API_TIERS = [
  {
    tier: 'starter',
    label: 'Starter',
    price: '50€/mois',
    dailyLimit: '1 000 req/jour',
    costPerRequest: '0,05€',
    badge: '',
    features: ['Endpoints publics', 'Format JSON', 'Support email', 'Dashboard usage'],
    highlighted: false,
  },
  {
    tier: 'professional',
    label: 'Professionnel',
    price: '200€/mois',
    dailyLimit: '10 000 req/jour',
    costPerRequest: '0,03€',
    badge: '⭐ Populaire',
    features: ['Tous les endpoints', 'Historique 12 mois', 'Webhooks', 'Support prioritaire', 'Analytics avancés'],
    highlighted: true,
  },
  {
    tier: 'enterprise',
    label: 'Enterprise',
    price: 'Sur devis',
    dailyLimit: 'Illimité',
    costPerRequest: '0,01€',
    badge: '',
    features: ['SLA 99,9%', 'IP whitelist', 'Support dédié', 'Intégrations custom', 'Formation incluse'],
    highlighted: false,
  },
];

const CODE_EXAMPLES: Record<string, string> = {
  nodejs: `const akiprisaye = require('akiprisaye-api');

const client = new akiprisaye.Client({
  apiKey: 'aki_your_key_here',
});

(async () => {
  const prices = await client.prices.getByTerritory({
    territory: 'gp', // Guadeloupe
    category: 'alimentaire',
    limit: 20,
  });

  console.log(prices.items);
})();`,
  python: `import akiprisaye

client = akiprisaye.Client(api_key='aki_your_key_here')

prices = client.prices.get_by_territory(
    territory='mq',  # Martinique
    category='alimentaire',
    limit=20,
)

print(prices['items'])`,
  curl: `curl -X GET \\
  "https://api.akiprisaye.re/v1/prices?territory=re&limit=20" \\
  -H "Authorization: Bearer aki_your_key_here" \\
  -H "Content-Type: application/json"`,
};

const ENDPOINTS = [
  { method: 'GET', path: '/v1/prices', desc: 'Prix par territoire et catégorie', cost: '0,05€' },
  { method: 'GET', path: '/v1/prices/{ean}', desc: 'Prix d\'un produit par EAN', cost: '0,05€' },
  { method: 'GET', path: '/v1/products/{ean}', desc: 'Fiche produit complète', cost: '0,05€' },
  { method: 'GET', path: '/v1/territories', desc: 'Liste des territoires DOM-COM', cost: 'Gratuit' },
  { method: 'POST', path: '/v1/observations', desc: 'Soumettre une observation citoyenne', cost: '0,02€' },
  { method: 'GET', path: '/v1/prices/predict', desc: 'Prédiction de prix (ML)', cost: '0,15€' },
];

export default function MarketplacePortal() {
  const [activeLang, setActiveLang] = useState<'nodejs' | 'python' | 'curl'>('nodejs');
  const [copied, setCopied] = useState(false);
  const [selectedTier, setSelectedTier] = useState('professional');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(CODE_EXAMPLES[activeLang]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code example to clipboard:', error);
    }
  };

  const handleRequestKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // Simulated key generation (in production: call POST /api/marketplace/keys)
    const fakeKey = `aki_${Math.random().toString(36).slice(2, 14)}`;
    setGeneratedKey(fakeKey);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <Helmet>
        <title>API Marketplace — A KI PRI SA YÉ</title>
        <meta name="description" content="Accédez à l'API de données de prix DOM-TOM. Tiers Starter, Pro, Enterprise." />
      </Helmet>

      {/* Hero */}
      <div className="max-w-6xl mx-auto mb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-4">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-sm">API Marketplace</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Données de Prix DOM-TOM<br />
          <span className="text-emerald-400">en temps réel</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Intégrez les prix de 250k+ produits dans 12 territoires directement dans votre application.
          API RESTful, SDKs Node.js &amp; Python, documentation complète.
        </p>
      </div>

      {/* Pricing Tiers */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {API_TIERS.map((t) => (
          <button
            key={t.tier}
            type="button"
            className={`w-full rounded-xl border p-6 text-left cursor-pointer transition-all ${
              t.highlighted
                ? 'bg-emerald-900/20 border-emerald-500/40'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            } ${selectedTier === t.tier ? 'ring-2 ring-emerald-500' : ''}`}
            onClick={() => setSelectedTier(t.tier)}
            aria-pressed={selectedTier === t.tier}
          >
            {t.badge && (
              <span className="inline-block mb-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs text-white">
                {t.badge}
              </span>
            )}
            <span className="mb-1 block text-lg font-bold text-white">{t.label}</span>
            <span className="mb-1 block text-2xl font-bold text-emerald-400">{t.price}</span>
            <span className="mb-4 block text-sm text-gray-400">{t.dailyLimit} · {t.costPerRequest}/req</span>
            <span className="block">
              {t.features.map((f) => (
                <span key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>{f}</span>
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>

      {/* Key Generation Form */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            Obtenir une Clé API
          </h2>
          {!generatedKey ? (
            <form onSubmit={handleRequestKey} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email professionnel</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vous@entreprise.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Organisation (optionnel)</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Nom de votre entreprise"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tier sélectionné</label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  {API_TIERS.map((t) => (
                    <option key={t.tier} value={t.tier}>{t.label} — {t.price}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Générer ma clé <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <div className="text-sm text-emerald-400 mb-1">✅ Clé générée !</div>
                <code className="text-white text-sm break-all">{generatedKey}</code>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-300">
                ⚠️ Sauvegardez cette clé — elle ne sera plus affichée.
              </div>
              <button
                onClick={() => setGeneratedKey(null)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Générer une autre clé
              </button>
            </div>
          )}
        </div>

        {/* Code Examples */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-blue-400" />
              Exemples de Code
            </h2>
            <button
              onClick={copyCode}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <div className="flex gap-2 mb-3">
            {(['nodejs', 'python', 'curl'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`text-xs px-2.5 py-1 rounded ${
                  activeLang === lang ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 border border-white/10'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
          <pre className="bg-slate-900 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto">
            {CODE_EXAMPLES[activeLang]}
          </pre>
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="max-w-6xl mx-auto bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          Endpoints Disponibles
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 pb-2 pr-4">Méthode</th>
                <th className="text-left text-gray-400 pb-2 pr-4">Endpoint</th>
                <th className="text-left text-gray-400 pb-2 pr-4">Description</th>
                <th className="text-left text-gray-400 pb-2">Coût</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ENDPOINTS.map((ep) => (
                <tr key={ep.path}>
                  <td className="py-2 pr-4">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${ep.method === 'GET' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-gray-300">{ep.path}</td>
                  <td className="py-2 pr-4 text-gray-400">{ep.desc}</td>
                  <td className="py-2 text-emerald-400 text-xs">{ep.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-6xl mx-auto text-center">
        <a
          href="/portail-developpeurs"
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Voir la documentation complète →
        </a>
      </div>
    </div>
  );
}
