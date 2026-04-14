 
 
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
import toast from 'react-hot-toast';
import { Bell, BellOff, Plus, Trash2, X } from 'lucide-react';
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
  const { alerts, statistics, createAlert, toggleAlertStatus, deleteAlert, loading } = useAlerts(userId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New alert form state
  const [formType, setFormType] = useState(availableAlertTypes[0]?.id ?? 'price_threshold');
  const [formLabel, setFormLabel] = useState('');
  const [formTerritory, setFormTerritory] = useState<Territory>('GP');
  const [formThreshold, setFormThreshold] = useState('');
  const [formOperator, setFormOperator] = useState<'below' | 'above'>('below');
  const [formNotification, setFormNotification] = useState<'email' | 'push' | 'both'>('email');

  // Filter alerts for this comparator
  const comparatorAlerts = alerts.filter((alert) => alert.comparatorType === comparatorType);

  /**
   * Reset form fields to their default values
   */
  const resetForm = () => {
    setFormType(availableAlertTypes[0]?.id ?? 'price_threshold');
    setFormLabel('');
    setFormTerritory('GP');
    setFormThreshold('');
    setFormOperator('below');
    setFormNotification('email');
    setShowCreateForm(false);
  };

  /**
   * Handle create alert form submission
   */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const conditions: Record<string, unknown> =
        formType === 'price_threshold'
          ? { threshold: Number(formThreshold), operator: formOperator }
          : formType === 'significant_change'
          ? { threshold: Number(formThreshold) }
          : {};

      await createAlert({
        userId,
        comparatorType,
        type: formType,
        territory: formTerritory,
        conditions,
        notificationMethod: formNotification,
        active: true,
        label: formLabel.trim() || undefined,
      });
      toast.success('Alerte créée avec succès.');
      resetForm();
    } catch (err) {
      console.error('Error creating alert:', err);
      toast.error('Impossible de créer l\'alerte.');
    } finally {
      setSubmitting(false);
    }
  };

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
   * Handle delete alert — first tap requests confirmation via toast, second tap confirms
   */
  const handleDelete = async (alertId: string) => {
    if (pendingDeleteId !== alertId) {
      setPendingDeleteId(alertId);
      toast('Appuyez à nouveau pour confirmer la suppression.', {
        icon: '🗑️',
        duration: 3000,
        id: `delete-${alertId}`,
      });
      setTimeout(() => setPendingDeleteId(null), 3000);
      return;
    }

    setPendingDeleteId(null);
    try {
      await deleteAlert(alertId);
      toast.success('Alerte supprimée.');
    } catch (err) {
      console.error('Error deleting alert:', err);
      toast.error('Impossible de supprimer l\'alerte.');
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
      {!showCreateForm && (
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          Créer une nouvelle alerte
        </button>
      )}

      {/* Create Alert Form */}
      {showCreateForm && (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-100">Nouvelle alerte</h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 rounded-lg text-slate-400 hover:text-gray-100 hover:bg-slate-700 transition-colors"
              aria-label="Fermer le formulaire"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Alert label */}
            <div>
              <label htmlFor="alert-label" className="block text-sm font-medium text-gray-300 mb-1">
                Libellé <span className="text-gray-500">(optionnel)</span>
              </label>
              <input
                id="alert-label"
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                maxLength={80}
                placeholder="ex. : Sucre 1 kg trop cher"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-gray-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Alert type */}
            {availableAlertTypes.length > 0 && (
              <div>
                <label htmlFor="alert-type" className="block text-sm font-medium text-gray-300 mb-1">
                  Type d'alerte
                </label>
                <select
                  id="alert-type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-gray-100 text-sm focus:outline-none focus:border-blue-500"
                >
                  {availableAlertTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Threshold (for price_threshold and significant_change types) */}
            {(formType === 'price_threshold' || formType === 'significant_change') && (
              <div className="grid grid-cols-2 gap-3">
                {formType === 'price_threshold' && (
                  <div>
                    <label htmlFor="alert-operator" className="block text-sm font-medium text-gray-300 mb-1">
                      Condition
                    </label>
                    <select
                      id="alert-operator"
                      value={formOperator}
                      onChange={(e) => setFormOperator(e.target.value as 'below' | 'above')}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-gray-100 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="below">Prix ≤</option>
                      <option value="above">Prix ≥</option>
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="alert-threshold" className="block text-sm font-medium text-gray-300 mb-1">
                    {formType === 'price_threshold' ? 'Seuil (€)' : 'Variation (%)'}
                  </label>
                  <input
                    id="alert-threshold"
                    type="number"
                    required
                    min={0}
                    step={formType === 'price_threshold' ? 0.01 : 1}
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    placeholder={formType === 'price_threshold' ? 'ex. : 2.50' : 'ex. : 10'}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-gray-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Territory */}
            <div>
              <label htmlFor="alert-territory" className="block text-sm font-medium text-gray-300 mb-1">
                Territoire
              </label>
              <select
                id="alert-territory"
                value={formTerritory}
                onChange={(e) => setFormTerritory(e.target.value as Territory)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              >
                {(['GP', 'MQ', 'GF', 'RE', 'YT', 'NC', 'PF', 'WF', 'MF', 'BL', 'PM'] as Territory[]).map((t) => (
                  <option key={t} value={t}>{getTerritoryLabel(t)}</option>
                ))}
              </select>
            </div>

            {/* Notification method */}
            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-300 mb-2">Notification</legend>
                <div className="flex flex-wrap gap-3">
                  {([
                    { value: 'email', label: 'E-mail' },
                    { value: 'push', label: 'Push' },
                    { value: 'both', label: 'E-mail + Push' },
                  ] as const).map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="notification-method"
                        value={value}
                        checked={formNotification === value}
                        onChange={() => setFormNotification(value)}
                        className="accent-blue-500"
                      />
                      <span className="text-sm text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? 'Enregistrement…' : 'Créer l\'alerte'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 border border-slate-600 text-gray-300 hover:bg-slate-800 rounded-lg text-sm transition-colors"
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
