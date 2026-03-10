/**
 * PortailDeveloppeurs — API publique pour intégrations tierces
 * Route : /portail-developpeurs
 */

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Code2, Key, FileText, Zap, Shield, Globe, ChevronRight, Copy } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ── Endpoints planifiés ───────────────────────────────────────────────────────

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/prices', desc: 'Prix des produits par territoire et enseigne', status: 'planned' },
  { method: 'GET', path: '/api/v1/products/:ean', desc: 'Fiche produit complète par code EAN', status: 'planned' },
  { method: 'GET', path: '/api/v1/territories', desc: 'Liste des territoires DOM-COM couverts', status: 'planned' },
  { method: 'GET', path: '/api/v1/inflation', desc: 'Indice de pression inflationniste par territoire', status: 'planned' },
  { method: 'GET', path: '/api/fuel-prices', desc: 'Prix carburants DOM-COM (temps réel)', status: 'live' },
  { method: 'POST', path: '/api/v1/observations', desc: 'Soumettre une observation de prix citoyenne', status: 'planned' },
];

const PLANS_API = [
  { name: 'Gratuit', calls: '100 / jour', features: ['Endpoints publics', 'Format JSON'], cta: 'Commencer' },
  { name: 'Pro', calls: '10 000 / jour', features: ['Tous les endpoints', 'Historique 12 mois', 'Support e-mail'], cta: 'Essai 30 jours' },
  { name: 'Institution', calls: 'Illimité', features: ['Accès complet', 'SLA 99,9 %', 'Support dédié', 'Données brutes'], cta: 'Devis' },
];

const EXAMPLE_RESPONSE = `{
  "territory": "GP",
  "products": [
    {
      "ean": "3017620422003",
      "name": "Nutella 400g",
      "store": "Carrefour Jarry",
      "price": 5.49,
      "currency": "EUR",
      "updatedAt": "2024-12-10T08:30:00Z"
    }
  ],
  "fetchedAt": "2024-12-10T09:00:00Z"
}`;

// ── Composant ─────────────────────────────────────────────────────────────────

export default function PortailDeveloppeurs() {
  return (
    <>
      <Helmet>
        <title>Portail API développeurs — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="API publique documentée pour les développeurs et intégrations tierces — prix, produits, territoires DOM-COM — A KI PRI SA YÉ"
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/portail-developpeurs" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-4 max-w-4xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.portailDeveloppeurs}
            alt="API développeurs A KI PRI SA YÉ"
            gradient="from-slate-950 to-indigo-900"
            height="h-44 sm:h-56"
          >
            <div className="flex items-center gap-2 mb-1">
              <Code2 className="w-5 h-5 text-indigo-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
                API publique
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">
              👨‍💻 Portail Développeurs
            </h1>
            <p className="text-indigo-100 text-sm mt-1 drop-shadow max-w-xl">
              Intégrez les données de prix DOM-COM dans vos applications, outils d'analyse ou services institutionnels
            </p>
          </HeroImage>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 pb-20 space-y-8">

          {/* Statut */}
          <div className="flex gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <Zap className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-indigo-800">API en développement — V3</p>
              <p className="text-sm text-indigo-700 mt-0.5">
                L'endpoint carburants est déjà en production. La documentation complète OpenAPI
                et les clés d'accès sont prévues en V3. Contactez-nous pour un accès anticipé.
              </p>
            </div>
          </div>

          {/* Endpoints */}
          <div>
            <h2 className="font-bold text-gray-900 mb-4">📡 Endpoints disponibles & planifiés</h2>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 w-16">Méthode</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Endpoint</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Description</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 w-20">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {API_ENDPOINTS.map((ep) => (
                    <tr key={ep.path} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {ep.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-700">{ep.path}</td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell text-xs">{ep.desc}</td>
                      <td className="px-4 py-3">
                        {ep.status === 'live' ? (
                          <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            ✓ Live
                          </span>
                        ) : (
                          <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            V3
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exemple de réponse */}
          <div>
            <h2 className="font-bold text-gray-900 mb-3">💻 Exemple de réponse</h2>
            <div className="bg-slate-900 rounded-xl p-5 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-mono">GET /api/v1/prices?territory=GP&ean=3017620422003</span>
                <button
                  onClick={() => navigator.clipboard.writeText(EXAMPLE_RESPONSE).catch(() => {})}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                  title="Copier"
                >
                  <Copy className="w-3.5 h-3.5" /> Copier
                </button>
              </div>
              <pre className="text-sm text-green-300 font-mono overflow-x-auto leading-relaxed whitespace-pre">
                {EXAMPLE_RESPONSE}
              </pre>
            </div>
          </div>

          {/* Plans */}
          <div>
            <h2 className="font-bold text-gray-900 mb-4">💼 Plans d'accès API</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS_API.map((plan) => (
                <div key={plan.name} className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="font-bold text-gray-900 mb-1">{plan.name}</p>
                  <p className="text-sm font-semibold text-indigo-700 mb-3">{plan.calls} requêtes</p>
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/contact"
                    className="block text-center text-sm font-medium px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Sécurité */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Key, title: 'Authentification API', desc: 'Clé API sécurisée par offre, rotation automatique' },
              { icon: Shield, title: 'Rate limiting', desc: 'Quotas par plan, protection contre les abus' },
              { icon: Globe, title: 'Open Source', desc: 'SDK JavaScript / Python open-source sur GitHub' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-xl p-4">
                <Icon className="w-5 h-5 text-indigo-600 mb-2" />
                <p className="font-semibold text-sm text-gray-900">{title}</p>
                <p className="text-xs text-gray-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA contact */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-center">
            <FileText className="w-8 h-8 text-indigo-200 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Accès anticipé pour institutions</h3>
            <p className="text-indigo-200 text-sm mb-4 max-w-lg mx-auto">
              Collectivités, observatoires, chercheurs : contactez-nous pour un accès en avant-première
              à l'API institutionnelle.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/devis-ia"
                className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors text-sm"
              >
                Demander un devis
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-400 transition-colors text-sm"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
