/**
 * APIKeyDashboard — Gestion des clés API + usage
 * Route : /api-keys
 */

import { useState, useCallback, useMemo } from 'react';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

interface ApiKey {
  id: string;
  key: string;
  label: string;
  plan: 'free' | 'pro';
  createdAt: string;
  lastUsed?: string;
  revoked: boolean;
}

/** Metadata only — the actual key value is never persisted to localStorage. */
type StoredApiKey = Omit<ApiKey, 'key'>;

const STORAGE_KEY = 'akiprisaye_api_keys';

function loadStoredKeys(): StoredApiKey[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredApiKey[]) : [];
  } catch {
    return [];
  }
}

function saveStoredKeys(keys: StoredApiKey[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

function generateApiKey(): string {
  const segments = Array.from({ length: 4 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase(),
  );
  return `AKIP-${segments.join('-')}`;
}

function maskKey(key: string): string {
  const parts = key.split('-');
  return parts
    .map((p, i) => (i === 0 || i === parts.length - 1 ? p : '••••••••'))
    .join('-');
}

const MOCK_USAGE = Array.from({ length: 7 }, (_, i) => ({
  day: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i],
  count: Math.floor(Math.random() * 900) + 50,
}));

export default function APIKeyDashboard() {
  // Persisted metadata only — actual key values are never stored to localStorage.
  const [storedKeys, setStoredKeys] = useState<StoredApiKey[]>(loadStoredKeys);
  // In-memory session values: key id → actual API key string (cleared on reload, by design).
  const [sessionKeyValues, setSessionKeyValues] = useState<Record<string, string>>({});
  const [newLabel, setNewLabel] = useState('');
  const [newPlan, setNewPlan] = useState<'free' | 'pro'>('free');
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [justCreated, setJustCreated] = useState<string | null>(null);

  // Merge persisted metadata with in-memory key values for rendering.
  const keys = useMemo<ApiKey[]>(
    () => storedKeys.map((k) => ({ ...k, key: sessionKeyValues[k.id] ?? '' })),
    [storedKeys, sessionKeyValues],
  );

  const activeKeys = useMemo(() => keys.filter((k) => !k.revoked), [keys]);

  const createKey = useCallback(() => {
    const key = generateApiKey();
    const id = `key_${Date.now()}`;
    const meta: StoredApiKey = {
      id,
      label: newLabel.trim() || 'Ma clé API',
      plan: newPlan,
      createdAt: new Date().toISOString(),
      revoked: false,
    };
    setStoredKeys((prev) => {
      const next = [...prev, meta];
      saveStoredKeys(next);
      return next;
    });
    // Key value kept in memory only — never written to localStorage.
    setSessionKeyValues((prev) => ({ ...prev, [id]: key }));
    setJustCreated(id);
    setNewLabel('');
    toast.success('Clé générée — copiez-la maintenant, elle ne sera plus affichée en clair');
  }, [newLabel, newPlan]);

  const revokeKey = useCallback((id: string) => {
    setStoredKeys((prev) => {
      const next = prev.map((k) => (k.id === id ? { ...k, revoked: true } : k));
      saveStoredKeys(next);
      return next;
    });
    setSessionKeyValues((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast.success('Clé révoquée');
  }, []);

  const toggleReveal = useCallback((id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const copyKey = useCallback((key: string) => {
    navigator.clipboard.writeText(key).catch(() => undefined);
    toast.success('Clé copiée');
  }, []);

  const maxUsage = Math.max(...MOCK_USAGE.map((d) => d.count));

  return (
    <div className='max-w-4xl mx-auto px-4 py-8 space-y-8'>
      {/* Header */}
      <div className='flex items-center gap-3'>
        <Key className='text-blue-500 w-8 h-8' />
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Mes clés API</h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Gérez vos clés d'accès à l'API institutionnelle
          </p>
        </div>
      </div>

      {/* Rate limits info */}
      <div className='grid sm:grid-cols-2 gap-4'>
        <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4'>
          <p className='text-sm font-semibold text-blue-900 dark:text-blue-300'>Plan Gratuit</p>
          <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>1 000 req/jour</p>
          <p className='text-xs text-blue-700 dark:text-blue-500 mt-1'>Accès aux prix, produits, territoires</p>
        </div>
        <div className='bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4'>
          <p className='text-sm font-semibold text-purple-900 dark:text-purple-300'>Plan Pro</p>
          <p className='text-2xl font-bold text-purple-600 dark:text-purple-400'>10 000 req/jour</p>
          <p className='text-xs text-purple-700 dark:text-purple-500 mt-1'>+ Export, Webhooks, Analytics avancées</p>
        </div>
      </div>

      {/* Usage chart */}
      <section className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5'>
        <h2 className='text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
          <Activity className='text-blue-500 w-5 h-5' />
          Utilisation — 7 derniers jours
        </h2>
        <div className='flex items-end gap-2 h-24'>
          {MOCK_USAGE.map((d) => (
            <div key={d.day} className='flex-1 flex flex-col items-center gap-1'>
              <div
                className='w-full bg-blue-500 rounded-t-sm'
                style={{ height: `${(d.count / maxUsage) * 80}px` }}
                title={`${d.count} requêtes`}
              />
              <span className='text-xs text-gray-500 dark:text-gray-400'>{d.day}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Existing keys */}
      <section className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5'>
        <h2 className='text-base font-semibold text-gray-900 dark:text-white mb-4'>Clés existantes</h2>
        {activeKeys.length === 0 ? (
          <p className='text-sm text-gray-500 dark:text-gray-400'>Aucune clé active. Générez votre première clé ci-dessous.</p>
        ) : (
          <div className='space-y-3'>
            {activeKeys.map((k) => {
              const isRevealed = revealedKeys.has(k.id) || justCreated === k.id;
              return (
                <div
                  key={k.id}
                  className='flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700'
                >
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 dark:text-white'>{k.label}</p>
                    <code className='text-xs font-mono text-gray-600 dark:text-gray-400'>
                      {isRevealed ? k.key : maskKey(k.key)}
                    </code>
                    <p className='text-xs text-gray-500 dark:text-gray-500 mt-0.5'>
                      Plan {k.plan} · Créée le {new Date(k.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => toggleReveal(k.id)}
                      className='p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
                      aria-label={isRevealed ? 'Masquer la clé' : 'Révéler la clé'}
                    >
                      {isRevealed ? <EyeOff className='w-4 h-4 text-gray-500' /> : <Eye className='w-4 h-4 text-gray-500' />}
                    </button>
                    {isRevealed && (
                      <button
                        onClick={() => copyKey(k.key)}
                        className='p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
                        aria-label='Copier la clé'
                      >
                        <Copy className='w-4 h-4 text-gray-500' />
                      </button>
                    )}
                    <button
                      onClick={() => revokeKey(k.id)}
                      className='p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors'
                      aria-label='Révoquer la clé'
                    >
                      <Trash2 className='w-4 h-4 text-red-500' />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Generate new key */}
      <section className='bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5'>
        <h2 className='text-base font-semibold text-gray-900 dark:text-white mb-4'>Générer une nouvelle clé</h2>
        <div className='flex flex-wrap gap-3 items-end'>
          <div className='flex-1 min-w-[200px]'>
            <label htmlFor='new-key-label' className='text-xs text-gray-500 dark:text-gray-400 block mb-1'>Label</label>
            <input
              id='new-key-label'
              type='text'
              placeholder='Mon application'
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className='w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            />
          </div>
          <div>
            <label htmlFor='new-key-plan' className='text-xs text-gray-500 dark:text-gray-400 block mb-1'>Plan</label>
            <select
              id='new-key-plan'
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value as 'free' | 'pro')}
              className='text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            >
              <option value='free'>Gratuit</option>
              <option value='pro'>Pro</option>
            </select>
          </div>
          <button
            onClick={createKey}
            className='flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors'
          >
            <Plus className='w-4 h-4' />
            Générer
          </button>
        </div>
        <p className='mt-2 text-xs text-orange-600 dark:text-orange-400'>
          ⚠ La clé complète n'est visible qu'une seule fois après génération. Copiez-la immédiatement.
        </p>
      </section>
    </div>
  );
}
