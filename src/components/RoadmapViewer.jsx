import React from 'react';

const RoadmapViewer = () => {
  const quarters = [
    {
      id: 'q4-2024',
      title: 'Q4 2024 - Fondations et Déploiement',
      color: 'bg-blue-500',
      items: [
        {
          category: '🚀 Déploiement Cloudflare Pages',
          tasks: [
            'CI/CD automatisé',
            'Badge de statut',
            'Monitoring',
            'CDN global'
          ]
        },
        {
          category: '🔍 Optimisation SEO & Accessibilité',
          tasks: [
            'Audit Lighthouse',
            'Balises structurées',
            'Performances mobiles',
            'Schema.org'
          ]
        },
        {
          category: '📊 Comparateur de Prix',
          tasks: [
            'Connexion API Data.gouv',
            'Fallback intelligent',
            'Gestion des erreurs',
            'Validation des données'
          ]
        },
        {
          category: '📰 Actualités Vie Chère',
          tasks: [
            'Agrégation par territoire',
            'Filtrage avancé',
            'Sources multiples',
            'Notifications'
          ]
        },
        {
          category: '🛡️ Dashboard Admin',
          tasks: [
            'Sécurisation Firebase Auth',
            'OCR tickets',
            'Reporting produits',
            'Modération'
          ]
        }
      ]
    },
    {
      id: 'q1-2025',
      title: 'Q1 2025 - Intelligence et Expérience',
      color: 'bg-green-500',
      items: [
        {
          category: '🤖 Intégration IA Dynamique',
          tasks: [
            'Ajout et déploiement d\'IA',
            'Interopérabilité',
            'Prédictions de prix',
            'Analyse des tendances'
          ]
        },
        {
          category: '📱 Améliorations PWA',
          tasks: [
            'Cache offline avancé',
            'Notifications push',
            'Installation simplifiée',
            'Synchronisation'
          ]
        },
        {
          category: '📱 Optimisation Mobile et Images',
          tasks: [
            'Format WebP',
            'Lazy loading',
            'Responsive design',
            'Compression intelligente'
          ]
        },
        {
          category: '📚 Documentation Complète',
          tasks: [
            'Guides utilisateurs',
            'Documentation développeurs',
            'Documentation API',
            'FAQ interactive'
          ]
        }
      ]
    },
    {
      id: 'q2-2025',
      title: 'Q2 2025 - Extension et Innovation',
      color: 'bg-purple-500',
      items: [
        {
          category: '✨ Nouvelles Fonctionnalités',
          tasks: [
            'Suggestions utilisateurs',
            'Extension DROM-COM',
            'Comparaisons internationales',
            'Gamification'
          ]
        },
        {
          category: '🔔 Système de Signalement Amélioré',
          tasks: [
            'Suivi en temps réel',
            'Modération automatisée',
            'Analytics avancés',
            'API publique'
          ]
        },
        {
          category: '⚙️ Automatisation des Releases',
          tasks: [
            'Suivi des milestones',
            'Releases automatiques',
            'Changelog automatique',
            'Tests d\'intégration'
          ]
        }
      ]
    }
  ];

  const metrics = [
    {
      category: 'Techniques',
      items: [
        'Lighthouse Score > 90',
        '99.9% uptime',
        '< 200ms pour les API',
        '> 80% couverture de tests'
      ]
    },
    {
      category: 'Utilisateurs',
      items: [
        '10k utilisateurs actifs/mois',
        '70% rétention à 30 jours',
        'NPS > 50',
        '100% couverture DROM-COM'
      ]
    },
    {
      category: 'Business',
      items: [
        '50k+ produits référencés',
        '10+ enseignes intégrées',
        '15% économies par foyer',
        '5+ médias locaux'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🗺️ Feuille de Route - A KI PRI SA YÉ
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          Plateforme de comparaison de prix pour les DROM-COM
        </p>
        <div className="bg-blue-50 p-4 rounded-lg inline-block">
          <p className="text-sm text-blue-800">
            <strong>Dernière mise à jour :</strong> 22 septembre 2025 à 14:01 UTC
          </p>
        </div>
      </div>

      {/* Vision du Projet */}
      <div className="mb-12 bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl">
        <h2 className="text-2xl font-bold mb-4">📋 Vision du Projet</h2>
        <p className="text-gray-700 text-lg leading-relaxed">
          A KI PRI SA YÉ vise à démocratiser l'accès à l'information sur les prix dans les départements 
          et régions d'outre-mer (Guadeloupe, Martinique, Guyane, Réunion, Mayotte) en offrant une 
          plateforme intelligente de comparaison de prix et de gestion budgétaire.
        </p>
      </div>

      {/* Quarters Timeline */}
      <div className="space-y-8 mb-12">
        {quarters.map((quarter, index) => (
          <div key={quarter.id} className="relative">
            <div className="flex items-center mb-6">
              <div className={`w-4 h-4 rounded-full ${quarter.color} mr-4`}></div>
              <h2 className="text-2xl font-bold text-gray-900">{quarter.title}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-8">
              {quarter.items.map((item, itemIndex) => (
                <div key={itemIndex} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">{item.category}</h3>
                  <ul className="space-y-2">
                    {item.tasks.map((task, taskIndex) => (
                      <li key={taskIndex} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span className="text-gray-700 text-sm">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            {index < quarters.length - 1 && (
              <div className="flex justify-center mt-8">
                <div className="w-0.5 h-8 bg-gray-300"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Métriques de Succès */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">📈 Métriques de Succès</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 text-center">{metric.category}</h3>
              <ul className="space-y-2">
                {metric.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <span className="text-blue-500 mr-2">📊</span>
                    <span className="text-gray-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Contribution */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-xl">
        <h2 className="text-2xl font-bold mb-4 text-center">🤝 Comment Contribuer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🐛</span>
              <div>
                <h3 className="font-semibold">Issues GitHub</h3>
                <p className="text-sm text-gray-600">Signaler un bug ou proposer une fonctionnalité</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔧</span>
              <div>
                <h3 className="font-semibold">Pull Requests</h3>
                <p className="text-sm text-gray-600">Contribuer directement au code</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">💬</span>
              <div>
                <h3 className="font-semibold">Discussions</h3>
                <p className="text-sm text-gray-600">Participer aux débats communautaires</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">📚</span>
              <div>
                <h3 className="font-semibold">Documentation</h3>
                <p className="text-sm text-gray-600">Améliorer les guides et tutoriels</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <a 
            href="https://github.com/teetee971/akiprisaye-web/issues" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">🚀</span>
            Contribuer sur GitHub
          </a>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Cette feuille de route est un document vivant, régulièrement mis à jour selon les retours utilisateurs 
          et l'évolution du contexte économique local.
        </p>
      </div>
    </div>
  );
};

export default RoadmapViewer;