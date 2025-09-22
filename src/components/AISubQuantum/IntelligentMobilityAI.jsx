import React, { useState, useEffect } from 'react';

const IntelligentMobilityAI = () => {
  const [currentLocation, setCurrentLocation] = useState('Pointe-à-Pitre Centre');
  const [destination, setDestination] = useState('');
  const [mobilityOptions, setMobilityOptions] = useState([]);
  const [realTimeData, setRealTimeData] = useState({
    traffic: 'moderate',
    weather: 'sunny',
    publicTransport: 'normal',
    bikePath: 'available',
    carpooling: 'high'
  });
  const [userPreferences, setUserPreferences] = useState({
    preferredMode: 'eco',
    budget: 'medium',
    timeConstraint: 'flexible',
    accessibility: false
  });

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        traffic: ['light', 'moderate', 'heavy'][Math.floor(Math.random() * 3)],
        publicTransport: ['excellent', 'normal', 'delayed'][Math.floor(Math.random() * 3)],
        carpooling: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const generateMobilityOptions = () => {
    if (!destination) return;

    const options = [
      {
        id: 1,
        mode: 'bus',
        icon: '🚌',
        name: 'Transport Public',
        duration: '25 min',
        cost: '1.50 €',
        ecoScore: 9,
        comfort: 7,
        reliability: realTimeData.publicTransport === 'excellent' ? 9 : realTimeData.publicTransport === 'normal' ? 7 : 4,
        details: ['Ligne 3 → Jarry', 'Fréquence: 15 min', 'Accessible PMR'],
        carbonFootprint: '0.2 kg CO²',
        realTimeInfo: realTimeData.publicTransport === 'delayed' ? 'Retard prévu: 8 min' : 'À l\'heure'
      },
      {
        id: 2,
        mode: 'bike',
        icon: '🚴',
        name: 'Vélo Partagé',
        duration: '18 min',
        cost: '2.00 €',
        ecoScore: 10,
        comfort: 6,
        reliability: 8,
        details: ['Station vélo 200m', 'Piste cyclable 80%', 'Vélos électriques'],
        carbonFootprint: '0.0 kg CO²',
        realTimeInfo: '12 vélos disponibles'
      },
      {
        id: 3,
        mode: 'carpool',
        icon: '🚗',
        name: 'Covoiturage',
        duration: '15 min',
        cost: '3.50 €',
        ecoScore: 7,
        comfort: 8,
        reliability: realTimeData.carpooling === 'high' ? 8 : realTimeData.carpooling === 'medium' ? 6 : 4,
        details: ['Marie, 4.8⭐', 'Départ: 14h30', 'Climatisation'],
        carbonFootprint: '1.2 kg CO²',
        realTimeInfo: realTimeData.carpooling === 'high' ? '3 conducteurs disponibles' : 'Demande élevée'
      },
      {
        id: 4,
        mode: 'walk_transit',
        icon: '🚶‍♂️',
        name: 'Marche + Navette',
        duration: '22 min',
        cost: '0.00 €',
        ecoScore: 10,
        comfort: 5,
        reliability: 9,
        details: ['10 min à pied', 'Navette gratuite', 'Air conditionné'],
        carbonFootprint: '0.0 kg CO²',
        realTimeInfo: 'Navette toutes les 10 min'
      },
      {
        id: 5,
        mode: 'taxi',
        icon: '🚕',
        name: 'Taxi Électrique',
        duration: '12 min',
        cost: '8.50 €',
        ecoScore: 6,
        comfort: 9,
        reliability: 9,
        details: ['Véhicule électrique', 'Réservation immédiate', 'WiFi gratuit'],
        carbonFootprint: '0.8 kg CO²',
        realTimeInfo: 'Arrivée: 3 min'
      }
    ];

    // AI-powered ranking based on context and preferences
    const rankedOptions = options.sort((a, b) => {
      let scoreA = 0, scoreB = 0;

      // Weight by user preferences
      if (userPreferences.preferredMode === 'eco') {
        scoreA += a.ecoScore * 2;
        scoreB += b.ecoScore * 2;
      }
      if (userPreferences.budget === 'low') {
        scoreA += (10 - parseFloat(a.cost)) * 1.5;
        scoreB += (10 - parseFloat(b.cost)) * 1.5;
      }
      if (userPreferences.timeConstraint === 'urgent') {
        scoreA += (30 - parseInt(a.duration)) * 2;
        scoreB += (30 - parseInt(b.duration)) * 2;
      }

      // Weight by real-time conditions
      if (realTimeData.traffic === 'heavy') {
        if (a.mode === 'bus' || a.mode === 'bike') scoreA += 5;
        if (b.mode === 'bus' || b.mode === 'bike') scoreB += 5;
      }

      return scoreB - scoreA;
    });

    setMobilityOptions(rankedOptions);
  };

  const selectOption = (option) => {
    alert(`🎯 Option sélectionnée: ${option.name}\n💰 Coût: ${option.cost}\n⏱️ Durée: ${option.duration}\n🌱 Empreinte: ${option.carbonFootprint}`);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'green';
    if (score >= 6) return 'yellow';
    return 'red';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🚀 Gestion Intelligente de la Mobilité
        </h1>
        <p className="text-lg text-gray-600">
          Suggestions dynamiques pour la mobilité douce, partagée et alternative
        </p>
      </div>

      {/* Real-time Context */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">📊 Contexte Temps Réel</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-1">🚗</div>
            <p className="text-sm font-medium">Trafic</p>
            <p className={`text-xs px-2 py-1 rounded-full ${
              realTimeData.traffic === 'light' ? 'bg-green-100 text-green-800' :
              realTimeData.traffic === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {realTimeData.traffic}
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">☀️</div>
            <p className="text-sm font-medium">Météo</p>
            <p className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {realTimeData.weather}
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🚌</div>
            <p className="text-sm font-medium">Transport</p>
            <p className={`text-xs px-2 py-1 rounded-full ${
              realTimeData.publicTransport === 'excellent' ? 'bg-green-100 text-green-800' :
              realTimeData.publicTransport === 'normal' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {realTimeData.publicTransport}
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🚴</div>
            <p className="text-sm font-medium">Pistes</p>
            <p className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
              {realTimeData.bikePath}
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🤝</div>
            <p className="text-sm font-medium">Covoiturage</p>
            <p className={`text-xs px-2 py-1 rounded-full ${
              realTimeData.carpooling === 'high' ? 'bg-green-100 text-green-800' :
              realTimeData.carpooling === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {realTimeData.carpooling}
            </p>
          </div>
        </div>
      </div>

      {/* Trip Planner */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">🎯 Planificateur de Trajet IA</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Départ</label>
                <input
                  type="text"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Où voulez-vous aller ?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={generateMobilityOptions}
                disabled={!destination}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                🔍 Chercher les meilleures options
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Vos Préférences</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Mode préféré</label>
                <select
                  value={userPreferences.preferredMode}
                  onChange={(e) => setUserPreferences({...userPreferences, preferredMode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="eco">🌱 Écologique</option>
                  <option value="fast">⚡ Rapide</option>
                  <option value="comfort">😌 Confortable</option>
                  <option value="cheap">💰 Économique</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Budget</label>
                <select
                  value={userPreferences.budget}
                  onChange={(e) => setUserPreferences({...userPreferences, budget: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="low">💸 Faible (0-3€)</option>
                  <option value="medium">💰 Moyen (3-8€)</option>
                  <option value="high">💎 Élevé (8€+)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Contrainte temporelle</label>
                <select
                  value={userPreferences.timeConstraint}
                  onChange={(e) => setUserPreferences({...userPreferences, timeConstraint: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="flexible">🕐 Flexible</option>
                  <option value="urgent">⏰ Urgent</option>
                  <option value="scheduled">📅 Planifié</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobility Options */}
      {mobilityOptions.length > 0 && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">🚀 Options de Mobilité Intelligente</h3>
          <div className="space-y-4">
            {mobilityOptions.map((option, index) => (
              <div key={option.id} className={`border rounded-lg p-4 ${index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                {index === 0 && (
                  <div className="mb-2">
                    <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                      🏆 Recommandé IA
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">{option.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{option.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{option.realTimeInfo}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="font-medium">⏱️ {option.duration}</span>
                        <span className="font-medium">💰 {option.cost}</span>
                        <span className="font-medium">🌱 {option.carbonFootprint}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Éco</p>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-${getScoreColor(option.ecoScore)}-500`}>
                        {option.ecoScore}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Confort</p>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-${getScoreColor(option.comfort)}-500`}>
                        {option.comfort}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Fiabilité</p>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-${getScoreColor(option.reliability)}-500`}>
                        {option.reliability}
                      </div>
                    </div>
                    <button
                      onClick={() => selectOption(option)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Choisir
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {option.details.map((detail, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobility Insights */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">💡 Insights Mobilité IA</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">🌱 Impact Environnemental</h4>
            <ul className="text-sm space-y-1">
              <li>• Transport public: -85% CO²</li>
              <li>• Vélo partagé: -100% CO²</li>
              <li>• Covoiturage: -60% CO²</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">📈 Tendances Mobilité</h4>
            <ul className="text-sm space-y-1">
              <li>• Vélo +35% cette semaine</li>
              <li>• Covoiturage +20% le matin</li>
              <li>• Transport public stable</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">🎯 Recommandations</h4>
            <ul className="text-sm space-y-1">
              <li>• Privilégier 8h-9h pour vélo</li>
              <li>• Éviter voiture 17h-19h</li>
              <li>• Nouvelles lignes bus dispo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligentMobilityAI;