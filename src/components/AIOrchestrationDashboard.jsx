import React, { useState, useEffect } from 'react';
import { aiOrchestrator } from '../services/aiOrchestration.js';

export default function AIOrchestrationDashboard() {
  const [aiInstances, setAiInstances] = useState([]);
  const [orchestratorStats, setOrchestratorStats] = useState({
    totalAIs: 0,
    runningAIs: 0,
    territories: {},
    specializations: {}
  });
  const [userControls, setUserControls] = useState({
    autoDeployment: true,
    maxInstances: 50,
    securityLevel: 'high'
  });
  const [logs, setLogs] = useState([]);
  const [selectedTerritory, setSelectedTerritory] = useState('all');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const activeAIs = aiOrchestrator.getActiveAIs();
      setAiInstances(activeAIs);

      // Calculate stats
      const stats = {
        totalAIs: aiOrchestrator.aiInstances.size,
        runningAIs: activeAIs.length,
        territories: {},
        specializations: {}
      };

      activeAIs.forEach(ai => {
        stats.territories[ai.territory] = (stats.territories[ai.territory] || 0) + 1;
        stats.specializations[ai.specialization] = (stats.specializations[ai.specialization] || 0) + 1;
      });

      setOrchestratorStats(stats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleDeployTestAI = async () => {
    try {
      const testAISpec = {
        type: 'test',
        specialization: 'demo_analysis',
        territory: selectedTerritory === 'all' ? 'DOM-TOM' : selectedTerritory,
        capabilities: ['data_analysis', 'monitoring'],
        config: { testMode: true }
      };

      await aiOrchestrator.deployAI(testAISpec);
      loadDashboardData();
    } catch (error) {
      console.error('Error deploying test AI:', error);
      alert('Erreur lors du déploiement de l\'IA de test');
    }
  };

  const handleDestroyAI = async (aiId) => {
    if (window.confirm('Êtes-vous sûr de vouloir détruire cette IA ?')) {
      try {
        await aiOrchestrator.destroyAI(aiId, 'user_request');
        loadDashboardData();
      } catch (error) {
        console.error('Error destroying AI:', error);
        alert('Erreur lors de la destruction de l\'IA');
      }
    }
  };

  const handleConfigUpdate = async () => {
    try {
      aiOrchestrator.updateConfig(userControls);
      alert('Configuration mise à jour avec succès');
    } catch (error) {
      console.error('Error updating config:', error);
      alert('Erreur lors de la mise à jour de la configuration');
    }
  };

  const filteredAIs = selectedTerritory === 'all' 
    ? aiInstances 
    : aiInstances.filter(ai => ai.territory === selectedTerritory);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 Orchestrateur d'IA - Tableau de Bord
        </h1>
        <p className="text-gray-600">
          Surveillance et gestion des instances IA de la plateforme A KI PRI SA YÉ
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="text-2xl text-blue-600">🤖</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">IA Totales</p>
              <p className="text-2xl font-bold text-gray-900">{orchestratorStats.totalAIs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="text-2xl text-green-600">✅</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">IA Actives</p>
              <p className="text-2xl font-bold text-gray-900">{orchestratorStats.runningAIs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="text-2xl text-yellow-600">🌍</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Territoires</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(orchestratorStats.territories).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="text-2xl text-purple-600">🎯</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Spécialisations</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(orchestratorStats.specializations).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">⚙️ Contrôles Utilisateur</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Déploiement Automatique
            </label>
            <select
              value={userControls.autoDeployment}
              onChange={(e) => setUserControls({...userControls, autoDeployment: e.target.value === 'true'})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={true}>Activé</option>
              <option value={false}>Désactivé</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Max d'IA
            </label>
            <input
              type="number"
              value={userControls.maxInstances}
              onChange={(e) => setUserControls({...userControls, maxInstances: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Niveau de Sécurité
            </label>
            <select
              value={userControls.securityLevel}
              onChange={(e) => setUserControls({...userControls, securityLevel: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="low">Faible</option>
              <option value="medium">Moyen</option>
              <option value="high">Élevé</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-4">
          <button
            onClick={handleConfigUpdate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            💾 Sauvegarder Configuration
          </button>
          <button
            onClick={handleDeployTestAI}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            🚀 Déployer IA de Test
          </button>
        </div>
      </div>

      {/* Territory Filter */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrer par Territoire
        </label>
        <select
          value={selectedTerritory}
          onChange={(e) => setSelectedTerritory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">Tous les territoires</option>
          <option value="DOM-TOM">DOM-TOM</option>
          <option value="Métropole">Métropole</option>
          <option value="global">Global</option>
        </select>
      </div>

      {/* AI Instances Grid */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          🤖 Instances IA Actives ({filteredAIs.length})
        </h2>
        
        {filteredAIs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🤖</div>
            <p>Aucune instance IA active pour le territoire sélectionné</p>
            <button
              onClick={handleDeployTestAI}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Déployer une IA de démonstration
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAIs.map((ai) => (
              <div key={ai.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="text-2xl mr-2">
                      {ai.type === 'analyzer' && '📊'}
                      {ai.type === 'detector' && '🔍'}
                      {ai.type === 'territorial_specialist' && '🌍'}
                      {ai.type === 'test' && '🧪'}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{ai.specialization}</h3>
                      <p className="text-sm text-gray-500">{ai.territory}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ai.status === 'running' ? 'bg-green-100 text-green-800' :
                    ai.status === 'deploying' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {ai.status}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Capacités:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ai.capabilities.map((cap, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-600">ID:</span>
                    <span className="ml-1 font-mono text-xs text-gray-500">
                      {ai.id.substring(0, 20)}...
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => alert(`Détails de l'IA ${ai.id}:\n${JSON.stringify(ai, null, 2)}`)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs"
                  >
                    📋 Détails
                  </button>
                  <button
                    onClick={() => handleDestroyAI(ai.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs"
                  >
                    🗑️ Détruire
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Territory & Specialization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">🌍 Répartition par Territoire</h3>
          {Object.keys(orchestratorStats.territories).length === 0 ? (
            <p className="text-gray-500">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(orchestratorStats.territories).map(([territory, count]) => (
                <div key={territory} className="flex justify-between items-center">
                  <span className="text-gray-700">{territory}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">🎯 Répartition par Spécialisation</h3>
          {Object.keys(orchestratorStats.specializations).length === 0 ? (
            <p className="text-gray-500">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(orchestratorStats.specializations).map(([spec, count]) => (
                <div key={spec} className="flex justify-between items-center">
                  <span className="text-gray-700">{spec.replace('_', ' ')}</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Features Info */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">✨ Fonctionnalités de l'Orchestrateur</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">🚀 Déploiement Autonome</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Détection automatique des besoins</li>
              <li>• Déploiement d'IA spécialisées</li>
              <li>• Adaptation territoriale DOM-TOM/Métropole</li>
              <li>• Optimisation des ressources</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">🔒 Sécurité & Gouvernance</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Contrôle de la prolifération</li>
              <li>• Validation des déploiements</li>
              <li>• Audit et traçabilité</li>
              <li>• Paramétrage utilisateur</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}