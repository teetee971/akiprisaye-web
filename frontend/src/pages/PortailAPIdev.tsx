/**
 * PortailAPIdev — Portail développeurs : clés API, sandbox, SDK
 * Route : /portail-api
 */

import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Send,
  Code2,
  ChevronDown,
  ChevronRight,
  Shield,
  Zap,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

type Plan = 'free' | 'pro';

interface DevApiKey {
  id: string;
  maskedKey: string;
  createdAt: string;
  requestsToday: number;
  plan: Plan;
}

interface SandboxResponse {
  status: number;
  body: unknown;
  duration: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'akiprisaye_dev_keys';
const RATE_LIMITS: Record<Plan, number> = { free: 1000, pro: 50000 };

const ENDPOINTS = [
  { value: '/api/v1/prices', label: '/api/v1/prices — Prix produits' },
  { value: '/api/v1/products', label: '/api/v1/products — Catalogue produits' },
  { value: '/api/v1/territories', label: '/api/v1/territories — Territoires DOM-COM' },
  { value: '/api/v1/health', label: '/api/v1/health — État du service' },
];

const TERRITORIES = [
  { value: 'gp', label: 'Guadeloupe (GP)' },
  { value: 'mq', label: 'Martinique (MQ)' },
  { value: 'gf', label: 'Guyane (GF)' },
  { value: 're', label: 'La Réunion (RE)' },
  { value: 'yt', label: 'Mayotte (YT)' },
];

const MOCK_RESPONSES: Record<string, unknown> = {
  '/api/v1/prices': {
    territory: 'gp',
    page: 1,
    limit: 10,
    total: 1842,
    items: [
      {
        ean: '3017624010701',
        name: 'Nutella 400g',
        price: 4.89,
        store: 'Carrefour Destrellan',
        updated_at: '2026-04-10T08:00:00Z',
      },
      {
        ean: '7613035352681',
        name: 'Kit Kat 4 doigts',
        price: 1.59,
        store: 'E.Leclerc Bas du Fort',
        updated_at: '2026-04-10T07:45:00Z',
      },
    ],
  },
  '/api/v1/products': {
    total: 12450,
    items: [
      {
        ean: '3017624010701',
        name: 'Nutella 400g',
        brand: 'Ferrero',
        category: 'Pâtes à tartiner',
        image_url: null,
      },
      {
        ean: '7613035352681',
        name: 'Kit Kat 4 doigts',
        brand: 'Nestlé',
        category: 'Confiserie',
        image_url: null,
      },
    ],
  },
  '/api/v1/territories': {
    territories: [
      { code: 'gp', name: 'Guadeloupe', stores: 24, products: 8432 },
      { code: 'mq', name: 'Martinique', stores: 18, products: 7201 },
      { code: 'gf', name: 'Guyane française', stores: 12, products: 5340 },
      { code: 're', name: 'La Réunion', stores: 31, products: 9874 },
      { code: 'yt', name: 'Mayotte', stores: 8, products: 3210 },
    ],
  },
  '/api/v1/health': {
    status: 'ok',
    version: '1.0.0',
    uptime: 99.97,
    timestamp: new Date().toISOString(),
  },
};

const ENDPOINT_DOCS: Array<{
  path: string;
  method: string;
  desc: string;
  params: string[];
  example: string;
}> = [
  {
    path: '/api/v1/prices',
    method: 'GET',
    desc: 'Récupère les prix des produits par territoire et enseigne.',
    params: [
      'territory (string) — Code territoire (gp, mq, re…)',
      'limit (number) — Résultats par page (max 100)',
      'page (number) — Numéro de page',
      'ean (string) — Filtre par code EAN',
    ],
    example: 'GET /api/v1/prices?territory=gp&limit=10',
  },
  {
    path: '/api/v1/products',
    method: 'GET',
    desc: 'Catalogue produits avec EAN, nom, marque et catégorie.',
    params: [
      'q (string) — Recherche textuelle',
      'category (string) — Filtrer par catégorie',
      'limit (number) — Résultats par page',
    ],
    example: 'GET /api/v1/products?q=nutella&limit=20',
  },
  {
    path: '/api/v1/territories',
    method: 'GET',
    desc: 'Liste des territoires DOM-COM couverts avec statistiques.',
    params: ['(aucun paramètre requis)'],
    example: 'GET /api/v1/territories',
  },
  {
    path: '/api/v1/health',
    method: 'GET',
    desc: "Vérifie l'état de santé de l'API (uptime, version).",
    params: ['(aucun paramètre requis)'],
    example: 'GET /api/v1/health',
  },
];

const JS_SNIPPET = `// SDK JavaScript — A KI PRI SA YÉ
class AkiprisayeClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.akiprisaye.fr';
  }

  async getPrices({ territory = 'gp', limit = 20 } = {}) {
    const url = \`\${this.baseUrl}/api/v1/prices?territory=\${territory}&limit=\${limit}\`;
    const res = await fetch(url, {
      headers: { 'Authorization': \`Bearer \${this.apiKey}\` },
    });
    if (!res.ok) throw new Error(\`API error \${res.status}\`);
    return res.json();
  }

  async getProduct(ean) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/products/\${ean}\`, {
      headers: { 'Authorization': \`Bearer \${this.apiKey}\` },
    });
    return res.json();
  }
}

// Usage
const client = new AkiprisayeClient('aki_votre_cle_api');
const prices = await client.getPrices({ territory: 'mq', limit: 50 });
console.log(prices.items);`;

const PYTHON_SNIPPET = `# SDK Python — A KI PRI SA YÉ
import requests

class AkiprisayeClient:
    BASE_URL = "https://api.akiprisaye.fr"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
        })

    def get_prices(self, territory: str = "gp", limit: int = 20) -> dict:
        r = self.session.get(
            f"{self.BASE_URL}/api/v1/prices",
            params={"territory": territory, "limit": limit},
        )
        r.raise_for_status()
        return r.json()

    def get_territories(self) -> dict:
        r = self.session.get(f"{self.BASE_URL}/api/v1/territories")
        r.raise_for_status()
        return r.json()

# Usage
client = AkiprisayeClient("aki_votre_cle_api")
data = client.get_prices(territory="re", limit=50)
for item in data["items"]:
    print(item["name"], item["price"])`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomHex(len: number): string {
  const arr = new Uint8Array(len / 2);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function loadKeys(): DevApiKey[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DevApiKey[]) : [];
  } catch {
    return [];
  }
}

