 
/**
 * Price Alerts Page
 * Manage price alerts for products — with real observatoire check
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertForm } from '../components/AlertForm';
import { UpgradeGate } from '../components/billing/UpgradeGate';
import { Bell, CheckCircle, Info, Trash2, TrendingDown, TrendingUp, Package, RefreshCw, AlertTriangle } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import {
  type SavedAlert,
  loadAlerts,
  persistAlerts,
} from '../services/priceAlertsStorage';
import { getLatestSnapshotStats } from '../services/observatoirePriceSeries';

// Real Unsplash photo: shopping price tags
const HERO_IMG = 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1600&q=80';

/** Map uppercase territory codes to lowercase stems used by observatoire */
const TERRITORY_MAP: Record<string, string> = {
  GP: 'gp', MQ: 'mq', GF: 'gf', RE: 're', YT: 'yt',
  FR: 'fr', PM: 'pm', MF: 'mf', BL: 'bl',
};

/** Result of checking a saved alert against latest observatoire data */
interface AlertCheckResult {
  alertId: string;
  triggered: boolean;
  currentAvgPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  storeCount?: number;
  snapshotDate?: string;
  message?: string;
}

/**
 * Check a single saved alert against the latest observatoire snapshot.
 * Returns null if no data is available.
 */
async function checkAlertAgainstObservatoire(alert: SavedAlert): Promise<AlertCheckResult> {
  const stem = TERRITORY_MAP[alert.territory] ?? alert.territory.toLowerCase();
  const stats = await getLatestSnapshotStats(stem, alert.productName);

  if (!stats) {
    return { alertId: alert.id, triggered: false };
  }

  const { avg, min, storeCount, date } = stats;
  let triggered = false;
  let message = '';

  if (alert.alertType === 'price_drop') {
    if (alert.thresholdMode === 'absolute') {
      const absTarget = typeof alert.absolutePrice === 'number'
        ? alert.absolutePrice
        : parseFloat(String(alert.absolutePrice));
      if (Number.isFinite(absTarget) && min <= absTarget) {
        triggered = true;
        message = `Prix minimum observé (${min.toFixed(2)} €) ≤ seuil (${absTarget.toFixed(2)} €)`;
      }
    } else {
      // percentage mode: check if avg is below threshold %
      const dropTarget = alert.threshold;
      if (dropTarget > 0 && min <= avg * (1 - dropTarget / 100)) {
        triggered = true;
        message = `Certains magasins proposent ce produit ≥ ${dropTarget}% sous la moyenne`;
      }
    }
  } else if (alert.alertType === 'price_increase') {
    // Check if max price exceeded threshold
    const increaseTarget = alert.threshold;
    if (increaseTarget > 0 && stats.max >= avg * (1 + increaseTarget / 100)) {
      triggered = true;
      message = `Des magasins affichent une hausse ≥ ${increaseTarget}% par rapport à la moyenne`;
    }
  }

  return {
    alertId: alert.id,
    triggered,
    currentAvgPrice: avg,
    minPrice: min,
    maxPrice: stats.max,
    storeCount,
    snapshotDate: date,
    message: triggered ? message : `Aucune variation significative détectée (moy. ${avg.toFixed(2)} €)`,
  };
}

