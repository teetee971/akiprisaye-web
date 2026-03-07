 
/**
 * Alert Form Component
 * Create and edit price alerts with support for % or absolute price threshold
 */

import { useState } from 'react';
import { AlertTriangle, Save, X, HelpCircle } from 'lucide-react';
import type { AlertType } from '../types/priceAlerts';

type ThresholdMode = 'percentage' | 'absolute';

interface AlertFormProps {
  productEAN?: string;
  productName?: string;
  onSave: (alert: any) => void;
  onCancel: () => void;
}

export function AlertForm({ productEAN = '', productName = '', onSave, onCancel }: AlertFormProps) {
  const [formData, setFormData] = useState({
    productEAN,
    productName,
    alertType: 'price_drop' as AlertType,
    thresholdMode: 'percentage' as ThresholdMode,
    threshold: 10,
    absolutePrice: '' as string | number,
    territory: 'GP',
    emailEnabled: true,
    pushEnabled: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isShrinkflation = formData.alertType === 'shrinkflation';
  const isAbsolute = !isShrinkflation && formData.thresholdMode === 'absolute';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-orange-500" />
        Créer une Alerte Prix
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        Remplissez les champs ci-dessous pour être notifié des variations de prix importantes
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Nom du produit <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="Ex: Lait UHT 1L, Pain de mie 500g..."
            required
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Indiquez le nom du produit que vous souhaitez surveiller
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Code-barres EAN (facultatif)
          </label>
          <input
            type="text"
            value={formData.productEAN}
            onChange={(e) => setFormData({ ...formData, productEAN: e.target.value })}
            placeholder="Ex: 3017620422003"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pour un suivi plus précis, scannez le code-barres du produit
          </p>
        </div>

        {/* Alert Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Type d'alerte <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.alertType}
            onChange={(e) => setFormData({ ...formData, alertType: e.target.value as AlertType, thresholdMode: 'percentage' })}
            required
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="price_drop">🔽 Baisse de prix</option>
            <option value="price_increase">🔼 Hausse de prix</option>
            <option value="shrinkflation">📦 Réduction de quantité (shrinkflation)</option>
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choisissez le type de variation à surveiller
          </p>
        </div>

        {/* Threshold Mode — only for price drop / price increase */}
        {!isShrinkflation && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Mode de seuil
            </label>
            <div
              role="radiogroup"
              aria-label="Mode de seuil"
              className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600"
            >
              <button
                type="button"
                role="radio"
                aria-checked={formData.thresholdMode === 'percentage'}
                onClick={() => setFormData({ ...formData, thresholdMode: 'percentage' })}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  formData.thresholdMode === 'percentage'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
              >
                % Variation
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={formData.thresholdMode === 'absolute'}
                onClick={() => setFormData({ ...formData, thresholdMode: 'absolute' })}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  formData.thresholdMode === 'absolute'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
              >
                € Seuil absolu
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {formData.thresholdMode === 'absolute'
                ? 'Recevoir l\'alerte si le prix passe sous (ou dépasse) ce montant exact en euros'
                : 'Recevoir l\'alerte si le prix varie de plus de ce pourcentage'}
            </p>
          </div>
        )}

        {/* Threshold */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            Seuil de déclenchement ({isShrinkflation ? 'g/ml' : isAbsolute ? '€' : '%'}) <span className="text-red-500">*</span>
            <div className="relative group">
              <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
              <div className="absolute left-0 top-6 hidden group-hover:block w-64 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl z-10">
                {isShrinkflation
                  ? 'Quantité minimale de réduction pour déclencher l\'alerte'
                  : isAbsolute
                  ? 'Prix absolu en euros pour déclencher l\'alerte (ex: 1,89 = alerter si prix < 1,89 €)'
                  : 'Pourcentage minimum de variation pour déclencher l\'alerte'}
              </div>
            </div>
          </label>
          {isAbsolute ? (
            <div className="relative">
              <input
                type="number"
                value={formData.absolutePrice}
                onChange={(e) => setFormData({ ...formData, absolutePrice: e.target.value })}
                placeholder="Ex: 1.89"
                min="0"
                step="0.01"
                required
                className="w-full px-4 py-2 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">€</span>
            </div>
          ) : (
            <input
              type="number"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
              min="1"
              max="100"
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {formData.alertType === 'price_drop' && !isAbsolute && '✓ Vous serez notifié si le prix baisse de plus de ce pourcentage'}
            {formData.alertType === 'price_drop' && isAbsolute && `✓ Vous serez notifié si le prix passe sous ${formData.absolutePrice || '…'} €`}
            {formData.alertType === 'price_increase' && !isAbsolute && '⚠️ Vous serez notifié si le prix augmente de plus de ce pourcentage'}
            {formData.alertType === 'price_increase' && isAbsolute && `⚠️ Vous serez notifié si le prix dépasse ${formData.absolutePrice || '…'} €`}
            {formData.alertType === 'shrinkflation' && '📉 Vous serez notifié si la quantité diminue (même prix, moins de produit)'}
          </p>
        </div>

        {/* Territory */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Votre territoire <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.territory}
            onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="GP">🏝️ Guadeloupe</option>
            <option value="MQ">🏝️ Martinique</option>
            <option value="GF">🌴 Guyane</option>
            <option value="RE">🌋 La Réunion</option>
            <option value="YT">🏖️ Mayotte</option>
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            L'alerte sera déclenchée uniquement pour les prix observés dans ce territoire
          </p>
        </div>

        {/* Notification Preferences */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Mode de notification
          </label>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="email"
              checked={formData.emailEnabled}
              onChange={(e) => setFormData({ ...formData, emailEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="email" className="text-sm text-slate-700 dark:text-slate-300 flex-1">
              📧 Recevoir par email
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="push"
              checked={formData.pushEnabled}
              onChange={(e) => setFormData({ ...formData, pushEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="push" className="text-sm text-slate-700 dark:text-slate-300 flex-1">
              📱 Notifications push (sur mobile)
            </label>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Sélectionnez au moins un mode de notification
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-xl"
          >
            <Save className="w-5 h-5" />
            Créer l'alerte
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <X className="w-5 h-5" />
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
