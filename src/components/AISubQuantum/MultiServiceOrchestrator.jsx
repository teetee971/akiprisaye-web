import React, { useState, useEffect } from 'react';

const MultiServiceOrchestrator = () => {
  const [services, setServices] = useState({
    energy: { status: 'optimal', load: 73, alerts: [] },
    connectivity: { status: 'good', coverage: 89, issues: [] },
    transport: { status: 'normal', efficiency: 82, disruptions: [] },
    security: { status: 'secure', level: 'vert', incidents: [] },
    health: { status: 'operational', capacity: 91, emergencies: [] }
  });

  const [orchestrationMode, setOrchestrationMode] = useState('auto');
  const [optimizations, setOptimizations] = useState([]);

  useEffect(() => {
    // Simulate real-time service monitoring
    const interval = setInterval(() => {
      setServices(prevServices => ({
        energy: {
          ...prevServices.energy,
          load: Math.max(50, Math.min(95, prevServices.energy.load + (Math.random() - 0.5) * 10))
        },
        connectivity: {
          ...prevServices.connectivity,
          coverage: Math.max(70, Math.min(100, prevServices.connectivity.coverage + (Math.random() - 0.5) * 5))
        },
        transport: {
          ...prevServices.transport,
          efficiency: Math.max(60, Math.min(100, prevServices.transport.efficiency + (Math.random() - 0.5) * 8))
        }
      }));
    }, 5000);

    // Generate AI optimizations
    setTimeout(() => {
      setOptimizations([
        {
          type: 'energy',
          priority: 'high',
          description: 'Optimisation de la charge électrique: Réduire la consommation publique de 15% entre 18h-20h',
          impact: 'Économie de 2.3 MWh, réduction des risques de coupure'
        },
        {
          type: 'transport',
          priority: 'medium',
          description: 'Réorientation du trafic: Rediriger 30% du flux vers la voie de contournement',
          impact: 'Réduction de 12 minutes du temps de trajet moyen'
        },
        {
          type: 'connectivity',
          priority: 'low',
          description: 'Optimisation réseau: Basculer 200 utilisateurs vers antenne secondaire',
          impact: 'Amélioration de 25% de la qualité de signal'
        }
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal': case 'good': case 'operational': case 'secure': return 'green';
      case 'normal': case 'warning': return 'yellow';
      case 'critical': case 'error': return 'red';
      default: return 'gray';
    }
  };

  const executeOptimization = (optimization) => {
    setOptimizations(prev => prev.filter(opt => opt !== optimization));
    // Simulate applying optimization
    alert(`✅ Optimisation appliquée: ${optimization.description}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎛️ Orchestrateur Multi-Services
        </h1>
        <p className="text-lg text-gray-600">
          Coordination centralisée et intelligente des services territoriaux
        </p>
      </div>

      {/* Orchestration Mode */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Mode d'Orchestration</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => setOrchestrationMode('auto')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              orchestrationMode === 'auto' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🤖 Automatique
          </button>
          <button
            onClick={() => setOrchestrationMode('manual')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              orchestrationMode === 'manual' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👤 Manuel
          </button>
          <button
            onClick={() => setOrchestrationMode('hybrid')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              orchestrationMode === 'hybrid' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ⚖️ Hybride
          </button>
        </div>
      </div>

      {/* Services Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Energy Service */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              ⚡ Énergie
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium text-${getStatusColor(services.energy.status)}-800 bg-${getStatusColor(services.energy.status)}-100`}>
              {services.energy.status}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm">
                <span>Charge réseau</span>
                <span>{Math.round(services.energy.load)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${services.energy.load > 85 ? 'bg-red-500' : services.energy.load > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${services.energy.load}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>• Production solaire: 34%</p>
              <p>• Consommation pic: 18h-20h</p>
              <p>• Réserves: 8h d'autonomie</p>
            </div>
          </div>
        </div>

        {/* Connectivity Service */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              📶 Connectivité
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium text-${getStatusColor(services.connectivity.status)}-800 bg-${getStatusColor(services.connectivity.status)}-100`}>
              {services.connectivity.status}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm">
                <span>Couverture territoire</span>
                <span>{Math.round(services.connectivity.coverage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${services.connectivity.coverage}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>• 4G/5G: 89% population</p>
              <p>• Fibre: 67% foyers</p>
              <p>• Zones blanches: 3 identifiées</p>
            </div>
          </div>
        </div>

        {/* Transport Service */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              🚌 Transport
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium text-${getStatusColor(services.transport.status)}-800 bg-${getStatusColor(services.transport.status)}-100`}>
              {services.transport.status}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm">
                <span>Efficacité réseau</span>
                <span>{Math.round(services.transport.efficiency)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-purple-500"
                  style={{ width: `${services.transport.efficiency}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>• Bus: 23 lignes actives</p>
              <p>• Retards moyens: 4 min</p>
              <p>• Taux de remplissage: 67%</p>
            </div>
          </div>
        </div>

        {/* Security Service */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              🛡️ Sécurité
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium text-${getStatusColor(services.security.status)}-800 bg-${getStatusColor(services.security.status)}-100`}>
              {services.security.level}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Patrouilles: 12 actives</p>
            <p>• Incidents signalés: 2</p>
            <p>• Temps de réponse: 8 min</p>
            <p>• Caméras: 89% fonctionnelles</p>
          </div>
        </div>

        {/* Health Service */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              🏥 Santé
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium text-${getStatusColor(services.health.status)}-800 bg-${getStatusColor(services.health.status)}-100`}>
              {services.health.status}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm">
                <span>Capacité hôpitaux</span>
                <span>{Math.round(services.health.capacity)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${services.health.capacity}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>• Urgences: 7 min d'attente</p>
              <p>• Lits disponibles: 23</p>
              <p>• Pharmacies ouvertes: 34</p>
            </div>
          </div>
        </div>

        {/* Coordination Overview */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            🎯 Coordination IA
          </h3>
          <div className="text-sm space-y-2">
            <p>• <strong>Synergies détectées:</strong> 5</p>
            <p>• <strong>Optimisations actives:</strong> {optimizations.length}</p>
            <p>• <strong>Économies générées:</strong> 12.3%</p>
            <p>• <strong>Efficacité globale:</strong> 87%</p>
          </div>
          <div className="mt-4">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              📊 Rapport détaillé
            </button>
          </div>
        </div>
      </div>

      {/* AI Optimizations */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">🧠 Optimisations IA Proposées</h3>
        <div className="space-y-4">
          {optimizations.map((opt, index) => (
            <div key={index} className={`border-l-4 border-${opt.priority === 'high' ? 'red' : opt.priority === 'medium' ? 'yellow' : 'green'}-500 pl-4 bg-gray-50 p-4 rounded-r-lg`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${{
                      'high': 'bg-red-100 text-red-800',
                      'medium': 'bg-yellow-100 text-yellow-800',
                      'low': 'bg-green-100 text-green-800'
                    }[opt.priority]}`}>
                      {opt.priority.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {opt.type.charAt(0).toUpperCase() + opt.type.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-800 mb-2">{opt.description}</p>
                  <p className="text-sm text-gray-600">
                    <strong>Impact prévu:</strong> {opt.impact}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => executeOptimization(opt)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    ✅ Appliquer
                  </button>
                  <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm">
                    ⏸️ Reporter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiServiceOrchestrator;