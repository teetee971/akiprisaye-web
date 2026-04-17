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
import { Bell, BellOff, Plus, Trash2, X } from 'lucide-react';
import { useAlerts } from '../../hooks/useAlerts';
import type { Alert, Territory } from '../../types/comparatorCommon';
import { TERRITORIES, getTerritoryLabel } from '../../utils/territoryMapper';

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
  const { alerts, statistics, toggleAlertStatus, deleteAlert, createAlert, loading } =
    useAlerts(userId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    type: availableAlertTypes[0]?.id || 'price_threshold',
    territory: 'GP' as Territory,
    threshold: '',
    operator: 'below' as 'below' | 'above',
    notificationMethod: 'email' as 'email' | 'push' | 'both',
    label: '',
  });

  // Filter alerts for this comparator
  const comparatorAlerts = alerts.filter((alert) => alert.comparatorType === comparatorType);

  /**
   * Handle create alert form submission
   */
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const conditions: Record<string, unknown> = {};
      if (formState.type === 'price_threshold') {
        const parsed = parseFloat(formState.threshold);
        if (isNaN(parsed)) {
          setFormError('Veuillez saisir un seuil numérique valide.');
          setSaving(false);
          return;
        }
        conditions.threshold = parsed;
        conditions.operator = formState.operator;
      } else if (formState.type === 'significant_change') {
        const parsed = parseFloat(formState.threshold);
        if (isNaN(parsed) || parsed <= 0) {
          setFormError('Veuillez saisir un pourcentage de variation valide (> 0).');
          setSaving(false);
          return;
        }
        conditions.threshold = parsed;
      }

      await createAlert({
        userId,
        comparatorType,
        type: formState.type,
        territory: formState.territory,
        conditions,
        notificationMethod: formState.notificationMethod,
        active: true,
        label: formState.label.trim() || undefined,
      });

      setShowCreateForm(false);
      setFormState({
        type: availableAlertTypes[0]?.id || 'price_threshold',
        territory: 'GP',
        threshold: '',
        operator: 'below',
        notificationMethod: 'email',
        label: '',
      });
    } catch {
      setFormError("Erreur lors de la création de l'alerte. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Standard alert types when none provided via props
   */
  const resolvedAlertTypes =
    availableAlertTypes.length > 0
      ? availableAlertTypes
      : [
          {
            id: 'price_threshold',
            name: 'Seuil de prix',
            description: "Alerte quand le prix passe sous ou au-dessus d'un seuil",
          },
          {
            id: 'availability',
            name: 'Disponibilité',
            description: 'Alerte quand un produit devient disponible',
          },
          {
            id: 'significant_change',
            name: 'Variation significative',
            description: 'Alerte quand le prix change brusquement',
          },
          {
            id: 'new_item',
            name: 'Nouvel élément',
            description: 'Alerte quand un nouvel élément est ajouté',
          },
        ];

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

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-100">Nouvelle alerte</h3>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Fermer le formulaire"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateAlert} className="space-y-4">
            {/* Label */}
            <div>
              <label htmlFor="alert-label" className="block text-sm text-gray-300 mb-1">
                Libellé (optionnel)
              </label>
              <input
                id="alert-label"
                type="text"
                value={formState.label}
                onChange={(e) => setFormState((s) => ({ ...s, label: e.target.value }))}
                placeholder="Ex : Riz long grain Leclerc MQ"
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
              />
            </div>

            {/* Alert type */}
            <div>
              <label htmlFor="alert-type" className="block text-sm text-gray-300 mb-1">
                Type d&apos;alerte <span className="text-red-400">*</span>
              </label>
              <select
                id="alert-type"
                value={formState.type}
                onChange={(e) => setFormState((s) => ({ ...s, type: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {resolvedAlertTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Territory */}
            <div>
              <label htmlFor="alert-territory" className="block text-sm text-gray-300 mb-1">
                Territoire <span className="text-red-400">*</span>
              </label>
              <select
                id="alert-territory"
                value={formState.territory}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, territory: e.target.value as Territory }))
                }
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {Object.values(TERRITORIES).map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Threshold (price_threshold / significant_change) */}
            {(formState.type === 'price_threshold' || formState.type === 'significant_change') && (
              <div className="flex gap-3">
                {formState.type === 'price_threshold' && (
                  <div className="flex-1">
                    <label htmlFor="alert-operator" className="block text-sm text-gray-300 mb-1">
                      Condition
                    </label>
                    <select
                      id="alert-operator"
                      value={formState.operator}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          operator: e.target.value as 'below' | 'above',
                        }))
                      }
                      className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="below">Prix ≤</option>
                      <option value="above">Prix ≥</option>
                    </select>
                  </div>
                )}
                <div className="flex-1">
                  <label htmlFor="alert-threshold" className="block text-sm text-gray-300 mb-1">
                    {formState.type === 'price_threshold' ? 'Seuil (€)' : 'Variation (%)'}
                    <span className="text-red-400"> *</span>
                  </label>
                  <input
                    id="alert-threshold"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step={formState.type === 'significant_change' ? '1' : '0.01'}
                    value={formState.threshold}
                    onChange={(e) => setFormState((s) => ({ ...s, threshold: e.target.value }))}
                    placeholder={formState.type === 'price_threshold' ? '2.99' : '10'}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
                  />
                </div>
              </div>
            )}

            {/* Notification method */}
            <div>
              <label htmlFor="alert-notif" className="block text-sm text-gray-300 mb-1">
                Notification
              </label>
              <select
                id="alert-notif"
                value={formState.notificationMethod}
                onChange={(e) =>
                  setFormState((s) => ({
                    ...s,
                    notificationMethod: e.target.value as 'email' | 'push' | 'both',
                  }))
                }
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="email">E-mail</option>
                <option value="push">Notification push</option>
                <option value="both">Les deux</option>
              </select>
            </div>

            {formError && (
              <p className="text-sm text-red-400" role="alert">
                {formError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {saving ? 'Enregistrement…' : "Créer l'alerte"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-lg font-medium text-sm transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
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
            <p className="text-gray-400">Aucune alerte configurée pour ce comparateur</p>
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
                        <span className="font-medium">Déclenchée :</span> {alert.triggeredCount}{' '}
                        fois
                        {alert.lastTriggered && (
                          <>
                            {' '}
                            (dernière : {new Date(alert.lastTriggered).toLocaleDateString('fr-FR')})
                          </>
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
                    {alert.active ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
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
          💡 Les alertes vous notifient par email ou notification push lorsque les conditions sont
          remplies. Vous pouvez les activer/désactiver à tout moment.
        </p>
      </div>
    </div>
  );
};

export default AlertSystem;
