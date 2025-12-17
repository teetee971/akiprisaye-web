import { useState } from 'react';
import TerritorySelector from '../components/TerritorySelector';

export default function Alertes() {
  const [selectedTerritory, setSelectedTerritory] = useState('GP');

  // Placeholder: En attente de données réelles d'alertes
  const alertsPlaceholder = [
    {
      id: 1,
      type: 'prix_eleve',
      territory: 'GP',
      product: 'Lait UHT',
      message: 'Prix anormalement élevé détecté',
      date: '2025-01-15',
      status: 'active',
      severity: 'medium',
    },
    {
      id: 2,
      type: 'penurie',
      territory: 'MQ',
      product: 'Huile de tournesol',
      message: 'Rupture de stock signalée dans plusieurs enseignes',
      date: '2025-01-14',
      status: 'active',
      severity: 'high',
    },
    {
      id: 3,
      type: 'variation',
      territory: 'RE',
      product: 'Poulet',
      message: 'Hausse brutale de +15% en 1 semaine',
      date: '2025-01-13',
      status: 'active',
      severity: 'high',
    },
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-500/10';
      case 'medium': return 'border-orange-500 bg-orange-500/10';
      case 'low': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getSeverityIcon = (type) => {
    switch (type) {
      case 'prix_eleve': return '⚠️';
      case 'penurie': return '📦';
      case 'variation': return '📈';
      default: return '🔔';
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0f62fe] to-[#0353e9] p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">🔔 Alertes Consommateurs</h1>
            <a 
              href="/" 
              className="text-white hover:text-gray-200 transition-colors"
            >
              ← Accueil
            </a>
          </div>
          <p className="text-gray-100">
            Alertes sur les prix anormaux, pénuries et variations brutales
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        
        {/* Notice - Données en développement */}
        <div className="mb-8 bg-yellow-900/20 border border-yellow-700 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-xl font-semibold mb-2 text-yellow-400">Module en développement</h2>
              <p className="text-gray-300 mb-2">
                Le système d'alertes automatiques est actuellement en cours de développement.
                Les alertes affichées ci-dessous sont des exemples pour illustrer le futur fonctionnement.
              </p>
              <p className="text-gray-400 text-sm">
                <strong>À venir :</strong> Alertes basées sur des données réelles collectées quotidiennement,
                système de notification, abonnement par territoire et catégorie de produits.
              </p>
            </div>
          </div>
        </div>

        {/* Territory Filter */}
        <div className="mb-8">
          <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4">🌍 Filtrer par territoire</h2>
            <div className="max-w-md">
              <TerritorySelector 
                value={selectedTerritory}
                onChange={setSelectedTerritory}
              />
            </div>
          </div>
        </div>

        {/* Alerts Types Legend */}
        <div className="mb-8 bg-[#1e1e1e] rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Types d'alertes</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-orange-400">Prix anormalement élevés</h3>
                <p className="text-sm text-gray-400">Prix supérieur de +20% à la moyenne régionale</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <h3 className="font-semibold text-red-400">Pénuries</h3>
                <p className="text-sm text-gray-400">Ruptures de stock signalées dans plusieurs magasins</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <h3 className="font-semibold text-yellow-400">Variations brutales</h3>
                <p className="text-sm text-gray-400">Hausse ou baisse supérieure à ±10% en moins d'une semaine</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">📢 Alertes actives</h2>
          
          {alertsPlaceholder
            .filter(alert => selectedTerritory === 'ALL' || alert.territory === selectedTerritory)
            .map(alert => (
              <div 
                key={alert.id}
                className={`border-l-4 rounded-r-xl p-6 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{getSeverityIcon(alert.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{alert.product}</h3>
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                          {alert.territory}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-2">{alert.message}</p>
                      <p className="text-sm text-gray-400">
                        Signalé le {new Date(alert.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded text-xs font-semibold ${
                    alert.severity === 'high' ? 'bg-red-600' :
                      alert.severity === 'medium' ? 'bg-orange-600' :
                        'bg-yellow-600'
                  }`}>
                    {alert.severity === 'high' ? 'Urgent' :
                      alert.severity === 'medium' ? 'Important' :
                        'À surveiller'}
                  </span>
                </div>
              </div>
            ))}

          {alertsPlaceholder.filter(alert => selectedTerritory === 'ALL' || alert.territory === selectedTerritory).length === 0 && (
            <div className="bg-[#1e1e1e] rounded-xl border border-gray-700 p-8 text-center">
              <p className="text-gray-400">Aucune alerte active pour ce territoire</p>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mt-12 bg-[#1e1e1e] rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4">❓ Comment fonctionnent les alertes ?</h2>
          <div className="text-gray-300 space-y-3">
            <p>
              Le système d'alertes A KI PRI SA YÉ analysera quotidiennement les prix collectés
              pour détecter automatiquement :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Les prix anormalement élevés par rapport à la moyenne du territoire</li>
              <li>Les ruptures de stock récurrentes sur des produits de première nécessité</li>
              <li>Les variations de prix brutales (hausses ou baisses importantes)</li>
            </ul>
            <p className="text-sm text-gray-400 mt-4">
              <strong>Source des données :</strong> Prix collectés quotidiennement dans les enseignes participantes,
              données publiques INSEE, signalements citoyens vérifiés.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
