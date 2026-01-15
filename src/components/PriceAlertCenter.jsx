/**
 * Price Alert Center Component
 * 
 * Main interface for the Real Price Alert System
 * Features:
 * - Alert dashboard with filters
 * - Price timeline visualization
 * - Product tracking management
 * - Transparent data source display
 * - Legal compliance (neutral language, disclaimers)
 */

import { useState, useEffect } from 'react';
import priceAlertService from '../services/priceAlertService';

const TERRITORY_NAMES = {
  'GP': 'Guadeloupe',
  'MQ': 'Martinique',
  'GF': 'Guyane',
  'RE': 'La Réunion',
  'YT': 'Mayotte',
  'PM': 'Saint-Pierre-et-Miquelon',
  'BL': 'Saint-Barthélemy',
  'MF': 'Saint-Martin',
  'WF': 'Wallis-et-Futuna',
  'PF': 'Polynésie française',
  'NC': 'Nouvelle-Calédonie',
  'TF': 'Terres australes et antarctiques françaises',
};

const SOURCE_LABELS = {
  'official_site': 'Site officiel',
  'public_listing': 'Liste publique',
  'user_report': 'Signalement citoyen',
  'observateur': 'Observatoire des prix',
};

const CONFIDENCE_LABELS = {
  'high': 'Élevée',
  'medium': 'Moyenne',
  'low': 'Faible',
};

export function PriceAlertCenter({ userId = 'demo-user' }) {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    alertType: null,
    severity: null,
    territory: null,
    acknowledged: false,
  });
  const [showSettings, setShowSettings] = useState(false);

  // Load alerts
  useEffect(() => {
    loadAlerts();
  }, [userId, filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const fetchedAlerts = await priceAlertService.getUserAlerts(userId, filter);
      const alertSummary = await priceAlertService.getAlertSummary(userId);
      setAlerts(fetchedAlerts);
      setSummary(alertSummary);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await priceAlertService.acknowledgeAlert(alertId);
      loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'price_drop':
        return <TrendingDown className="w-5 h-5 text-green-600" />;
      case 'price_increase':
        return <TrendingUp className="w-5 h-5 text-orange-600" />;
      case 'shrinkflation':
        return <Package className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'price_drop':
        return 'Baisse de prix observée';
      case 'price_increase':
        return 'Hausse de prix observée';
      case 'shrinkflation':
        return 'Réduction de quantité observée';
      default:
        return 'Alerte';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'low':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const getConfidenceBadge = (confidence) => {
    const colors = {
      'high': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      'medium': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      'low': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[confidence] || colors.low}`}>
        Confiance: {CONFIDENCE_LABELS[confidence] || confidence}
      </span>
    );
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Bell className="w-8 h-8" />
              Centre d'Alertes Prix
            </h1>
            <p className="text-blue-100">
              Système de surveillance des prix citoyens
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Paramètres"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">Information importante</p>
            <p>
              Les alertes sont basées sur des données publiques disponibles et des informations 
              signalées par les citoyens. Toutes les alertes affichent la source des données 
              et la date d'observation. Ces informations sont fournies à titre indicatif.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total alertes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {summary.total}
                </p>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Non confirmées
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {summary.unacknowledged}
                </p>
              </div>
              <Eye className="w-8 h-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Critiques
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {summary.bySeverity.high}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Shrinkflation
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {summary.byType.shrinkflation}
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filtres
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type d'alerte
            </label>
            <select
              value={filter.alertType || ''}
              onChange={(e) => setFilter({ ...filter, alertType: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Tous</option>
              <option value="price_drop">Baisse de prix</option>
              <option value="price_increase">Hausse de prix</option>
              <option value="shrinkflation">Shrinkflation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sévérité
            </label>
            <select
              value={filter.severity || ''}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Toutes</option>
              <option value="high">Critique</option>
              <option value="medium">Moyenne</option>
              <option value="low">Faible</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Territoire
            </label>
            <select
              value={filter.territory || ''}
              onChange={(e) => setFilter({ ...filter, territory: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Tous</option>
              {Object.entries(TERRITORY_NAMES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilter({ alertType: null, severity: null, territory: null, acknowledged: false })}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Alertes ({alerts.length})
        </h3>

        {alerts.length === 0 && (
          <Card className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Aucune alerte avec les filtres sélectionnés
            </p>
          </Card>
        )}

        {alerts.map((alert) => (
          <Card key={alert.id} className={`p-6 border-l-4 ${getSeverityColor(alert.severity)}`}>
            <div className="space-y-4">
              {/* Alert Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                    {getAlertIcon(alert.alertType)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {alert.productName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getAlertTypeLabel(alert.alertType)}
                    </p>
                    {alert.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {alert.category}
                      </span>
                    )}
                  </div>
                </div>

                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Marquer comme vu
                  </button>
                )}
              </div>

              {/* Price Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Prix précédent</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {alert.previousPrice.toFixed(2)} €
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Prix actuel</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {alert.currentPrice.toFixed(2)} €
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Variation</p>
                  <p className={`text-lg font-semibold ${alert.absoluteChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {alert.absoluteChange > 0 ? '+' : ''}{alert.absoluteChange.toFixed(2)} €
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pourcentage</p>
                  <p className={`text-lg font-semibold ${alert.percentageChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {alert.percentageChange > 0 ? '+' : ''}{alert.percentageChange.toFixed(1)} %
                  </p>
                </div>
              </div>

              {/* Shrinkflation Details */}
              {alert.alertType === 'shrinkflation' && alert.shrinkflationDetails && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                    📦 Détails de la réduction de quantité
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-purple-700 dark:text-purple-300">Quantité avant</p>
                      <p className="font-semibold text-purple-900 dark:text-purple-100">
                        {alert.shrinkflationDetails.previousQuantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-700 dark:text-purple-300">Quantité après</p>
                      <p className="font-semibold text-purple-900 dark:text-purple-100">
                        {alert.shrinkflationDetails.currentQuantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-700 dark:text-purple-300">Réduction</p>
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        -{alert.shrinkflationDetails.quantityReductionPercentage.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-700 dark:text-purple-300">Hausse réelle/unité</p>
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        +{alert.shrinkflationDetails.effectivePriceIncrease.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Transparency */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transparence des données
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <div className="space-y-1">
                    <p>
                      <span className="font-medium">Source précédente:</span>{' '}
                      {SOURCE_LABELS[alert.previousDataSource] || alert.previousDataSource}
                    </p>
                    <p>
                      <span className="font-medium">Date observation:</span>{' '}
                      {new Date(alert.previousObservationDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p>
                      <span className="font-medium">Source actuelle:</span>{' '}
                      {SOURCE_LABELS[alert.currentDataSource] || alert.currentDataSource}
                    </p>
                    <p>
                      <span className="font-medium">Date observation:</span>{' '}
                      {new Date(alert.currentObservationDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {getConfidenceBadge(alert.confidence)}
                  {alert.store && (
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                      {alert.store}
                    </span>
                  )}
                  {alert.territory && (
                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      {TERRITORY_NAMES[alert.territory] || alert.territory}
                    </span>
                  )}
                </div>

                {alert.confidence === 'low' && (
                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                    ⚠️ Attention: Confiance faible - Données issues de signalements citoyens non vérifiés
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default PriceAlertCenter;
