import React, { useState, useEffect } from 'react';
import AIOrchestrationService from '../services/AIOrchestrationService';

const AIOrchestrationDashboard = () => {
  const [activeAIs, setActiveAIs] = useState([]);
  const [deploymentHistory, setDeploymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoDeployEnabled, setAutoDeployEnabled] = useState(true);
  const [selectedAIType, setSelectedAIType] = useState('');
  const [manualDeployForm, setManualDeployForm] = useState({
    name: '',
    type: 'analysis',
    capabilities: '',
    territory: 'general'
  });

  useEffect(() => {
    initializeDashboard();
    const interval = setInterval(refreshData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);
      // Initialize orchestration service with dummy config for demo
      await AIOrchestrationService.initialize({
        apiKey: "demo-key",
        projectId: "a-ki-pri-sa-ye"
      });
      refreshData();
    } catch (error) {
      console.error('Erreur initialisation dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    const ais = AIOrchestrationService.getActiveAIs();
    setActiveAIs(ais);
  };

  const handleManualDeploy = async () => {
    try {
      const capabilities = manualDeployForm.capabilities.split(',').map(c => c.trim());
      
      const aiSpec = {
        name: manualDeployForm.name,
        type: manualDeployForm.type,
        capabilities,
        territory: manualDeployForm.territory,
        communication: {
          topics: [`${manualDeployForm.type}_data`, 'general_communication']
        }
      };

      await AIOrchestrationService.deployAI(aiSpec);
      refreshData();
      
      // Reset form
      setManualDeployForm({
        name: '',
        type: 'analysis',
        capabilities: '',
        territory: 'general'
      });
      
      alert('IA déployée avec succès !');
    } catch (error) {
      alert(`Erreur déploiement: ${error.message}`);
    }
  };

  const handleRemoveAI = async (aiId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette IA ?')) {
      try {
        await AIOrchestrationService.removeAI(aiId);
        refreshData();
      } catch (error) {
        alert(`Erreur suppression: ${error.message}`);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'active': 'bg-green-100 text-green-800',
      'deploying': 'bg-yellow-100 text-yellow-800',
      'error': 'bg-red-100 text-red-800',
      'stopped': 'bg-gray-100 text-gray-800'
    };
    
    return badges[status] || badges['stopped'];
  };

  const getTypeIcon = (type) => {
    const icons = {
      'analysis': '📊',
      'optimization': '⚡',
      'monitoring': '👁️',
      'prediction': '🔮',
      'security': '🛡️'
    };
    
    return icons[type] || '🤖';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initialisation du système d'orchestration IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">🧠 Orchestration IA</h1>
        <p className="text-blue-100">
          Système de déploiement et d'intégration dynamique d'IA spécialisées
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">🤖</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">IA Actives</p>
              <p className="text-2xl font-bold text-gray-900">{activeAIs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Auto-Deploy</p>
              <p className="text-2xl font-bold text-gray-900">
                {autoDeployEnabled ? 'ON' : 'OFF'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">🌍</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Territoires</p>
              <p className="text-2xl font-bold text-gray-900">DOM-TOM</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">🔒</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sécurité</p>
              <p className="text-2xl font-bold text-gray-900">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-bold mb-4">⚙️ Contrôles de déploiement</h2>
        
        <div className="flex items-center space-x-4 mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoDeployEnabled}
              onChange={(e) => setAutoDeployEnabled(e.target.checked)}
              className="mr-2"
            />
            Auto-déploiement activé
          </label>
          
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Actualiser
          </button>
        </div>

        {/* Manual Deploy Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Nom de l'IA"
            value={manualDeployForm.name}
            onChange={(e) => setManualDeployForm({...manualDeployForm, name: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          
          <select
            value={manualDeployForm.type}
            onChange={(e) => setManualDeployForm({...manualDeployForm, type: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="analysis">Analyse</option>
            <option value="optimization">Optimisation</option>
            <option value="monitoring">Monitoring</option>
            <option value="prediction">Prédiction</option>
            <option value="security">Sécurité</option>
          </select>
          
          <input
            type="text"
            placeholder="Capacités (séparées par virgules)"
            value={manualDeployForm.capabilities}
            onChange={(e) => setManualDeployForm({...manualDeployForm, capabilities: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          
          <select
            value={manualDeployForm.territory}
            onChange={(e) => setManualDeployForm({...manualDeployForm, territory: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="general">Général</option>
            <option value="guadeloupe">Guadeloupe</option>
            <option value="martinique">Martinique</option>
            <option value="guyane">Guyane</option>
            <option value="reunion">Réunion</option>
            <option value="mayotte">Mayotte</option>
          </select>
          
          <button
            onClick={handleManualDeploy}
            disabled={!manualDeployForm.name || !manualDeployForm.capabilities}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            🚀 Déployer
          </button>
        </div>
      </div>

      {/* Active AIs List */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-bold mb-4">🤖 IA Actives</h2>
        
        {activeAIs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-4 block">🤖</span>
            <p>Aucune IA déployée pour le moment</p>
            <p className="text-sm">Utilisez le formulaire ci-dessus pour déployer votre première IA</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAIs.map((ai) => (
              <div key={ai.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{getTypeIcon(ai.type)}</span>
                    <div>
                      <h3 className="font-semibold">{ai.name}</h3>
                      <p className="text-sm text-gray-600">{ai.type}</p>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(ai.status)}`}>
                    {ai.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Territoire:</span> {ai.territory}
                  </div>
                  
                  <div>
                    <span className="font-medium">Capacités:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ai.capabilities?.map((cap, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Déployée:</span> {ai.createdAt?.toLocaleString?.() || 'Inconnue'}
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleRemoveAI(ai.id)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                  >
                    🗑️ Supprimer
                  </button>
                  
                  <button className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200">
                    📊 Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Communication Network Visualization */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-bold mb-4">🌐 Réseau de communication IA</h2>
        
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <span className="text-4xl mb-4 block">🕸️</span>
          <p className="text-gray-600">Visualisation du réseau de communication entre IA</p>
          <p className="text-sm text-gray-500 mt-2">
            Cette section affichera un graphique interactif des communications entre IA
          </p>
        </div>
      </div>

      {/* Security & Governance */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-bold mb-4">🛡️ Sécurité & Gouvernance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Règles de sécurité</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Maximum 10 IA simultanées</li>
              <li>• Types autorisés: analyse, optimisation, monitoring, prédiction, sécurité</li>
              <li>• Adaptation automatique DOM-TOM</li>
              <li>• Validation anti-conflit</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Audit & Journalisation</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Tous les déploiements sont audités</li>
              <li>• Communications inter-IA enregistrées</li>
              <li>• Traçabilité complète des actions</li>
              <li>• Rapports de conformité automatiques</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIOrchestrationDashboard;