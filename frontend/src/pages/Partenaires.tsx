/**
 * Partenaires — Dashboard sync partenaires API + prix temps réel
 * Route : /admin/partenaires
 */

import { useState, useCallback } from 'react';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

type SyncStatus = 'connected' | 'delayed' | 'offline';

interface Partner {
  id: string;
  name: string;
  status: SyncStatus;
  lastSync: string;
  productsCount: number;
  apiEndpoint: string;
  latencyMs: number;
  uptimePct: number;
  errors: string[];
}

const INITIAL_PARTNERS: Partner[] = [
  {
    id: 'carrefour',
    name: 'Carrefour',
    status: 'connected',
    lastSync: '2025-01-17T09:45:00',
    productsCount: 12_450,
    apiEndpoint: 'https://api.carrefour.fr/v2/prices/***',
    latencyMs: 142,
    uptimePct: 99.7,
    errors: [],
  },
  {
    id: 'leclerc',
    name: 'Leclerc',
    status: 'connected',
    lastSync: '2025-01-17T09:30:00',
    productsCount: 10_890,
    apiEndpoint: 'https://api.e.leclerc/catalog/prices/***',
    latencyMs: 98,
    uptimePct: 99.9,
    errors: [],
  },
  {
    id: 'courses-u',
    name: 'Courses U',
    status: 'delayed',
    lastSync: '2025-01-17T07:10:00',
    productsCount: 8_230,
    apiEndpoint: 'https://api.coursesu.com/v1/prices/***',
    latencyMs: 450,
    uptimePct: 97.2,
    errors: [
      '2025-01-17 07:10 — Timeout (30s) lors de la synchronisation',
      '2025-01-16 18:00 — HTTP 503 Service Unavailable',
    ],
  },
  {
    id: 'intermarche',
    name: 'Intermarché',
    status: 'connected',
    lastSync: '2025-01-17T09:15:00',
    productsCount: 9_100,
    apiEndpoint: 'https://api.intermarche.com/prices/v2/***',
    latencyMs: 203,
    uptimePct: 98.8,
    errors: ['2025-01-15 14:00 — Clé API expirée (renouvelée)'],
  },
  {
    id: 'leader-price',
    name: 'Leader Price',
    status: 'offline',
    lastSync: '2025-01-15T11:30:00',
    productsCount: 4_560,
    apiEndpoint: 'https://api.leaderprice.fr/sync/prices/***',
    latencyMs: 0,
    uptimePct: 82.3,
    errors: [
      '2025-01-16 00:00 — Connexion refusée',
      '2025-01-16 06:00 — Connexion refusée',
      '2025-01-16 12:00 — DNS resolution failed',
      '2025-01-16 18:00 — Connection refused',
      '2025-01-17 06:00 — Timeout',
    ],
  },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusDot({ status }: { status: SyncStatus }) {
  const colors: Record<SyncStatus, string> = {
    connected: 'bg-green-500',
    delayed: 'bg-yellow-500',
    offline: 'bg-red-500',
  };
  const labels: Record<SyncStatus, string> = {
    connected: 'En ligne',
    delayed: 'Retardé',
    offline: 'Hors ligne',
  };
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
      <span className="text-xs text-gray-600 dark:text-gray-400">{labels[status]}</span>
    </span>
  );
}

function mockLivePrice(basePrice: number, simMode: boolean): string {
  if (!simMode) return `${basePrice.toFixed(2)} €`;
  const variation = (Math.random() - 0.5) * 0.1;
  return `${(basePrice + variation).toFixed(2)} €`;
}

export default function Partenaires() {
  const [partners, setPartners] = useState<Partner[]>(INITIAL_PARTNERS);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());
  const [simMode, setSimMode] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const forcSync = useCallback((partnerId: string) => {
    setSyncing((prev) => new Set([...prev, partnerId]));
    setTimeout(() => {
      setPartners((prev) =>
        prev.map((p) =>
          p.id === partnerId
            ? {
                ...p,
                status: 'connected' as SyncStatus,
                lastSync: new Date().toISOString(),
                latencyMs: 100 + Math.floor(Math.random() * 200),
              }
            : p
        )
      );
      setSyncing((prev) => {
        const next = new Set(prev);
        next.delete(partnerId);
        return next;
      });
      toast.success(`Synchronisation ${partnerId} terminée`);
    }, 2000);
  }, []);

  const toggleErrors = (partnerId: string) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(partnerId)) next.delete(partnerId);
      else next.add(partnerId);
      return next;
    });
  };

  const SAMPLE_PRICES: Record<string, number> = {
    carrefour: 3.2,
    leclerc: 3.1,
    'courses-u': 3.15,
    intermarche: 3.18,
    'leader-price': 2.99,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Wifi className="text-blue-500 w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partenaires API</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Synchronisation en temps réel des prix partenaires
            </p>
          </div>
        </div>
        <button
          onClick={() => setSimMode((v) => !v)}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {simMode ? (
            <ToggleRight className="text-blue-500 w-5 h-5" />
          ) : (
            <ToggleLeft className="text-gray-400 w-5 h-5" />
          )}
          Mode simulation
        </button>
      </div>

      {/* Partners list */}
      <div className="space-y-4">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {partner.status === 'offline' ? (
                    <WifiOff className="text-red-500 w-5 h-5" />
                  ) : (
                    <Wifi className="text-green-500 w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{partner.name}</h3>
                  <StatusDot status={partner.status} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {partner.status === 'connected' && (
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                    {mockLivePrice(SAMPLE_PRICES[partner.id] ?? 3.0, simMode)}
                  </span>
                )}
                <button
                  onClick={() => forcSync(partner.id)}
                  disabled={syncing.has(partner.id)}
                  className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${syncing.has(partner.id) ? 'animate-spin' : ''}`}
                  />
                  {syncing.has(partner.id) ? 'Sync...' : 'Forcer sync'}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Dernière sync</p>
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(partner.lastSync)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Produits</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {partner.productsCount.toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Latence</p>
                <p
                  className={`font-medium ${partner.latencyMs > 300 ? 'text-orange-600' : 'text-green-600'}`}
                >
                  {partner.latencyMs > 0 ? `${partner.latencyMs} ms` : '—'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Uptime</p>
                <p
                  className={`font-medium ${partner.uptimePct > 99 ? 'text-green-600' : partner.uptimePct > 95 ? 'text-orange-600' : 'text-red-600'}`}
                >
                  {partner.uptimePct}%
                </p>
              </div>
            </div>

            {/* API endpoint */}
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900/30 rounded px-3 py-1.5">
              {partner.apiEndpoint}
            </div>

            {/* Errors */}
            {partner.errors.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => toggleErrors(partner.id)}
                  className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 hover:underline"
                >
                  <AlertCircle className="w-4 h-4" />
                  {partner.errors.length} erreur(s) récente(s)
                  {expandedErrors.has(partner.id) ? ' ▲' : ' ▼'}
                </button>
                {expandedErrors.has(partner.id) && (
                  <ul className="mt-2 space-y-1">
                    {partner.errors.map((e, i) => (
                      <li
                        key={i}
                        className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-orange-50 dark:bg-orange-900/10 rounded px-2 py-1"
                      >
                        {e}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
