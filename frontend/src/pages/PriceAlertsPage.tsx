/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Price Alerts Page
 * Manage price alerts for products
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertForm } from '../components/AlertForm';
import { UpgradeGate } from '../components/billing/UpgradeGate';
import { Bell, CheckCircle, Info, Trash2, TrendingDown, TrendingUp, Package } from 'lucide-react';
import {
  type SavedAlert,
  loadAlerts,
  persistAlerts,
} from '../services/priceAlertsStorage';

export default function PriceAlertsPage() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [alerts, setAlerts] = useState<SavedAlert[]>([]);

  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  const handleSave = (alertData: any) => {
    const newAlert: SavedAlert = {
      id: `alert-${Date.now()}`,
      productName: alertData.productName,
      productEAN: alertData.productEAN || '',
      alertType: alertData.alertType,
      thresholdMode: alertData.thresholdMode || 'percentage',
      threshold: alertData.threshold,
      absolutePrice: alertData.absolutePrice || '',
      territory: alertData.territory,
      createdAt: new Date().toISOString(),
    };
    setAlerts(prev => {
      const updated = [newAlert, ...prev];
      persistAlerts(updated);
      return updated;
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  const handleCancel = () => {
    console.log('Alert creation cancelled');
  };

  const handleRemoveAlert = (id: string) => {
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== id);
      persistAlerts(updated);
      return updated;
    });
  };

  const alertTypeIcon = (type: string) => {
    if (type === 'price_drop') return <TrendingDown className="w-4 h-4 text-green-500" />;
    if (type === 'price_increase') return <TrendingUp className="w-4 h-4 text-red-500" />;
    return <Package className="w-4 h-4 text-orange-500" />;
  };

  const alertTypeLabel = (type: string) => {
    if (type === 'price_drop') return 'Baisse de prix';
    if (type === 'price_increase') return 'Hausse de prix';
    return 'Shrinkflation';
  };

  const thresholdLabel = (alert: SavedAlert) => {
    if (alert.alertType === 'shrinkflation') return `${alert.threshold} g/ml`;
    if (alert.thresholdMode === 'absolute') return `< ${alert.absolutePrice} €`;
    return `${alert.threshold}%`;
  };

  const territoryLabel: Record<string, string> = {
    GP: '🏝️ Guadeloupe', MQ: '🏝️ Martinique', GF: '🌴 Guyane',
    RE: '🌋 La Réunion', YT: '🏖️ Mayotte',
  };

  return (
    <>
      <Helmet>
        <title>Alertes Prix - A KI PRI SA YÉ</title>
        <meta 
          name="description" 
          content="Recevez une alerte lorsqu'un prix évolue significativement dans votre territoire" 
        />
      </Helmet>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Texte introductif */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              Alertes Prix
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
              Recevez une alerte lorsqu'un prix évolue significativement
            </p>
            
            {/* Texte rassurant */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Les alertes sont basées sur les données réellement observées et vérifiées dans votre territoire.
                  Vous ne recevrez que des notifications pertinentes et fiables.
                </p>
              </div>
            </div>
          </div>

          {/* Message de confirmation visuelle */}
          {showSuccess && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Alerte créée avec succès !
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Vous serez notifié dès qu'une variation significative sera détectée
                  </p>
                </div>
              </div>
            </div>
          )}

          <UpgradeGate feature="PRICE_ALERTS">
            <AlertForm onSave={handleSave} onCancel={handleCancel} />
          </UpgradeGate>

          {/* Liste des alertes actives */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Mes alertes actives
              {alerts.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                  {alerts.length}
                </span>
              )}
            </h2>

            {alerts.length === 0 ? (
              <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
                <Bell className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Aucune alerte active pour le moment
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Créez votre première alerte ci-dessus pour commencer à suivre les prix
                </p>
              </div>
            ) : (
              <div className="space-y-3" role="list" aria-label="Alertes actives">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    role="listitem"
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {alertTypeIcon(alert.alertType)}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {alert.productName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {alertTypeLabel(alert.alertType)}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                            Seuil : {thresholdLabel(alert)}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {territoryLabel[alert.territory] ?? alert.territory}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAlert(alert.id)}
                      aria-label={`Supprimer l'alerte ${alert.productName}`}
                      className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
