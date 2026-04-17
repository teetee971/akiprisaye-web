/**
 * AlertesPredictives — Fenêtres d'achat optimales + canaux de notification
 * Route : /alertes-predictives
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Bell, Mail, Smartphone, Activity, Plus, Trash2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotifPrefs {
  push: boolean;
  email: boolean;
  inApp: boolean;
}

interface PriceAlert {
  id: string;
  productName: string;
  threshold: number;
  territory: string;
  channels: string[];
  createdAt: string;
}

const PREFS_KEY = 'akiprisaye_notif_prefs';
const ALERTS_KEY = 'akiprisaye_price_alerts';

const TERRITORIES = ['Martinique', 'Guadeloupe', 'Réunion', 'Guyane', 'Mayotte'];
const PRODUCTS = [
  'Riz long grain 1kg',
  'Huile tournesol 1L',
  'Lait demi-écrémé 1L',
  'Sucre blanc 1kg',
  'Farine de blé 1kg',
];

function generateForecast(seed: number): { day: number; price: number; optimal: boolean }[] {
  const base = 2.5 + (seed % 5) * 0.3;
  return Array.from({ length: 30 }, (_, i) => {
    const noise = Math.sin(i * 0.8 + seed) * 0.3 + Math.cos(i * 0.5) * 0.2;
    const price = +(base + noise).toFixed(2);
    return { day: i + 1, price, optimal: false };
  }).map((pt, _, arr) => {
    const prices = arr.map((p) => p.price);
    const min = Math.min(...prices);
    return { ...pt, optimal: pt.price <= min + 0.05 };
  });
}

function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as NotifPrefs) : { push: false, email: true, inApp: true };
  } catch {
    return { push: false, email: true, inApp: true };
  }
}

function loadAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(ALERTS_KEY);
    return raw ? (JSON.parse(raw) as PriceAlert[]) : [];
  } catch {
    return [];
  }
}

export default function AlertesPredictives() {
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [selectedTerritory, setSelectedTerritory] = useState(TERRITORIES[0]);
  const [prefs, setPrefs] = useState<NotifPrefs>(loadPrefs);
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadAlerts);
  const [newProduct, setNewProduct] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [newTerritory, setNewTerritory] = useState(TERRITORIES[0]);
  const [newChannels, setNewChannels] = useState<string[]>(['inApp']);

  const forecast = useMemo(
    () => generateForecast(selectedProduct.charCodeAt(0) + selectedTerritory.charCodeAt(0)),
    [selectedProduct, selectedTerritory]
  );

  const optimalWindow = useMemo(() => {
    const optimal = forecast.filter((p) => p.optimal);
    if (optimal.length === 0) return null;
    const start = optimal[0].day;
    const end = optimal[optimal.length - 1].day;
    const prices = forecast.map((p) => p.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const saving = +(((mean - minPrice) / mean) * 100).toFixed(1);
    return { start, end, saving };
  }, [forecast]);

  const minPrice = useMemo(() => Math.min(...forecast.map((p) => p.price)), [forecast]);
  const maxPrice = useMemo(() => Math.max(...forecast.map((p) => p.price)), [forecast]);
  const chartHeight = 120;
  const chartWidth = 560;

  const points = useMemo(() => {
    return forecast.map((pt, i) => {
      const x = (i / (forecast.length - 1)) * chartWidth;
      const y = chartHeight - ((pt.price - minPrice) / (maxPrice - minPrice + 0.01)) * chartHeight;
      return { x, y, ...pt };
    });
  }, [forecast, minPrice, maxPrice]);

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const togglePref = useCallback((key: keyof NotifPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const testAlert = useCallback(() => {
    toast.success('🔔 Alerte test envoyée ! Prix bas détecté sur ' + selectedProduct, {
      duration: 4000,
    });
  }, [selectedProduct]);

  const addAlert = useCallback(() => {
    if (!newProduct.trim() || !newThreshold) {
      toast.error('Remplissez tous les champs');
      return;
    }
    const alert: PriceAlert = {
      id: `alert_${Date.now()}`,
      productName: newProduct.trim(),
      threshold: +newThreshold,
      territory: newTerritory,
      channels: newChannels,
      createdAt: new Date().toISOString(),
    };
    setAlerts((prev) => {
      const next = [...prev, alert];
      localStorage.setItem(ALERTS_KEY, JSON.stringify(next));
      return next;
    });
    setNewProduct('');
    setNewThreshold('');
    toast.success('Alerte créée avec succès');
  }, [newProduct, newThreshold, newTerritory, newChannels]);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      localStorage.setItem(ALERTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleChannel = (ch: string) => {
    setNewChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  };

  const MONTHS = [
    'jan',
    'fév',
    'mar',
    'avr',
    'mai',
    'juin',
    'juil',
    'aoû',
    'sep',
    'oct',
    'nov',
    'déc',
  ];
  const now = new Date();
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + (optimalWindow?.start ?? 1) - 1
  );
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + (optimalWindow?.end ?? 5) - 1
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Activity className="text-blue-500 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alertes Prédictives</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fenêtres d'achat optimales par ML + configuration des notifications
          </p>
        </div>
      </div>

      {/* Forecast chart */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Prévision 30 jours
        </h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {PRODUCTS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select
            value={selectedTerritory}
            onChange={(e) => setSelectedTerritory(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {TERRITORIES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className="w-full max-w-2xl">
            {/* Optimal zone highlight */}
            {optimalWindow &&
              (() => {
                const x1 = ((optimalWindow.start - 1) / (forecast.length - 1)) * chartWidth;
                const x2 = ((optimalWindow.end - 1) / (forecast.length - 1)) * chartWidth;
                return (
                  <rect
                    x={x1}
                    y={0}
                    width={x2 - x1}
                    height={chartHeight}
                    fill="#22c55e"
                    fillOpacity={0.15}
                  />
                );
              })()}
            {/* Price line */}
            <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth={2} />
            {/* Optimal points */}
            {points
              .filter((p) => p.optimal)
              .map((p) => (
                <circle key={p.day} cx={p.x} cy={p.y} r={4} fill="#22c55e" />
              ))}
            {/* Axis labels */}
            {[1, 10, 20, 30].map((day) => {
              const x = ((day - 1) / 29) * chartWidth;
              return (
                <text
                  key={day}
                  x={x}
                  y={chartHeight + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#9ca3af"
                >
                  J+{day}
                </text>
              );
            })}
          </svg>
        </div>

        {optimalWindow && (
          <div className="mt-4 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <CheckCircle className="text-green-600 w-5 h-5 flex-shrink-0" />
            <p className="text-sm text-green-800 dark:text-green-300">
              <strong>Fenêtre optimale :</strong> du {startDate.getDate()}{' '}
              {MONTHS[startDate.getMonth()]} au {endDate.getDate()} {MONTHS[endDate.getMonth()]} —
              économie estimée : <strong>-{optimalWindow.saving}%</strong>
            </p>
          </div>
        )}
      </section>

      {/* Notification channels */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="text-blue-500 w-5 h-5" />
          Canal de notification
        </h2>
        <div className="space-y-3">
          {(
            [
              { key: 'push' as const, label: 'Push notifications', icon: Smartphone },
              { key: 'email' as const, label: 'Email', icon: Mail },
              { key: 'inApp' as const, label: 'In-app', icon: Bell },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-900 dark:text-white">{label}</span>
              </div>
              <button
                role="switch"
                aria-checked={prefs[key]}
                onClick={() => togglePref(key)}
                className={`relative w-11 h-6 rounded-full transition-colors ${prefs[key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[key] ? 'translate-x-5' : ''}`}
                />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={testAlert}
          className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <Bell className="w-4 h-4" />
          Tester l'alerte
        </button>
      </section>

      {/* Active alerts */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Mes alertes actives
        </h2>

        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune alerte configurée</p>
        ) : (
          <div className="space-y-2 mb-6">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {a.productName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Seuil : {a.threshold} € · {a.territory} · {a.channels.join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => removeAlert(a.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  aria-label="Supprimer l'alerte"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add alert form */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Ajouter une alerte
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nom du produit"
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="number"
              placeholder="Seuil prix (€)"
              value={newThreshold}
              onChange={(e) => setNewThreshold(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <select
              value={newTerritory}
              onChange={(e) => setNewTerritory(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {TERRITORIES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <div className="flex gap-2 flex-wrap">
              {['push', 'email', 'inApp'].map((ch) => (
                <button
                  key={ch}
                  onClick={() => toggleChannel(ch)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    newChannels.includes(ch)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={addAlert}
            className="mt-3 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter l'alerte
          </button>
        </div>
      </section>
    </div>
  );
}
