import React, { useState } from 'react';
import NotificationSystem from './components/NotificationSystem';
import HistoricalPriceComparison from './components/HistoricalPriceComparison';
import GamificationSystem from './components/GamificationSystem';
import AccessibilityPanel from './components/AccessibilityPanel';
import UserFeedbackSystem from './components/UserFeedbackSystem';
import Hero from './components/Hero';
import Carte from './pages/Carte';

export default function App() {
  const [activeModule, setActiveModule] = useState('home');

  const modules = [
    { id: 'home', name: 'Accueil', icon: '🏠' },
    { id: 'map', name: 'Carte GPS', icon: '🗺️' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'history', name: 'Historique Prix', icon: '📈' },
    { id: 'gamification', name: 'Gamification', icon: '🏆' },
    { id: 'feedback', name: 'Feedback', icon: '💬' },
  ];

  const renderModule = () => {
    switch (activeModule) {
      case 'map':
        return <Carte />;
      case 'notifications':
        return <NotificationSystem />;
      case 'history':
        return <HistoricalPriceComparison />;
      case 'gamification':
        return <GamificationSystem />;
      case 'feedback':
        return <UserFeedbackSystem />;
      default:
        return <Hero modules={modules} activeModule={activeModule} setActiveModule={setActiveModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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

