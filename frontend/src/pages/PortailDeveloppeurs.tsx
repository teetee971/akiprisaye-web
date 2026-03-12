/**
 * PortailDeveloppeurs — API publique pour intégrations tierces
 * Route : /portail-developpeurs
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Code2, Key, FileText, Zap, Shield, Globe, ChevronRight, Copy, UserPlus, CheckCircle } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ── Endpoints planifiés ───────────────────────────────────────────────────────

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/fuel-prices', desc: 'Prix carburants DOM-COM en temps réel', status: 'live' },
  { method: 'GET', path: '/api/news', desc: 'Rappels produits RappelConso V2 + actualités curatées par territoire', status: 'live' },
  { method: 'GET', path: '/api/exchange-rates', desc: 'Taux de change EUR/USD/XOF live (open.er-api.com)', status: 'live' },
  { method: 'GET', path: '/api/signalconso', desc: 'Signalements consommateurs DOM par catégorie (DGCCRF)', status: 'live' },
  { method: 'GET', path: '/api/indice', desc: 'Indice IEVR — panier essentiel Guadeloupe', status: 'live' },
  { method: 'GET', path: '/api/prices/realtime', desc: 'Prix temps réel par EAN et territoire (OpenPrices)', status: 'live' },
  { method: 'GET', path: '/api/prices/feed', desc: 'Flux de prix par territoire, date et page', status: 'live' },
  { method: 'GET', path: '/api/health', desc: 'Statut de santé de l\'API', status: 'live' },
  { method: 'POST', path: '/api/browser-rendering/crawl', desc: 'Beta Cloudflare Browser Rendering : crawl asynchrone HTML / Markdown / JSON structuré (max 50 pages, bearer token serveur)', status: 'live' },
  { method: 'GET', path: '/api/browser-rendering/crawl?id=:jobId', desc: 'Suivi paginé d\'un job de crawl (>10 Mo) et statuts running/completed/errored', status: 'live' },
  { method: 'GET', path: '/api/v1/prices', desc: 'Prix des produits par territoire et enseigne (V1)', status: 'planned' },
  { method: 'GET', path: '/api/v1/products/:ean', desc: 'Fiche produit complète par code EAN', status: 'planned' },
  { method: 'GET', path: '/api/v1/territories', desc: 'Liste des territoires DOM-COM couverts', status: 'planned' },
  { method: 'POST', path: '/api/v1/observations', desc: 'Soumettre une observation de prix citoyenne', status: 'planned' },
];

const PLANS_API = [
  { name: 'Gratuit', calls: '100 / jour', features: ['Endpoints publics', 'Format JSON'], cta: 'Commencer' },
  { name: 'Pro', calls: '10 000 / jour', features: ['Tous les endpoints', 'Historique 12 mois', 'Support e-mail'], cta: 'Essai 30 jours' },
  { name: 'Institution', calls: 'Illimité', features: ['Accès complet', 'SLA 99,9 %', 'Support dédié', 'Données brutes'], cta: 'Devis' },
];

const EXAMPLE_RESPONSE = `{
  "items": [
    {
      "id": "rcv2-8ae1374f-47b8-4ffd-8346-4d999777e68b",
      "type": "rappels",
      "territory": "all",
      "title": "Rappel : Salade batavia — crudi pei",
      "summary": "Détection listeria monocytogenes — Ne plus consommer. Rapporter au point de vente.",
      "source_name": "RappelConso V2 (DGCCRF)",
      "impact": "fort",
      "imageUrl": "https://rappel.conso.gouv.fr/image/234d617c-0b82-48d2-8d81-612fee647457.jpg",
      "published_at": "2026-03-10T13:18:15.000Z",
      "verified": true
    }
  ],
  "mode": "live",
  "count": 30,
  "fetchedAt": "2026-03-10T14:00:00.000Z"
}`;

const BROWSER_RENDERING_ENV_SNIPPET = `CLOUDFLARE_BROWSER_RENDERING_API_TOKEN=<token Cloudflare>
CLOUDFLARE_ACCOUNT_ID=<account id>
BROWSER_RENDERING_SHARED_SECRET=<secret applicatif>`;

// ── Composant ─────────────────────────────────────────────────────────────────

export default function PortailDeveloppeurs() {
  const [form, setForm] = useState({
    nom: '',
    email: '',
    projet: '',
    useCase: '',
    plan: 'Gratuit',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const next: Record<string, string> = {};
    if (!form.nom.trim()) next.nom = 'Nom requis';
    if (!form.email.trim()) next.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email invalide';
    if (!form.useCase.trim()) next.useCase = 'Description du projet requise';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...form,
          subject: `Demande d'accès développeur — ${form.plan}`,
          message: `Projet : ${form.projet || '(non renseigné)'}\n\nCas d'usage :\n${form.useCase}`,
          type: 'developer_access',
          submittedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok && res.status !== 404 && res.status !== 405) {
        throw new Error(`api_${res.status}`);
      }
    } catch {
      const subject = encodeURIComponent(`Demande d'accès développeur — ${form.plan}`);
      const body = encodeURIComponent(
        `Nom : ${form.nom}\nEmail : ${form.email}\nPlan souhaité : ${form.plan}\nProjet : ${form.projet || '(non renseigné)'}\n\nCas d'usage :\n${form.useCase}`,
      );
      window.location.href = `mailto:contact@akiprisaye.fr?subject=${subject}&body=${body}`;
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Portail API développeurs — A KI PRI SA YÉ</title>
        </Helmet>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
            <p className="text-gray-600 text-sm mb-6">
              Votre demande d'accès développeur <strong>{form.plan}</strong> a bien été reçue. Notre équipe vous
              répondra à <strong>{form.email}</strong> dans les 48 heures ouvrées.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Retour au portail
            </button>
          </div>
        </div>
      </>
    );
  }

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
          <div className="flex gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <Zap className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">10 endpoints en production — données.gouv.fr, Cloudflare &amp; partenaires</p>
              <p className="text-sm text-green-700 mt-0.5">
                Prix carburants, rappels produits (RappelConso V2), signalements consommateurs DOM (SignalConso DGCCRF),
                taux de change live, indice IEVR et crawl Browser Rendering sécurisé sont disponibles.
                Documentation OpenAPI complète et SDK prévus en V3.
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
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 space-y-2">
              <p className="font-semibold text-slate-900">🕷️ Browser Rendering Crawl (beta Cloudflare)</p>
              <p>
                Proxy serveur sécurisé vers <code className="text-xs bg-white px-1 py-0.5 rounded">/crawl</code> :
                HTML, Markdown ou JSON structuré via Workers AI, avec limite locale de <strong>50 pages</strong> par requête.
              </p>
              <p>
                Paramètres avancés supportés : <code className="text-xs bg-white px-1 py-0.5 rounded">options.includePatterns</code>,
                <code className="text-xs bg-white px-1 py-0.5 rounded ml-1">options.excludePatterns</code>,
                <code className="text-xs bg-white px-1 py-0.5 rounded ml-1">modifiedSince</code>,
                <code className="text-xs bg-white px-1 py-0.5 rounded ml-1">jsonOptions</code>,
                <code className="text-xs bg-white px-1 py-0.5 rounded ml-1">rejectResourceTypes</code> et
                <code className="text-xs bg-white px-1 py-0.5 rounded ml-1">authenticate</code>.
              </p>
              <p>
                Cloudflare gère l&apos;asynchronisme, la pagination automatique au-delà de 10 Mo et le respect de
                <code className="text-xs bg-white px-1 py-0.5 rounded ml-1">robots.txt</code> / <code className="text-xs bg-white px-1 py-0.5 rounded">crawl-delay</code>.
              </p>
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-950 space-y-3">
              <p className="font-semibold">🔐 Autorisation Cloudflare à sélectionner</p>
              <p>
                Dans l&apos;écran <strong>Create Custom Token</strong> de Cloudflare, choisir exactement :
                <strong className="ml-1">Compte → Browser Rendering → Modifier / Edit</strong>.
              </p>
              <p>
                Restreignez ensuite le jeton au <strong>compte Cloudflare concerné</strong>. Il n&apos;est pas nécessaire
                d&apos;ajouter des permissions <code className="text-xs bg-white px-1 py-0.5 rounded">Zone</code>,
                <code className="text-xs bg-white px-1 py-0.5 rounded ml-1">DNS</code>,
                <code className="text-xs bg-white px-1 py-0.5 rounded ml-1">Workers</code> ou
                <code className="text-xs bg-white px-1 py-0.5 rounded ml-1">Pages</code> pour ce proxy.
              </p>
              <p>
                Le <code className="text-xs bg-white px-1 py-0.5 rounded">CLOUDFLARE_BROWSER_RENDERING_API_TOKEN</code>
                est le jeton Cloudflare. Le
                <code className="text-xs bg-white px-1 py-0.5 rounded ml-1">BROWSER_RENDERING_SHARED_SECRET</code> est
                un secret applicatif à créer manuellement pour protéger l&apos;endpoint serveur.
              </p>
              <pre className="bg-white border border-amber-200 rounded-lg p-3 text-xs text-slate-800 overflow-x-auto whitespace-pre-wrap">
                {BROWSER_RENDERING_ENV_SNIPPET}
              </pre>
            </div>
          </div>

          {/* Exemple de réponse */}
          <div>
            <h2 className="font-bold text-gray-900 mb-3">💻 Exemple de réponse</h2>
            <div className="bg-slate-900 rounded-xl p-5 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400 font-mono">GET /api/news?territory=gp&amp;type=rappels&amp;limit=10</span>
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

          {/* Formulaire demande d'accès développeur */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-gray-900">🔑 Demander un accès développeur</h2>
            </div>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    placeholder="Prénom Nom"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${
                      errors.nom ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {errors.nom && <p className="text-xs text-red-600 mt-1">{errors.nom}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse e-mail *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="vous@exemple.com"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${
                      errors.email ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du projet / application
                  </label>
                  <input
                    type="text"
                    value={form.projet}
                    onChange={(e) => handleChange('projet', e.target.value)}
                    placeholder="Ex : MonApp Prix DOM"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan souhaité
                  </label>
                  <select
                    value={form.plan}
                    onChange={(e) => handleChange('plan', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {PLANS_API.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} — {p.calls} requêtes/jour
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description du cas d'usage *
                </label>
                <textarea
                  rows={4}
                  value={form.useCase}
                  onChange={(e) => handleChange('useCase', e.target.value)}
                  placeholder="Décrivez brièvement comment vous souhaitez utiliser l'API (ex : application mobile de comparaison de prix, outil d'analyse, tableau de bord institutionnel…)"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none ${
                    errors.useCase ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {errors.useCase && <p className="text-xs text-red-600 mt-1">{errors.useCase}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {submitting ? 'Envoi…' : 'Envoyer ma demande'}
              </button>
            </form>
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