export default function PriceAlertsPage() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [alerts, setAlerts] = useState<SavedAlert[]>([]);
  const [checkResults, setCheckResults] = useState<Record<string, AlertCheckResult>>({});
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  /** Run all alert checks against observatoire data */
  const runAlertChecks = useCallback(async (currentAlerts: SavedAlert[]) => {
    if (currentAlerts.length === 0) return;
    setChecking(true);
    const results: Record<string, AlertCheckResult> = {};
    await Promise.allSettled(
      currentAlerts.map(async (alert) => {
        try {
          const result = await checkAlertAgainstObservatoire(alert);
          results[alert.id] = result;
        } catch {
          results[alert.id] = { alertId: alert.id, triggered: false };
        }
      }),
    );
    setCheckResults(results);
    setLastChecked(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    setChecking(false);
  }, []);

  // Auto-run checks on mount when alerts are loaded
  useEffect(() => {
    if (alerts.length > 0) {
      void runAlertChecks(alerts);
    }
  }, [alerts.length, runAlertChecks]);

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
      // run checks for the new alert too
      void runAlertChecks(updated);
      return updated;
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  const handleCancel = () => {};

  const handleRemoveAlert = (id: string) => {
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== id);
      persistAlerts(updated);
      setCheckResults(prev2 => { const r = { ...prev2 }; delete r[id]; return r; });
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

  const triggeredCount = Object.values(checkResults).filter((r) => r.triggered).length;

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
          {/* Hero banner */}
          <div className="mb-6">
            <HeroImage
              src={HERO_IMG}
              alt="Étiquettes de prix en supermarché"
              gradient="from-blue-900 to-slate-900"
              height="h-40 sm:h-52"
            >
              <h1 className="text-3xl font-bold text-white drop-shadow flex items-center gap-3">
                <Bell className="w-8 h-8" />
                Alertes Prix
                {triggeredCount > 0 && (
                  <span className="ml-2 px-2.5 py-0.5 bg-red-500 text-white text-base font-bold rounded-full animate-pulse">
                    {triggeredCount} 🔔
                  </span>
                )}
              </h1>
              <p className="text-slate-200 drop-shadow text-sm">
                Soyez notifié dès qu'un prix change dans votre territoire
              </p>
            </HeroImage>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Les alertes sont vérifiées en temps réel contre les snapshots mensuels de l'Observatoire citoyen.
              </p>
            </div>
          </div>

          {/* Success message */}
          {showSuccess && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Alerte créée avec succès !
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Vérification en cours contre les données de l'Observatoire…
                  </p>
                </div>
              </div>
            </div>
          )}

          <UpgradeGate feature="PRICE_ALERTS">
            <AlertForm onSave={handleSave} onCancel={handleCancel} />
          </UpgradeGate>

          {/* Active alerts list */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Mes alertes actives
                {alerts.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                    {alerts.length}
                  </span>
                )}
              </h2>
              {alerts.length > 0 && (
                <button
                  onClick={() => void runAlertChecks(alerts)}
                  disabled={checking}
                  className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? 'Vérification…' : lastChecked ? `Mis à jour ${lastChecked}` : 'Vérifier'}
                </button>
              )}
            </div>

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
                {alerts.map((alert) => {
                  const check = checkResults[alert.id];
                  const isTriggered = check?.triggered === true;
                  return (
                    <div
                      key={alert.id}
                      role="listitem"
                      className={`rounded-xl p-4 border shadow-sm ${
                        isTriggered
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {isTriggered
                            ? <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            : alertTypeIcon(alert.alertType)}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {alert.productName}
                              {isTriggered && (
                                <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                                  DÉCLENCHÉ 🔔
                                </span>
                              )}
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
                            {/* Observatoire check result */}
                            {check && (
                              <div className={`mt-2 text-xs rounded-lg px-2 py-1.5 ${
                                isTriggered
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400'
                              }`}>
                                {check.message && <p>{check.message}</p>}
                                {check.currentAvgPrice !== undefined && (
                                  <p className="mt-0.5">
                                    Min : {check.minPrice?.toFixed(2)} € · Moy : {check.currentAvgPrice.toFixed(2)} € · Max : {check.maxPrice?.toFixed(2)} €
                                    {check.storeCount !== undefined && ` (${check.storeCount} enseignes)`}
                                  </p>
                                )}
                                {check.snapshotDate && (
                                  <p className="text-slate-400 mt-0.5">Snapshot : {check.snapshotDate}</p>
                                )}
                              </div>
                            )}
                            {checking && !check && (
                              <p className="mt-1.5 text-xs text-slate-400">Vérification en cours…</p>
                            )}
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
