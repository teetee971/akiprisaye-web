 
/**
 * Composant de configuration de la synchronisation
 */

import { useState } from 'react';
import { syncSchedulerService, type SyncSchedulerConfig } from '../../../services/sync';

interface SyncConfigProps {
  onSave: () => void;
}

export default function SyncConfig({ onSave }: SyncConfigProps) {
  const [config, setConfig] = useState<SyncSchedulerConfig>(
    syncSchedulerService.getSchedulerConfig()
  );
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof SyncSchedulerConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    syncSchedulerService.setSchedulerConfig(config);
    setSaved(true);
    onSave();
    
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const defaultConfig = syncSchedulerService.DEFAULT_CONFIG;
    setConfig(defaultConfig);
    syncSchedulerService.setSchedulerConfig(defaultConfig);
    setSaved(true);
    onSave();
    
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Configuration</h2>
        <p className="text-sm text-gray-600">
          Configurez les paramètres de synchronisation automatique
        </p>
      </div>

      <div className="space-y-6">
        {/* Cron Schedules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interval sync produits (cron)
            </label>
            <input
              type="text"
              value={config.productsSyncInterval}
              onChange={(e) => handleChange('productsSyncInterval', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="0 2 * * *"
            />
            <p className="mt-1 text-xs text-gray-500">
              Expression cron (ex: "0 2 * * *" = 2h du matin)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interval sync prix (cron)
            </label>
            <input
              type="text"
              value={config.pricesSyncInterval}
              onChange={(e) => handleChange('pricesSyncInterval', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="0 */6 * * *"
            />
            <p className="mt-1 text-xs text-gray-500">
              Expression cron (ex: "0 */6 * * *" = toutes les 6h)
            </p>
          </div>
        </div>

        {/* Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max produits par sync
            </label>
            <input
              type="number"
              value={config.maxProductsPerSync}
              onChange={(e) => handleChange('maxProductsPerSync', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="100"
              max="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max prix par sync
            </label>
            <input
              type="number"
              value={config.maxPricesPerSync}
              onChange={(e) => handleChange('maxPricesPerSync', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="100"
              max="50000"
            />
          </div>
        </div>

        {/* Retry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tentatives max
            </label>
            <input
              type="number"
              value={config.maxRetries}
              onChange={(e) => handleChange('maxRetries', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Délai entre tentatives (ms)
            </label>
            <input
              type="number"
              value={config.retryDelayMs}
              onChange={(e) => handleChange('retryDelayMs', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1000"
              max="60000"
              step="1000"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.notifyOnError}
              onChange={(e) => handleChange('notifyOnError', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Notifier en cas d'erreur
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.notifyOnComplete}
              onChange={(e) => handleChange('notifyOnComplete', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Notifier à la fin de chaque sync
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Enregistrer
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Réinitialiser
          </button>
          {saved && (
            <span className="text-green-600 text-sm">✓ Configuration sauvegardée</span>
          )}
        </div>
      </div>
    </div>
  );
}