function saveKeys(keys: DevApiKey[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DocSection({ doc }: { doc: (typeof ENDPOINT_DOCS)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-900/30 px-2 py-0.5 rounded">
            {doc.method}
          </span>
          <span className="text-sm font-mono text-slate-200">{doc.path}</span>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="p-4 bg-slate-900 space-y-3">
          <p className="text-sm text-slate-300">{doc.desc}</p>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1">Paramètres :</p>
            <ul className="space-y-1">
              {doc.params.map((p) => (
                <li key={p} className="text-xs text-slate-400 font-mono">
                  — {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1">Exemple :</p>
            <code className="text-xs text-emerald-300 font-mono">{doc.example}</code>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PortailAPIdev() {
  const [keys, setKeys] = useState<DevApiKey[]>(loadKeys);
  const [newKeyPlain, setNewKeyPlain] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);

  // Sandbox state
  const [endpoint, setEndpoint] = useState('/api/v1/prices');
  const [territory, setTerritory] = useState('gp');
  const [limit, setLimit] = useState(10);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [sandboxResponse, setSandboxResponse] = useState<SandboxResponse | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const generateKey = useCallback(() => {
    const plain = `aki_${randomHex(32)}`;
    const masked = `aki_****...${plain.slice(-8)}`;
    const newKey: DevApiKey = {
      id: randomHex(8),
      maskedKey: masked,
      createdAt: new Date().toISOString(),
      requestsToday: 0,
      plan: 'free',
    };
    const updated = [...keys, newKey];
    setKeys(updated);
    saveKeys(updated);
    setNewKeyPlain(plain);
    setShowNewKey(true);
  }, [keys]);

  const revokeKey = useCallback(
    (id: string) => {
      const updated = keys.filter((k) => k.id !== id);
      setKeys(updated);
      saveKeys(updated);
      toast.success('Clé révoquée');
    },
    [keys]
  );

  const copyToClipboard = useCallback(async (text: string, label = 'Copié !') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error('Impossible de copier');
    }
  }, []);

  const sendSandbox = useCallback(async () => {
    setSandboxLoading(true);
    const t0 = performance.now();
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
    const body = MOCK_RESPONSES[endpoint] ?? { error: 'Endpoint inconnu' };
    setSandboxResponse({
      status: 200,
      body,
      duration: Math.round(performance.now() - t0),
    });
    setSandboxLoading(false);
  }, [endpoint]);

  const curlCommand = `curl -H "Authorization: Bearer ${apiKeyInput || 'aki_votre_cle'}" \\
  "https://api.akiprisaye.fr${endpoint}?territory=${territory}&limit=${limit}"`;

  return (
    <>
      <Helmet>
        <title>Portail API Développeurs — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Générez vos clés API, testez les endpoints dans le sandbox et téléchargez les SDK JS/Python."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
        {/* Hero */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 px-4 py-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">
                Portail développeurs
              </span>
            </div>
            <h1 className="text-3xl font-black text-white">🔑 API Dev Portal</h1>
            <p className="text-slate-400 mt-2 text-sm">
              Clés API, sandbox interactif et SDK open-source pour intégrer les données A KI PRI SA
              YÉ
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pt-8 space-y-10">
          {/* ── Section 1: Clés API ── */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" /> Mes clés API
            </h2>

            <button
              onClick={generateKey}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors mb-4"
            >
              <Plus className="w-4 h-4" />
              Générer une clé API
            </button>

            {/* New key modal-like banner */}
            {newKeyPlain && showNewKey && (
              <div className="bg-emerald-900/30 border border-emerald-600/50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <p className="font-semibold text-emerald-300">
                    Clé générée — copiez-la maintenant !
                  </p>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  ⚠️ Cette clé ne sera plus affichée après fermeture de ce message.
                </p>
                <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-3 font-mono text-sm text-emerald-300 break-all">
                  {newKeyPlain}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => copyToClipboard(newKeyPlain, 'Clé copiée !')}
                    className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copier
                  </button>
                  <button
                    onClick={() => setShowNewKey(false)}
                    className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}

            {keys.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Aucune clé générée.</p>
            ) : (
              <div className="space-y-3">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="bg-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-slate-700"
                  >
                    <div className="space-y-1">
                      <p className="font-mono text-sm text-slate-300">{k.maskedKey}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Créée le {new Date(k.createdAt).toLocaleDateString('fr-FR')}</span>
                        <span className="capitalize font-semibold text-blue-400">{k.plan}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>
                          <span className="font-bold text-white">{k.requestsToday}</span> /{' '}
                          {RATE_LIMITS[k.plan].toLocaleString('fr-FR')} req aujourd'hui
                        </span>
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden w-24">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(k.requestsToday / RATE_LIMITS[k.plan]) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => revokeKey(k.id)}
                      className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-xs font-semibold border border-rose-700/40 hover:border-rose-500 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Révoquer
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Rate limits info */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ['free', '🆓 Gratuit', '1 000 req/jour'] as const,
                ['pro', '⚡ Pro', '50 000 req/jour'] as const,
              ].map(([plan, label, rate]) => (
                <div key={plan} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                  <p className="font-semibold text-white text-sm">{label}</p>
                  <p className="text-xs text-slate-400 mt-1">{rate}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Shield className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">
                      {plan === 'pro'
                        ? 'Historique 12 mois + support'
                        : 'Endpoints publics seulement'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section 2: Sandbox ── */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> Sandbox interactif
            </h2>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="sandbox-endpoint"
                    className="block text-xs font-semibold text-slate-400 mb-1"
                  >
                    Endpoint
                  </label>
                  <select
                    id="sandbox-endpoint"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {ENDPOINTS.map((ep) => (
                      <option key={ep.value} value={ep.value}>
                        {ep.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="sandbox-territory"
                    className="block text-xs font-semibold text-slate-400 mb-1"
                  >
                    Territoire
                  </label>
                  <select
                    id="sandbox-territory"
                    value={territory}
                    onChange={(e) => setTerritory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {TERRITORIES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="sandbox-limit"
                    className="block text-xs font-semibold text-slate-400 mb-1"
                  >
                    Limite
                  </label>
                  <input
                    id="sandbox-limit"
                    type="number"
                    min={1}
                    max={100}
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sandbox-apikey"
                    className="block text-xs font-semibold text-slate-400 mb-1"
                  >
                    Clé API
                  </label>
                  <input
                    id="sandbox-apikey"
                    type="text"
                    placeholder="aki_..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* curl command */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">Exemple cURL</p>
                <div className="relative bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-x-auto">
                  <pre>{curlCommand}</pre>
                  <button
                    onClick={() => copyToClipboard(curlCommand, 'cURL copié !')}
                    className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={sendSandbox}
                disabled={sandboxLoading}
                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sandboxLoading ? 'Envoi...' : 'Envoyer la requête'}
              </button>

              {sandboxResponse && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-400">
                      Réponse{' '}
                      <span className="text-emerald-400 font-mono">{sandboxResponse.status}</span> —{' '}
                      {sandboxResponse.duration} ms
                    </p>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(sandboxResponse.body, null, 2),
                          'Réponse copiée !'
                        )
                      }
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copier
                    </button>
                  </div>
                  <pre className="bg-slate-900 rounded-lg p-4 text-xs text-emerald-300 overflow-x-auto max-h-64 border border-slate-700">
                    <code>{JSON.stringify(sandboxResponse.body, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>
          </section>

          {/* ── Section 3: SDK ── */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-purple-400" /> SDK téléchargement
            </h2>
            <p className="text-sm text-slate-400 mb-1 flex items-center gap-1">
              <span>📦</span> SDK open-source disponible sur GitHub (simulé)
            </p>
            <div className="space-y-6 mt-4">
              {/* JS SDK */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800">
                  <span className="text-sm font-bold text-yellow-400">JavaScript / TypeScript</span>
                  <button
                    onClick={() => copyToClipboard(JS_SNIPPET, 'Code JS copié !')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copier le code
                  </button>
                </div>
                <pre className="p-4 text-xs text-slate-300 overflow-x-auto max-h-72 font-mono leading-relaxed">
                  <code>{JS_SNIPPET}</code>
                </pre>
              </div>

              {/* Python SDK */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800">
                  <span className="text-sm font-bold text-blue-400">Python</span>
                  <button
                    onClick={() => copyToClipboard(PYTHON_SNIPPET, 'Code Python copié !')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copier le code
                  </button>
                </div>
                <pre className="p-4 text-xs text-slate-300 overflow-x-auto max-h-72 font-mono leading-relaxed">
                  <code>{PYTHON_SNIPPET}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* ── Section 4: Documentation rapide ── */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-slate-400" /> Documentation rapide
            </h2>
            <div className="space-y-2">
              {ENDPOINT_DOCS.map((doc) => (
                <DocSection key={doc.path} doc={doc} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
