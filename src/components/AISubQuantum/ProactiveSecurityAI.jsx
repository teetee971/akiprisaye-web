import React, { useState, useEffect } from 'react';

const ProactiveSecurityAI = () => {
  const [securityStatus, setSecurityStatus] = useState({
    riskLevel: 'low',
    activeThreats: [],
    mitigatedRisks: [],
    resourceAllocation: {},
    predictions: []
  });

  const [isMonitoring, setIsMonitoring] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Simulate real-time security monitoring
    const interval = setInterval(() => {
      if (isMonitoring) {
        // Generate random security data
        const threats = [
          'Congestion trafic anormale Route Nationale',
          'Pic de consommation électrique non planifié',
          'Interruption réseau télécoms secteur Nord',
          'Condition météo dégradée approchant'
        ];

        const mitigated = [
          'Reroutage automatique trafic - Succès',
          'Activation groupes électrogènes de secours',
          'Basculement réseau vers antenne backup',
          'Alerte préventive diffusée aux citoyens'
        ];

        setSecurityStatus(prev => ({
          ...prev,
          activeThreats: Math.random() > 0.7 ? [threats[Math.floor(Math.random() * threats.length)]] : [],
          mitigatedRisks: [...prev.mitigatedRisks.slice(-2), mitigated[Math.floor(Math.random() * mitigated.length)]],
          riskLevel: Math.random() > 0.8 ? 'medium' : Math.random() > 0.95 ? 'high' : 'low'
        }));
      }
    }, 8000);

    // Initial security data
    setSecurityStatus({
      riskLevel: 'low',
      activeThreats: [],
      mitigatedRisks: [
        'Optimisation flux circulation - Terminé',
        'Répartition charge électrique - Appliqué',
        'Maintenance préventive réseau - Programmé'
      ],
      resourceAllocation: {
        emergencyServices: 85,
        infrastructure: 92,
        communication: 88,
        transport: 79
      },
      predictions: [
        'Risque d\'embouteillage prévu 17h-19h secteur Jarry',
        'Augmentation trafic réseau +15% week-end (festival)',
        'Consommation électrique pic dimanche 19h (match France)',
        'Conditions météo favorables maintenues 48h'
      ]
    });

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'red';
      default: return 'gray';
    }
  };

  const triggerEmergencyProtocol = () => {
    setAlerts([...alerts, {
      id: Date.now(),
      type: 'emergency',
      message: 'Protocole d\'urgence activé - Coordination inter-services en cours',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const adaptResourceAllocation = () => {
    setSecurityStatus(prev => ({
      ...prev,
      resourceAllocation: {
        emergencyServices: Math.min(100, prev.resourceAllocation.emergencyServices + 10),
        infrastructure: Math.min(100, prev.resourceAllocation.infrastructure + 5),
        communication: Math.min(100, prev.resourceAllocation.communication + 8),
        transport: Math.min(100, prev.resourceAllocation.transport + 12)
      }
    }));
    setAlerts([...alerts, {
      id: Date.now(),
      type: 'info',
      message: 'Réallocation adaptative des ressources effectuée',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🛡️ Sécurité Globale & Adaptation Proactive
        </h1>
        <p className="text-lg text-gray-600">
          IA d'anticipation des risques et adaptation des ressources en temps réel
        </p>
      </div>

      {/* Security Status Overview */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">État de Sécurité Global</h3>
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium text-${getRiskColor(securityStatus.riskLevel)}-800 bg-${getRiskColor(securityStatus.riskLevel)}-100`}>
              Niveau: {securityStatus.riskLevel.toUpperCase()}
            </span>
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isMonitoring 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isMonitoring ? '⏸️ Arrêter' : '▶️ Démarrer'} Surveillance
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(securityStatus.resourceAllocation).map(([service, allocation]) => (
            <div key={service} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2 capitalize">
                {service.replace(/([A-Z])/g, ' $1').trim()}
              </h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${allocation > 90 ? 'bg-green-500' : allocation > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${allocation}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{allocation}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Threats */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-red-700">
            ⚠️ Menaces Actives
          </h3>
          {securityStatus.activeThreats.length > 0 ? (
            <div className="space-y-3">
              {securityStatus.activeThreats.map((threat, index) => (
                <div key={index} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <p className="text-red-800 font-medium">{threat}</p>
                  <div className="mt-2 flex gap-2">
                    <button 
                      onClick={triggerEmergencyProtocol}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      🚨 Protocole d'urgence
                    </button>
                    <button 
                      onClick={adaptResourceAllocation}
                      className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                    >
                      🔄 Adapter ressources
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">✅</div>
              <p>Aucune menace active détectée</p>
            </div>
          )}
        </div>

        {/* Mitigated Risks */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-green-700">
            ✅ Risques Atténués
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {securityStatus.mitigatedRisks.map((risk, index) => (
              <div key={index} className="bg-green-50 border-l-4 border-green-500 p-3 rounded-r-lg">
                <p className="text-green-800 text-sm">{risk}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Predictions */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          🔮 Prédictions IA de Sécurité
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {securityStatus.predictions.map((prediction, index) => (
            <div key={index} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-blue-800 text-sm">{prediction}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Control Panel */}
      <div className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">🎛️ Panneau de Contrôle IA</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={triggerEmergencyProtocol}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🚨 Urgence Générale
          </button>
          <button 
            onClick={adaptResourceAllocation}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Réajuster Ressources
          </button>
          <button className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            📊 Rapport Sécurité
          </button>
        </div>
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">📢 Alertes Système</h3>
          <div className="space-y-2">
            {alerts.slice(-5).map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                alert.type === 'emergency' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex justify-between items-center">
                  <p className={`text-sm ${alert.type === 'emergency' ? 'text-red-800' : 'text-blue-800'}`}>
                    {alert.message}
                  </p>
                  <span className="text-xs text-gray-500">{alert.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProactiveSecurityAI;