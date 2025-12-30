/**
 * AlertesPrix Component
 * 
 * Intelligent price alerts with user-defined thresholds.
 * Features:
 * - Threshold configuration by user
 * - Abnormal increase detection (+X%)
 * - localStorage persistence
 * - Explainable logic
 * - No external dependencies
 */

import { useState, useEffect } from 'react';
import { Card } from './card.jsx';
import pricesHistory from '../data/prices-history.json';

const ALERT_THRESHOLD_KEY = 'akiprisaye_alert_thresholds';
const USER_ALERTS_KEY = 'akiprisaye_user_alerts';

export function AlertesPrix() {
  const [thresholds, setThresholds] = useState({
    percentage: 5, // Alert if price increases by more than 5%
    absolute: 0.50,  // Alert if price increases by more than 0.50€
  });
  const [alerts, setAlerts] = useState([]);
  const [watchedProducts, setWatchedProducts] = useState([]);

  // Load user preferences from localStorage
  useEffect(() => {
    const savedThresholds = localStorage.getItem(ALERT_THRESHOLD_KEY);
    if (savedThresholds) {
      setThresholds(JSON.parse(savedThresholds));
    }

    const savedWatched = localStorage.getItem(USER_ALERTS_KEY);
    if (savedWatched) {
      setWatchedProducts(JSON.parse(savedWatched));
    }
  }, []);

  // Calculate alerts based on price history
  useEffect(() => {
    const detectedAlerts = [];

    Object.entries(pricesHistory.products).forEach(([productId, product]) => {
      // Get Guadeloupe prices (default territory)
      const history = product.history
        .filter(h => h.territory === 'GP')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (history.length < 2) return;

      // Compare current price to previous
      const current = history[history.length - 1];
      const previous = history[history.length - 2];
      
      const absoluteChange = current.price - previous.price;
      const percentageChange = ((absoluteChange / previous.price) * 100);

      // Check if alert thresholds are exceeded
      const isAbnormalIncrease = 
        absoluteChange > 0 && (
          percentageChange > thresholds.percentage ||
          absoluteChange > thresholds.absolute
        );

      if (isAbnormalIncrease) {
        detectedAlerts.push({
          productId,
          productName: product.name,
          category: product.category,
          previousPrice: previous.price,
          currentPrice: current.price,
          absoluteChange,
          percentageChange: percentageChange.toFixed(1),
          date: current.date,
          severity: percentageChange > 10 ? 'high' : percentageChange > 5 ? 'medium' : 'low',
        });
      }
    });

    // Sort by severity and percentage change
    detectedAlerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.percentageChange - a.percentageChange;
    });

    setAlerts(detectedAlerts);
  }, [thresholds]);

  // Save thresholds to localStorage
  const updateThresholds = (key, value) => {
    const newThresholds = { ...thresholds, [key]: parseFloat(value) };
    setThresholds(newThresholds);
    localStorage.setItem(ALERT_THRESHOLD_KEY, JSON.stringify(newThresholds));
  };

  // Add product to watch list
  const addToWatchList = (productId) => {
    if (!watchedProducts.includes(productId)) {
      const updated = [...watchedProducts, productId];
      setWatchedProducts(updated);
      localStorage.setItem(USER_ALERTS_KEY, JSON.stringify(updated));
    }
  };

  // Remove product from watch list
  const removeFromWatchList = (productId) => {
    const updated = watchedProducts.filter(id => id !== productId);
    setWatchedProducts(updated);
    localStorage.setItem(USER_ALERTS_KEY, JSON.stringify(updated));
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
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟠';
      case 'low':
        return '🟡';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          🔔 Alertes Prix Intelligentes
        </h2>
        <p className="text-orange-50">
          Détection automatique des hausses anormales de prix
        </p>
      </div>

      {/* Configuration */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          ⚙️ Configuration des seuils d'alerte
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seuil de variation en pourcentage
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={thresholds.percentage}
                onChange={(e) => updateThresholds('percentage', e.target.value)}
                className="flex-1"
              />
              <span className="text-lg font-semibold text-gray-900 dark:text-white w-16 text-right">
                {thresholds.percentage}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Alerter si le prix augmente de plus de {thresholds.percentage}%
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seuil de variation en euros
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.10"
                max="2.00"
                step="0.10"
                value={thresholds.absolute}
                onChange={(e) => updateThresholds('absolute', e.target.value)}
                className="flex-1"
              />
              <span className="text-lg font-semibold text-gray-900 dark:text-white w-16 text-right">
                {thresholds.absolute.toFixed(2)}€
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Alerter si le prix augmente de plus de {thresholds.absolute.toFixed(2)}€
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ <strong>Logique explicable :</strong> Une alerte est déclenchée si l'augmentation du prix
            dépasse <strong>l'un ou l'autre</strong> des seuils configurés (pourcentage OU montant absolu).
          </p>
        </div>
      </Card>

      {/* Alerts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total alertes
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {alerts.length}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Alertes critiques
          </div>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {alerts.filter(a => a.severity === 'high').length}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Produits surveillés
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {watchedProducts.length}
          </div>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📋 Alertes détectées
        </h3>

        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            ✅ Aucune hausse anormale détectée avec les seuils actuels
          </div>
        )}

        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={`${alert.productId}-${index}`}
              className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                    <h4 className="font-semibold text-lg">
                      {alert.productName}
                    </h4>
                    <span className="px-2 py-1 text-xs rounded bg-white/50 dark:bg-black/20">
                      {alert.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-xs opacity-75 mb-1">Prix précédent</div>
                      <div className="font-semibold">{alert.previousPrice.toFixed(2)} €</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-75 mb-1">Prix actuel</div>
                      <div className="font-semibold">{alert.currentPrice.toFixed(2)} €</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-75 mb-1">Augmentation</div>
                      <div className="font-semibold">+{alert.absoluteChange.toFixed(2)} €</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-75 mb-1">Variation</div>
                      <div className="font-semibold">+{alert.percentageChange}%</div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs opacity-75">
                    Détecté le {new Date(alert.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (watchedProducts.includes(alert.productId)) {
                      removeFromWatchList(alert.productId);
                    } else {
                      addToWatchList(alert.productId);
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    watchedProducts.includes(alert.productId)
                      ? 'bg-gray-800 text-white hover:bg-gray-700'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {watchedProducts.includes(alert.productId) ? '⭐ Suivi' : '☆ Suivre'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Methodology */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          📝 Méthodologie de détection
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            <strong>Algorithme :</strong> Comparaison du prix actuel avec le prix du mois précédent
          </p>
          <p>
            <strong>Déclenchement :</strong> Alerte si (variation % {'>'}  {thresholds.percentage}%) OU (variation absolue {'>'} {thresholds.absolute.toFixed(2)}€)
          </p>
          <p>
            <strong>Sévérité :</strong>
            <span className="ml-2">🔴 Haute (+10%)</span>
            <span className="ml-2">🟠 Moyenne (+5-10%)</span>
            <span className="ml-2">🟡 Faible ({'<'}+5%)</span>
          </p>
          <p>
            <strong>Stockage :</strong> Préférences sauvegardées en local (localStorage)
          </p>
        </div>
      </div>
    </div>
  );
}

export default AlertesPrix;
