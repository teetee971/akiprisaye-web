 
 
/**
 * Alert System Component
 * 
 * User interface for managing price and availability alerts.
 * 
 * Features:
 * - Create new alerts
 * - Toggle alerts on/off
 * - Delete alerts
 * - View alert history
 * - Alert statistics
 */

import React, { useState } from 'react';
import { Bell, BellOff, Plus, Trash2, Edit } from 'lucide-react';
import { useAlerts } from '../../hooks/useAlerts';
import type { Alert, Territory } from '../../types/comparatorCommon';
import { getTerritoryLabel } from '../../utils/territoryMapper';

export interface AlertSystemProps {
  /** User ID */
  userId: string;
  /** Type of comparator */
  comparatorType: string;
  /** Available alert types */
  availableAlertTypes?: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

/**
 * Alert System Component
 */
export const AlertSystem: React.FC<AlertSystemProps> = ({
  userId,
  comparatorType,
  availableAlertTypes = [],
}) => {
  const { alerts, statistics, toggleAlertStatus, deleteAlert, loading } = useAlerts(userId);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filter alerts for this comparator
  const comparatorAlerts = alerts.filter((alert) => alert.comparatorType === comparatorType);

  /**
   * Handle toggle alert
   */
  const handleToggle = async (alertId: string, currentState: boolean) => {
    try {
      await toggleAlertStatus(alertId, !currentState);
    } catch (err) {
      console.error('Error toggling alert:', err);
    }
  };

  /**
   * Handle delete alert
   */
  const handleDelete = async (alertId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) {
      return;
    }

    try {
      await deleteAlert(alertId);
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  /**
   * Format alert condition for display
   */
  const formatAlertCondition = (alert: Alert): string => {
    const conditions = alert.conditions;

    switch (alert.type) {
      case 'price_threshold':
        return `Prix ${conditions.operator === 'below' ? '≤' : '≥'} ${conditions.threshold}€`;
      case 'availability':
        return 'Produit disponible';
      case 'new_item':
        return 'Nouvel élément ajouté';
      case 'significant_change':
        return `Changement ≥ ${conditions.threshold}%`;
      default:
        return alert.type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-100">{comparatorAlerts.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Actives</p>
          <p className="text-2xl font-bold text-green-400">
            {comparatorAlerts.filter((a) => a.active).length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Déclenchées</p>
          <p className="text-2xl font-bold text-blue-400">
            {comparatorAlerts.filter((a) => a.triggeredCount > 0).length}
          </p>
        </div>
      </div>

      {/* Create Alert Button */}
      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        <Plus className="w-5 h-5" />
        Créer une nouvelle alerte
      </button>

      {/* Create Form (placeholder) */}
      {showCreateForm && (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Nouvelle alerte
          </h3>
          <p className="text-sm text-gray-400">
            Formulaire de création d'alerte à implémenter selon les besoins spécifiques du comparateur.
          </p>
        </div>
      )}

      {/* Alert List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-100">
          Mes alertes ({comparatorAlerts.length})
        </h3>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
          </div>
        )}

        {!loading && comparatorAlerts.length === 0 && (
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-8 text-center">
            <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">
              Aucune alerte configurée pour ce comparateur
            </p>
          </div>
        )}

        {!loading &&
          comparatorAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`
                bg-slate-900/50 backdrop-blur-md rounded-xl border p-4
                ${alert.active ? 'border-green-500/30' : 'border-slate-700/50'}
              `}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Alert Label */}
                  <div className="flex items-center gap-2 mb-2">
                    {alert.active ? (
                      <Bell className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <BellOff className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                    <h4 className="text-sm font-semibold text-gray-100 truncate">
                      {alert.label || alert.type}
                    </h4>
                    <span
                      className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${alert.active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}
                      `}
                    >
                      {alert.active ? 'Active' : 'Désactivée'}
                    </span>
                  </div>

                  {/* Alert Details */}
                  <div className="space-y-1 text-sm text-gray-400">
                    <p>
                      <span className="font-medium">Condition :</span> {formatAlertCondition(alert)}
                    </p>
                    <p>
                      <span className="font-medium">Territoire :</span>{' '}
                      {getTerritoryLabel(alert.territory)}
                    </p>
                    {alert.triggeredCount > 0 && (
                      <p>
                        <span className="font-medium">Déclenchée :</span> {alert.triggeredCount} fois
                        {alert.lastTriggered && (
                          <> (dernière : {new Date(alert.lastTriggered).toLocaleDateString('fr-FR')})</>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(alert.id, alert.active)}
                    className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                    aria-label={alert.active ? 'Désactiver' : 'Activer'}
                    title={alert.active ? 'Désactiver' : 'Activer'}
                  >
                    {alert.active ? (
                      <BellOff className="w-5 h-5" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    aria-label="Supprimer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-xs text-blue-200">
          💡 Les alertes vous notifient par email ou notification push lorsque les conditions sont remplies.
          Vous pouvez les activer/désactiver à tout moment.
        </p>
      </div>
    </div>
  );
};

export default AlertSystem;
