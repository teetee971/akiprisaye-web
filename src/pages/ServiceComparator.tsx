import React, { useState, useEffect } from 'react';
import { Shield, Plane, Ship, Wifi, Smartphone, Droplet, Zap, TrendingUp } from 'lucide-react';
import type { TerritoryCode, ServiceCategory } from '../types/service';
import {
  searchFlights,
  searchBoats,
  searchInternet,
  searchMobile,
  searchWater,
  searchElectricity,
  getServiceStatistics,
} from '../services/serviceComparisonService';

type ServiceType =
  | 'flights'
  | 'boats'
  | 'internet'
  | 'mobile'
  | 'water'
  | 'electricity';

const ServiceComparator: React.FC = () => {
  const [territory, setTerritory] = useState<TerritoryCode>('GP');
  const [serviceType, setServiceType] = useState<ServiceType>('flights');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Search parameters
  const [flightFrom, setFlightFrom] = useState('');
  const [flightTo, setFlightTo] = useState('Paris');
  const [boatFrom, setBoatFrom] = useState('');
  const [boatTo, setBoatTo] = useState('');
  const [internetMinSpeed, setInternetMinSpeed] = useState<number>(100);
  const [mobileMinData, setMobileMinData] = useState<number>(20);
  const [waterCommune, setWaterCommune] = useState('');
  const [electricityPower, setElectricityPower] = useState<number>(6);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    performSearch();
  }, [territory, serviceType]);

  const loadStats = async () => {
    try {
      const statistics = await getServiceStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      let data: any[] = [];

      switch (serviceType) {
        case 'flights':
          data = await searchFlights({ from: flightFrom, to: flightTo });
          break;
        case 'boats':
          data = await searchBoats({ from: boatFrom, to: boatTo });
          break;
        case 'internet':
          data = await searchInternet({ territory, minSpeed: internetMinSpeed });
          break;
        case 'mobile':
          data = await searchMobile({ territory, minData: mobileMinData });
          break;
        case 'water':
          data = await searchWater({ territory, commune: waterCommune });
          break;
        case 'electricity':
          data = await searchElectricity({ territory, power: electricityPower });
          break;
      }

      setResults(data);
    } catch (error) {
      console.error('Error searching services:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const serviceCategories = [
    { id: 'flights', name: 'Vols (Avions)', icon: Plane, color: 'blue' },
    { id: 'boats', name: 'Bateaux (Ferry)', icon: Ship, color: 'cyan' },
    { id: 'internet', name: 'Internet', icon: Wifi, color: 'purple' },
    { id: 'mobile', name: 'Mobile', icon: Smartphone, color: 'green' },
    { id: 'water', name: 'Eau', icon: Droplet, color: 'blue' },
    { id: 'electricity', name: 'Électricité', icon: Zap, color: 'yellow' },
  ];

  const territories = [
    { code: 'GP', name: 'Guadeloupe' },
    { code: 'MQ', name: 'Martinique' },
    { code: 'GF', name: 'Guyane' },
    { code: 'RE', name: 'La Réunion' },
  ];

  const getReliabilityColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const renderFlightResult = (flight: any) => (
    <div key={flight.id} className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {flight.route.from} → {flight.route.to}
          </h3>
          <p className="text-sm text-gray-600">
            {flight.route.fromCode} → {flight.route.toCode}
          </p>
          <p className="text-sm text-gray-500 mt-1">Durée: {flight.duration}</p>
          <p className="text-sm text-gray-500">Fréquence: {flight.frequency}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{flight.price.average}€</p>
          <p className="text-xs text-gray-500">Prix moyen</p>
          <p className="text-sm text-gray-600 mt-1">
            {flight.price.min}€ - {flight.price.max}€
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReliabilityColor(flight.reliability.level)}`}>
          Fiabilité: {flight.reliability.score}% ({flight.reliability.confirmations} confirmations)
        </span>
      </div>
    </div>
  );

  const renderBoatResult = (boat: any) => (
    <div key={boat.id} className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {boat.route.from} → {boat.route.to}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Durée: {boat.duration}</p>
          <p className="text-sm text-gray-500">Fréquence: {boat.frequency}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-cyan-600">{boat.price.average}€</p>
          <p className="text-xs text-gray-500">Prix moyen</p>
          <p className="text-sm text-gray-600 mt-1">
            {boat.price.min}€ - {boat.price.max}€
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReliabilityColor(boat.reliability.level)}`}>
          Fiabilité: {boat.reliability.score}% ({boat.reliability.confirmations} confirmations)
        </span>
      </div>
    </div>
  );

  const renderInternetResult = (internet: any) => (
    <div key={internet.id} className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{internet.name}</h3>
          <p className="text-sm text-gray-600 mt-1">
            ⬇️ {internet.speed.download} Mbps / ⬆️ {internet.speed.upload} Mbps
          </p>
          <div className="mt-2">
            {internet.features.map((feature: string, idx: number) => (
              <span key={idx} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-2 mb-1">
                {feature}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Engagement: {internet.commitment}</p>
        </div>
        <div className="text-right ml-4">
          <p className="text-2xl font-bold text-purple-600">{internet.price.monthly}€/mois</p>
          {internet.price.installation && (
            <p className="text-sm text-gray-600 mt-1">+ {internet.price.installation}€ installation</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReliabilityColor(internet.reliability.level)}`}>
          Fiabilité: {internet.reliability.score}%
        </span>
      </div>
    </div>
  );

  const renderMobileResult = (mobile: any) => (
    <div key={mobile.id} className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{mobile.name}</h3>
          <p className="text-sm text-gray-600 mt-1">📱 {mobile.data} Go de data</p>
          <div className="mt-2">
            {mobile.features.map((feature: string, idx: number) => (
              <span key={idx} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-2 mb-1">
                {feature}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Engagement: {mobile.commitment}</p>
        </div>
        <div className="text-right ml-4">
          <p className="text-2xl font-bold text-green-600">{mobile.price.monthly}€/mois</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReliabilityColor(mobile.reliability.level)}`}>
          Fiabilité: {mobile.reliability.score}%
        </span>
      </div>
    </div>
  );

  const renderWaterResult = (water: any) => (
    <div key={water.id} className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{water.commune}</h3>
          <p className="text-sm text-gray-600 mt-1">Abonnement: {water.price.fixedMonthly}€/mois</p>
          <p className="text-sm text-gray-600">Prix au m³: {water.price.perCubicMeter}€</p>
        </div>
        <div className="text-right ml-4">
          <p className="text-2xl font-bold text-blue-600">{water.averageMonthlyBill.average}€/mois</p>
          <p className="text-xs text-gray-500">Facture moyenne</p>
          <p className="text-sm text-gray-600 mt-1">
            {water.averageMonthlyBill.min}€ - {water.averageMonthlyBill.max}€
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReliabilityColor(water.reliability.level)}`}>
          Fiabilité: {water.reliability.score}%
        </span>
      </div>
    </div>
  );

  const getOfferTypeLabel = (offerType: string) => {
    if (offerType === 'base') return 'Base';
    if (offerType === 'heures_creuses') return 'Heures Creuses';
    return 'Tempo';
  };

  const renderElectricityResult = (elec: any) => (
    <div key={elec.id} className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">
            Tarif {getOfferTypeLabel(elec.offerType)} - {elec.power} kVA
          </h3>
          <p className="text-sm text-gray-600 mt-1">Abonnement: {elec.price.subscription}€/mois</p>
          <p className="text-sm text-gray-600">Prix kWh: {elec.price.perKwh}€</p>
          {elec.price.perKwhOffPeak && (
            <p className="text-sm text-gray-600">kWh heures creuses: {elec.price.perKwhOffPeak}€</p>
          )}
        </div>
        <div className="text-right ml-4">
          <p className="text-2xl font-bold text-yellow-600">{elec.averageMonthlyBill.average}€/mois</p>
          <p className="text-xs text-gray-500">Facture moyenne</p>
          <p className="text-sm text-gray-600 mt-1">
            {elec.averageMonthlyBill.min}€ - {elec.averageMonthlyBill.max}€
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReliabilityColor(elec.reliability.level)}`}>
          Fiabilité: {elec.reliability.score}%
        </span>
      </div>
    </div>
  );

  const renderResults = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Recherche en cours...</p>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Aucun résultat trouvé</p>
          <p className="text-sm text-gray-500 mt-2">Essayez de modifier vos critères de recherche</p>
        </div>
      );
    }

    switch (serviceType) {
      case 'flights':
        return results.map(renderFlightResult);
      case 'boats':
        return results.map(renderBoatResult);
      case 'internet':
        return results.map(renderInternetResult);
      case 'mobile':
        return results.map(renderMobileResult);
      case 'water':
        return results.map(renderWaterResult);
      case 'electricity':
        return results.map(renderElectricityResult);
      default:
        return null;
    }
  };

  const getButtonClasses = (catId: string, isActive: boolean) => {
    if (!isActive) {
      return 'border-gray-200 hover:border-gray-300 text-gray-600';
    }
    
    // Predefined color classes to ensure Tailwind includes them
    const colorClasses: Record<string, string> = {
      flights: 'border-blue-500 bg-blue-50 text-blue-700',
      boats: 'border-cyan-500 bg-cyan-50 text-cyan-700',
      internet: 'border-purple-500 bg-purple-50 text-purple-700',
      mobile: 'border-green-500 bg-green-50 text-green-700',
      water: 'border-blue-500 bg-blue-50 text-blue-700',
      electricity: 'border-yellow-500 bg-yellow-50 text-yellow-700',
    };
    
    return colorClasses[catId] || 'border-gray-500 bg-gray-50 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Comparateur de Services
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comparez les prix des vols, bateaux, abonnements internet, mobile, eau et électricité
            à travers les territoires d'outre-mer
          </p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.totalFlights + stats.totalBoats}</p>
              <p className="text-sm text-gray-600">Routes transport</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.totalInternetOffers + stats.totalMobileOffers}</p>
              <p className="text-sm text-gray-600">Offres télécoms</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.totalWaterServices + stats.totalElectricityServices}</p>
              <p className="text-sm text-gray-600">Services publics</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.territories.length}</p>
              <p className="text-sm text-gray-600">Territoires couverts</p>
            </div>
          </div>
        )}

        {/* Service Type Selector */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Type de service</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {serviceCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = serviceType === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setServiceType(cat.id as ServiceType)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${getButtonClasses(cat.id, isActive)}`}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium text-center">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Territory Selector (for relevant services) */}
        {['internet', 'mobile', 'water', 'electricity'].includes(serviceType) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Territoire</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {territories.map((terr) => (
                <button
                  key={terr.code}
                  onClick={() => setTerritory(terr.code as TerritoryCode)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    territory === terr.code
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {terr.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Filtres de recherche</h2>
          
          {serviceType === 'flights' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Départ</label>
                <input
                  type="text"
                  value={flightFrom}
                  onChange={(e) => setFlightFrom(e.target.value)}
                  placeholder="Ville ou code aéroport"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                <input
                  type="text"
                  value={flightTo}
                  onChange={(e) => setFlightTo(e.target.value)}
                  placeholder="Ville ou code aéroport"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {serviceType === 'boats' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Départ</label>
                <input
                  type="text"
                  value={boatFrom}
                  onChange={(e) => setBoatFrom(e.target.value)}
                  placeholder="Port de départ"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                <input
                  type="text"
                  value={boatTo}
                  onChange={(e) => setBoatTo(e.target.value)}
                  placeholder="Port d'arrivée"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          {serviceType === 'internet' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vitesse minimale: {internetMinSpeed} Mbps
              </label>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={internetMinSpeed}
                onChange={(e) => setInternetMinSpeed(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {serviceType === 'mobile' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data minimale: {mobileMinData} Go
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={mobileMinData}
                onChange={(e) => setMobileMinData(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {serviceType === 'water' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commune</label>
              <input
                type="text"
                value={waterCommune}
                onChange={(e) => setWaterCommune(e.target.value)}
                placeholder="Nom de la commune"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {serviceType === 'electricity' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Puissance</label>
              <select
                value={electricityPower}
                onChange={(e) => setElectricityPower(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
              >
                <option value={3}>3 kVA</option>
                <option value={6}>6 kVA</option>
                <option value={9}>9 kVA</option>
                <option value={12}>12 kVA</option>
              </select>
            </div>
          )}

          <button
            onClick={performSearch}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            🔍 Rechercher
          </button>
        </div>

        {/* Results */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Résultats ({results.length})
            </h2>
          </div>
          {renderResults()}
        </div>

        {/* Footer Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-blue-600 mr-3 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Outil d'information citoyenne</h3>
              <p className="text-sm text-blue-800">
                Les prix et informations affichés sont indicatifs et peuvent varier. 
                Vérifiez toujours directement auprès des fournisseurs avant de souscrire. 
                Données mises à jour régulièrement depuis sources officielles et contributions citoyennes.
              </p>
              {stats && (
                <p className="text-xs text-blue-600 mt-2">
                  Dernière mise à jour : {new Date(stats.lastUpdated).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceComparator;
