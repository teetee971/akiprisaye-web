import React, { useState } from 'react';
import NotificationSystem from './components/NotificationSystem';
import HistoricalPriceComparison from './components/HistoricalPriceComparison';
import GamificationSystem from './components/GamificationSystem';
import AccessibilityPanel from './components/AccessibilityPanel';
import UserFeedbackSystem from './components/UserFeedbackSystem';
import GrandesSurfacesDOMTOM from './components/GrandesSurfacesDOMTOM';
import AIOrchestrationDashboard from './components/AIOrchestrationDashboard';
import Carte from './pages/Carte';

export default function App() {
  const [activeModule, setActiveModule] = useState('home');

  const modules = [
    { id: 'home', name: 'Accueil', icon: '🏠' },
    { id: 'ai-orchestration', name: 'Orchestrateur IA', icon: '🤖' },
    { id: 'map', name: 'Carte GPS', icon: '🗺️' },
    { id: 'stores', name: 'Grandes Surfaces', icon: '🏪' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'history', name: 'Historique Prix', icon: '📈' },
    { id: 'gamification', name: 'Gamification', icon: '🏆' },
    { id: 'feedback', name: 'Feedback', icon: '💬' },
  ];

  const renderModule = () => {
    switch (activeModule) {
      case 'ai-orchestration':
        return <AIOrchestrationDashboard />;
      case 'map':
        return <Carte />;
      case 'stores':
        return <GrandesSurfacesDOMTOM />;
      case 'notifications':
        return <NotificationSystem />;
      case 'history':
        return <HistoricalPriceComparison />;
      case 'gamification':
        return <GamificationSystem />;
      case 'feedback':
        return <UserFeedbackSystem />;
      default:
        return (
          <div className="max-w-7xl mx-auto p-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                A KI PRI SA YÉ
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Comparateur de prix intelligent pour les DROM-COM
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-6">🎉 Modules Intégrés et Améliorés</h2>
                <div className="mb-6 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border-2 border-blue-200">
                  <h3 className="text-lg font-bold text-blue-800 mb-2">🤖 NOUVEAU: Orchestrateur d'IA</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Système d'orchestration IA permettant le déploiement autonome d'instances IA spécialisées 
                    pour l'analyse, l'optimisation et l'adaptation aux besoins détectés.
                  </p>
                  <button
                    onClick={() => setActiveModule('ai-orchestration')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    🚀 Découvrir l'Orchestrateur IA
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modules.slice(1).map(module => (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      <div className="text-3xl mb-3">{module.icon}</div>
                      <h3 className="font-semibold text-gray-900 mb-2">{module.name}</h3>
                      <p className="text-sm text-gray-600">
                        {module.id === 'ai-orchestration' && 'Déploiement autonome et orchestration d\'IA spécialisées'}
                        {module.id === 'map' && 'Carte interactive avec géolocalisation, filtrage et heatmap'}
                        {module.id === 'notifications' && 'Alertes intelligentes PWA en temps réel'}
                        {module.id === 'history' && 'Analyse historique et tendances des prix'}
                        {module.id === 'gamification' && 'Badges, défis et classement communautaire'}
                        {module.id === 'feedback' && 'Système de retours et roadmap publique'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Enhanced Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold mb-3">🤖 Orchestrateur d'IA</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Déploiement autonome d'IA spécialisées</li>
                  <li>• Détection des besoins et optimisation</li>
                  <li>• Adaptation territoriale DOM-TOM/Métropole</li>
                  <li>• Gouvernance et sécurité avancées</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">🔔 Notifications Intelligentes</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Alertes de prix personnalisables</li>
                  <li>• Notifications PWA hors-ligne</li>
                  <li>• Détection de promotions</li>
                  <li>• Seuils d'alerte configurables</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">🗺️ Carte GPS Interactive</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Géolocalisation en temps réel</li>
                  <li>• Heatmap des zones de prix</li>
                  <li>• Filtrage multi-critères</li>
                  <li>• Popups informatifs détaillés</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">📈 Historique des Prix</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Graphiques d'évolution temporelle</li>
                  <li>• Comparaison DOM vs Métropole</li>
                  <li>• Analyse prédictive des tendances</li>
                  <li>• Statistiques avancées</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">🏆 Système de Gamification</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Badges de réalisations</li>
                  <li>• Classement communautaire</li>
                  <li>• Défis et challenges hebdomadaires</li>
                  <li>• Système de points et niveaux</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">♿ Accessibilité Renforcée</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Contraste élevé adaptatif</li>
                  <li>• Mode dyslexie optimisé</li>
                  <li>• Navigation vocale intelligente</li>
                  <li>• Tailles de texte personnalisables</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3">💬 Feedback Utilisateur</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Système de signalement intégré</li>
                  <li>• Enquêtes de satisfaction</li>
                  <li>• Roadmap publique et votes</li>
                  <li>• Suivi des retours utilisateur</li>
                </ul>
              </div>
            </div>
            
            {/* Demo Actions */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold mb-4">🧪 Explorer les fonctionnalités</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => setActiveModule('ai-orchestration')}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 text-sm font-medium"
                >
                  🤖 Orchestrateur IA
                </button>
                <button 
                  onClick={() => setActiveModule('map')}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  🗺️ Carte interactive
                </button>
                <button 
                  onClick={() => setActiveModule('notifications')}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  🔔 Notifications PWA
                </button>
                <button 
                  onClick={() => setActiveModule('history')}
                  className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  📈 Historique prix
                </button>
                <button 
                  onClick={() => setActiveModule('gamification')}
                  className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                >
                  🏆 Badges & défis
                </button>
                <button 
                  onClick={() => setActiveModule('feedback')}
                  className="px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm"
                >
                  💬 Feedback & roadmap
                </button>
                <button 
                  onClick={() => {
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.register('/service-worker.js');
                      alert('✅ Service Worker activé pour les notifications PWA!');
                    }
                  }}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  ⚙️ Activer PWA
                </button>
              </div>
            </div>

            {/* Features Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">✅ Intégration Complète Réalisée</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">🎯 Modules Fonctionnels</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Orchestrateur IA avec déploiement autonome</li>
                    <li>• Module GPS interactif avec Leaflet</li>
                    <li>• Notifications intelligentes PWA</li>
                    <li>• Comparatif historique avec Chart.js</li>
                    <li>• Gamification complète</li>
                    <li>• Accessibilité renforcée</li>
                    <li>• Système de feedback utilisateur</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🚀 Optimisations</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Service Worker PWA avancé</li>
                    <li>• CI/CD automatisé avec GitHub Actions</li>
                    <li>• Tests et badges de qualité</li>
                    <li>• Déploiement multi-plateforme</li>
                    <li>• Performance et accessibilité</li>
                    <li>• Documentation utilisateur</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex-shrink-0">
                <span className="text-xl font-bold text-blue-600">A KI PRI SA YÉ</span>
              </div>
              <div className="hidden md:flex space-x-4">
                {modules.map(module => (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeModule === module.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-1">{module.icon}</span>
                    {module.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Mobile menu */}
            <div className="md:hidden">
              <select
                value={activeModule}
                onChange={(e) => setActiveModule(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {modules.map(module => (
                  <option key={module.id} value={module.id}>
                    {module.icon} {module.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-6">
        {renderModule()}
      </main>

      {/* Accessibility Panel (always present) */}
      <AccessibilityPanel />
    </div>
  );
}

