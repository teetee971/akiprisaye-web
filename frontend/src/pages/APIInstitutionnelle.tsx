/**
 * APIInstitutionnelle — Documentation publique OpenAPI-style
 * Route : /api-docs
 */

import { useState } from 'react';
import { Code, BookOpen, Key, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Param {
  name: string;
  in: 'query' | 'header' | 'path';
  required: boolean;
  type: string;
  description: string;
}

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  params: Param[];
  exampleResponse: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/prices',
    description: 'Liste des prix par territoire. Retourne les prix les plus récents pour chaque produit et enseigne.',
    params: [
      { name: 'territory', in: 'query', required: false, type: 'string', description: 'Code territoire (ex: martinique, guadeloupe)' },
      { name: 'category', in: 'query', required: false, type: 'string', description: 'Catégorie de produit' },
      { name: 'limit', in: 'query', required: false, type: 'integer', description: 'Nombre de résultats (défaut: 20, max: 100)' },
      { name: 'x-api-key', in: 'header', required: false, type: 'string', description: 'Clé API pour quota étendu' },
    ],
    exampleResponse: JSON.stringify({
      data: [
        { productId: 'riz-1kg', productName: 'Riz long grain 1kg', store: 'Carrefour', price: 3.20, territory: 'martinique', updatedAt: '2025-01-17T09:45:00Z' },
        { productId: 'huile-1l', productName: 'Huile tournesol 1L', store: 'Leclerc', price: 2.85, territory: 'guadeloupe', updatedAt: '2025-01-17T09:30:00Z' },
      ],
      meta: { total: 1240, page: 1, limit: 20 },
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/v1/products',
    description: 'Catalogue complet des produits référencés dans l\'observatoire.',
    params: [
      { name: 'q', in: 'query', required: false, type: 'string', description: 'Recherche par nom de produit' },
      { name: 'ean', in: 'query', required: false, type: 'string', description: 'Code EAN/barcode' },
      { name: 'category', in: 'query', required: false, type: 'string', description: 'Filtrer par catégorie' },
    ],
    exampleResponse: JSON.stringify({
      data: [
        { id: 'riz-1kg', name: 'Riz long grain 1kg', category: 'Épicerie', ean: '3017620422003', brand: 'Uncle Ben\'s' },
        { id: 'huile-1l', name: 'Huile de tournesol 1L', category: 'Épicerie', ean: '3045320094084', brand: 'Lesieur' },
      ],
      meta: { total: 8450, page: 1, limit: 20 },
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/v1/territories',
    description: 'Liste des territoires couverts par l\'observatoire avec leurs métadonnées.',
    params: [],
    exampleResponse: JSON.stringify({
      data: [
        { code: 'martinique', name: 'Martinique', region: 'DOM', population: 350000, currency: 'EUR' },
        { code: 'guadeloupe', name: 'Guadeloupe', region: 'DOM', population: 395000, currency: 'EUR' },
        { code: 'reunion', name: 'La Réunion', region: 'DOM', population: 860000, currency: 'EUR' },
        { code: 'guyane', name: 'Guyane', region: 'DOM', population: 300000, currency: 'EUR' },
        { code: 'mayotte', name: 'Mayotte', region: 'DOM', population: 380000, currency: 'EUR' },
      ],
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/v1/health',
    description: 'Vérification de l\'état de santé de l\'API. Pas de clé requise.',
    params: [],
    exampleResponse: JSON.stringify({ status: 'ok', version: '1.0', timestamp: 1705483200000 }, null, 2),
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  POST: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PUT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);

  return (
    <div className='border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden'>
      <button
        onClick={() => setOpen((v) => !v)}
        className='w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left'
      >
        <div className='flex items-center gap-3'>
          <span className={`text-xs font-bold px-2 py-1 rounded font-mono ${METHOD_COLORS[endpoint.method]}`}>
            {endpoint.method}
          </span>
          <code className='text-sm text-gray-900 dark:text-white font-mono'>{endpoint.path}</code>
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-sm text-gray-500 dark:text-gray-400 hidden md:block'>{endpoint.description.slice(0, 60)}…</span>
          {open ? <ChevronDown className='w-4 h-4 text-gray-400' /> : <ChevronRight className='w-4 h-4 text-gray-400' />}
        </div>
      </button>

      {open && (
        <div className='border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-5 space-y-4'>
          <p className='text-sm text-gray-700 dark:text-gray-300'>{endpoint.description}</p>

          {endpoint.params.length > 0 && (
            <div>
              <h4 className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2'>Paramètres</h4>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-gray-200 dark:border-gray-700'>
                      {['Nom', 'Dans', 'Requis', 'Type', 'Description'].map((h) => (
                        <th key={h} className='text-left py-1.5 px-2 text-xs text-gray-500 dark:text-gray-400 font-medium'>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.params.map((p) => (
                      <tr key={p.name} className='border-b border-gray-100 dark:border-gray-800'>
                        <td className='py-1.5 px-2 font-mono text-xs text-gray-900 dark:text-white'>{p.name}</td>
                        <td className='py-1.5 px-2 text-xs text-gray-500'>{p.in}</td>
                        <td className='py-1.5 px-2 text-xs'>
                          {p.required ? (
                            <span className='text-red-600 dark:text-red-400'>requis</span>
                          ) : (
                            <span className='text-gray-400'>optionnel</span>
                          )}
                        </td>
                        <td className='py-1.5 px-2 font-mono text-xs text-blue-600 dark:text-blue-400'>{p.type}</td>
                        <td className='py-1.5 px-2 text-xs text-gray-600 dark:text-gray-400'>{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h4 className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2'>Exemple de réponse</h4>
            <pre className='text-xs font-mono bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto'>
              {endpoint.exampleResponse}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function APIInstitutionnelle() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-8 space-y-8'>
      {/* Header */}
      <div className='flex items-center gap-3'>
        <BookOpen className='text-blue-500 w-8 h-8' />
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>API Institutionnelle</h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Documentation de référence · v1.0 · REST/JSON
          </p>
        </div>
      </div>

      {/* Intro */}
      <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5'>
        <h2 className='font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2'>
          <Code className='w-5 h-5' />
          Accès à l'API
        </h2>
        <p className='text-sm text-blue-800 dark:text-blue-400 mb-3'>
          L'API A KI PRI SA YÉ permet d'accéder aux données de prix des territoires d'Outre-mer.
          Authentification via header <code className='font-mono bg-blue-100 dark:bg-blue-800 px-1 rounded'>x-api-key</code>.
          Sans clé : 100 req/jour. Avec clé : 1 000 req/jour (gratuit) ou 10 000 req/jour (Pro).
        </p>
        <div className='flex gap-3 flex-wrap'>
          <Link
            to='/api-keys'
            className='flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
          >
            <Key className='w-4 h-4' />
            Obtenir une clé API
          </Link>
          <a
            href='mailto:api@akiprisaye.re'
            className='text-sm border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors'
          >
            Contacter l'équipe
          </a>
        </div>
      </div>

      {/* Base URL */}
      <div className='bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-xl p-4'>
        <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>URL de base</p>
        <code className='text-sm font-mono text-gray-900 dark:text-white'>https://api.akiprisaye.re</code>
      </div>

      {/* Endpoints */}
      <div>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Endpoints</h2>
        <div className='space-y-3'>
          {ENDPOINTS.map((ep) => (
            <EndpointCard key={ep.path} endpoint={ep} />
          ))}
        </div>
      </div>

      {/* Rate limiting */}
      <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>Limites de taux</h2>
        <div className='grid sm:grid-cols-3 gap-4'>
          {[
            { plan: 'Sans clé', limit: '100 req/jour', color: 'text-gray-600 dark:text-gray-400' },
            { plan: 'Gratuit', limit: '1 000 req/jour', color: 'text-blue-600 dark:text-blue-400' },
            { plan: 'Pro', limit: '10 000 req/jour', color: 'text-purple-600 dark:text-purple-400' },
          ].map((p) => (
            <div key={p.plan} className='bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center'>
              <p className='text-sm font-medium text-gray-900 dark:text-white'>{p.plan}</p>
              <p className={`text-lg font-bold ${p.color}`}>{p.limit}</p>
            </div>
          ))}
        </div>
        <p className='mt-3 text-xs text-gray-500 dark:text-gray-400'>
          Les headers <code className='font-mono'>X-RateLimit-Limit</code>, <code className='font-mono'>X-RateLimit-Remaining</code> et <code className='font-mono'>X-RateLimit-Reset</code> sont inclus dans chaque réponse.
        </p>
      </div>
    </div>
  );
}
