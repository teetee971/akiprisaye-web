import React, { useState } from 'react';

export default function Hero({ modules, activeModule, setActiveModule }) {
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      role="banner"
      aria-labelledby="hero-title"
      style={{
        background: `
          radial-gradient(ellipse 1200px 800px at 20% 0%, rgba(96, 165, 250, 0.3), transparent 50%),
          radial-gradient(ellipse 1000px 600px at 80% 100%, rgba(147, 51, 234, 0.25), transparent 50%),
          radial-gradient(ellipse 800px 600px at 50% 50%, rgba(6, 182, 212, 0.15), transparent 50%),
          linear-gradient(135deg, rgba(219, 234, 254, 0.8) 0%, rgba(237, 233, 254, 0.6) 50%, rgba(254, 249, 195, 0.4) 100%)
        `
      }}
    >
      {/* Enhanced animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-cyan-300/15 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-300/10 to-blue-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      
      {/* Main glassmorphism container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div 
          className="backdrop-blur-xl bg-white/25 border border-white/30 rounded-3xl p-8 md:p-12 lg:p-16 shadow-2xl shadow-black/20"
          style={{
            background: `
              linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%),
              linear-gradient(45deg, rgba(96, 165, 250, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)
            `,
            backdropFilter: 'blur(20px)',
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(255, 255, 255, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.3)
            `
          }}
        >
          
          {/* Header section with enhanced typography */}
          <div className="text-center mb-12">
            <h1 
              id="hero-title"
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight"
              style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #1e3a8a 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            >
              A KI PRI SA YÉ
            </h1>
            
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-800 mb-8 max-w-4xl mx-auto leading-relaxed drop-shadow-sm">
              Comparateur de prix intelligent pour les DROM-COM
            </h2>
            
            {/* Enhanced call-to-action button with animation */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => setActiveModule('map')}
                onMouseEnter={() => setIsButtonHovered(true)}
                onMouseLeave={() => setIsButtonHovered(false)}
                className="group relative inline-flex items-center px-8 py-4 text-lg font-bold text-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300/50 focus:ring-offset-2 focus:ring-offset-white/10 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #6366f1 100%)',
                  boxShadow: `
                    0 20px 25px -5px rgba(59, 130, 246, 0.4),
                    0 10px 10px -5px rgba(139, 92, 246, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2)
                  `
                }}
                aria-label="Commencer à comparer les prix avec la carte interactive"
              >
                <span className="mr-3 text-xl transition-transform duration-300 group-hover:rotate-12">
                  🗺️
                </span>
                <span className="relative">
                  Commencer la comparaison
                  <span className={`absolute inset-0 bg-white/20 rounded-2xl transition-opacity duration-300 ${isButtonHovered ? 'opacity-100' : 'opacity-0'}`}></span>
                </span>
                <svg 
                  className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              
              <button
                onClick={() => setActiveModule('notifications')}
                className="inline-flex items-center px-6 py-3 text-base font-semibold text-gray-800 rounded-xl hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-300/50 transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
                aria-label="Configurer les notifications de prix"
              >
                <span className="mr-2">🔔</span>
                Recevoir des alertes
              </button>
            </div>
          </div>

          {/* Enhanced features grid with glassmorphism cards */}
          <div className="mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">
              🎉 Modules Intégrés et Améliorés
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.slice(1).map((module, index) => (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className="group p-6 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300/50 text-left"
                  style={{ 
                    background: `
                      linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 100%),
                      linear-gradient(45deg, rgba(96, 165, 250, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)
                    `,
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: `
                      0 20px 25px -5px rgba(0, 0, 0, 0.1),
                      0 10px 10px -5px rgba(0, 0, 0, 0.04),
                      inset 0 1px 0 rgba(255, 255, 255, 0.3)
                    `,
                    animationDelay: `${index * 100}ms` 
                  }}
                  aria-describedby={`module-${module.id}-description`}
                >
                  <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110">
                    {module.icon}
                  </div>
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">{module.name}</h4>
                  <p 
                    id={`module-${module.id}-description`}
                    className="text-sm text-gray-600 leading-relaxed"
                  >
                    {module.id === 'map' && 'Carte interactive avec géolocalisation, filtrage et heatmap des prix en temps réel'}
                    {module.id === 'notifications' && 'Alertes intelligentes PWA en temps réel pour ne manquer aucune promotion'}
                    {module.id === 'history' && 'Analyse historique et tendances des prix avec graphiques interactifs'}
                    {module.id === 'gamification' && 'Badges, défis et classement communautaire pour une expérience ludique'}
                    {module.id === 'feedback' && 'Système de retours utilisateur et roadmap publique collaborative'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced features detail grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div 
              className="p-6 rounded-2xl shadow-lg"
              style={{
                background: `
                  linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 100%),
                  linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)
                `,
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h4 className="text-lg font-bold mb-3 text-gray-900 flex items-center">
                <span className="mr-2">🔔</span>
                Notifications Intelligentes
              </h4>
              <ul className="text-sm text-gray-700 space-y-2 leading-relaxed">
                <li>• Alertes de prix personnalisables</li>
                <li>• Notifications PWA hors-ligne</li>
                <li>• Détection automatique de promotions</li>
                <li>• Seuils d'alerte configurables</li>
              </ul>
            </div>
            
            <div 
              className="p-6 rounded-2xl shadow-lg"
              style={{
                background: `
                  linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 100%),
                  linear-gradient(45deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)
                `,
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h4 className="text-lg font-bold mb-3 text-gray-900 flex items-center">
                <span className="mr-2">🗺️</span>
                Carte GPS Interactive
              </h4>
              <ul className="text-sm text-gray-700 space-y-2 leading-relaxed">
                <li>• Géolocalisation en temps réel</li>
                <li>• Heatmap des zones de prix</li>
                <li>• Filtrage multi-critères avancé</li>
                <li>• Popups informatifs détaillés</li>
              </ul>
            </div>
            
            <div 
              className="p-6 rounded-2xl shadow-lg"
              style={{
                background: `
                  linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 100%),
                  linear-gradient(45deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)
                `,
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h4 className="text-lg font-bold mb-3 text-gray-900 flex items-center">
                <span className="mr-2">📈</span>
                Historique des Prix
              </h4>
              <ul className="text-sm text-gray-700 space-y-2 leading-relaxed">
                <li>• Graphiques d'évolution temporelle</li>
                <li>• Comparaison DOM vs Métropole</li>
                <li>• Analyse prédictive des tendances</li>
                <li>• Statistiques avancées détaillées</li>
              </ul>
            </div>
            
            <div 
              className="p-6 rounded-2xl shadow-lg"
              style={{
                background: `
                  linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 100%),
                  linear-gradient(45deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)
                `,
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h4 className="text-lg font-bold mb-3 text-gray-900 flex items-center">
                <span className="mr-2">🏆</span>
                Système de Gamification
              </h4>
              <ul className="text-sm text-gray-700 space-y-2 leading-relaxed">
                <li>• Badges de réalisations</li>
                <li>• Classement communautaire</li>
                <li>• Défis et challenges hebdomadaires</li>
                <li>• Système de points et niveaux</li>
              </ul>
            </div>
            
            <div 
              className="p-6 rounded-2xl shadow-lg"
              style={{
                background: `
                  linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 100%),
                  linear-gradient(45deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)
                `,
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h4 className="text-lg font-bold mb-3 text-gray-900 flex items-center">
                <span className="mr-2">♿</span>
                Accessibilité Renforcée
              </h4>
              <ul className="text-sm text-gray-700 space-y-2 leading-relaxed">
                <li>• Contraste élevé adaptatif</li>
                <li>• Mode dyslexie optimisé</li>
                <li>• Navigation vocale intelligente</li>
                <li>• Tailles de texte personnalisables</li>
              </ul>
            </div>
            
            <div 
              className="p-6 rounded-2xl shadow-lg"
              style={{
                background: `
                  linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 100%),
                  linear-gradient(45deg, rgba(236, 72, 153, 0.1) 0%, rgba(219, 39, 119, 0.05) 100%)
                `,
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h4 className="text-lg font-bold mb-3 text-gray-900 flex items-center">
                <span className="mr-2">💬</span>
                Feedback Utilisateur
              </h4>
              <ul className="text-sm text-gray-700 space-y-2 leading-relaxed">
                <li>• Système de signalement intégré</li>
                <li>• Enquêtes de satisfaction</li>
                <li>• Roadmap publique et votes</li>
                <li>• Suivi des retours utilisateur</li>
              </ul>
            </div>
          </div>

          {/* Action buttons section */}
          <div 
            className="p-6 rounded-2xl shadow-lg mb-8"
            style={{
              background: `
                linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 100%),
                linear-gradient(45deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)
              `,
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
            }}
          >
            <h4 className="text-xl font-bold mb-4 text-gray-900 text-center">
              🧪 Explorer les fonctionnalités
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button 
                onClick={() => setActiveModule('map')}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300/50"
                aria-label="Ouvrir la carte interactive"
              >
                🗺️ Carte interactive
              </button>
              <button 
                onClick={() => setActiveModule('notifications')}
                className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 text-sm font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300/50"
                aria-label="Configurer les notifications PWA"
              >
                🔔 Notifications PWA
              </button>
              <button 
                onClick={() => setActiveModule('history')}
                className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 text-sm font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300/50"
                aria-label="Voir l'historique des prix"
              >
                📈 Historique prix
              </button>
              <button 
                onClick={() => setActiveModule('gamification')}
                className="px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-xl hover:from-yellow-700 hover:to-yellow-800 text-sm font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300/50"
                aria-label="Voir les badges et défis"
              >
                🏆 Badges & défis
              </button>
              <button 
                onClick={() => setActiveModule('feedback')}
                className="px-4 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-xl hover:from-pink-700 hover:to-pink-800 text-sm font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-300/50"
                aria-label="Donner son feedback et voir la roadmap"
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
                className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 text-sm font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300/50"
                aria-label="Activer les fonctionnalités PWA"
              >
                ⚙️ Activer PWA
              </button>
            </div>
          </div>

          {/* Features summary with enhanced styling */}
          <div 
            className="p-6 rounded-2xl shadow-lg"
            style={{
              background: `
                linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%),
                linear-gradient(45deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%)
              `,
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 15px 45px rgba(0, 0, 0, 0.12)'
            }}
          >
            <h4 className="text-xl font-bold mb-4 text-gray-900 text-center">
              ✅ Intégration Complète Réalisée
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h5 className="font-semibold mb-3 text-gray-900">🎯 Modules Fonctionnels</h5>
                <ul className="text-gray-700 space-y-2 leading-relaxed">
                  <li>• Module GPS interactif avec Leaflet</li>
                  <li>• Notifications intelligentes PWA</li>
                  <li>• Comparatif historique avec Chart.js</li>
                  <li>• Gamification complète</li>
                  <li>• Accessibilité renforcée</li>
                  <li>• Système de feedback utilisateur</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-3 text-gray-900">🚀 Optimisations</h5>
                <ul className="text-gray-700 space-y-2 leading-relaxed">
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
      </div>
    </section>
  );
}