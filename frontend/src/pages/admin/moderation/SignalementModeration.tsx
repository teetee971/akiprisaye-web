/**
 * Admin – Signalement Moderation
 *
 * Lists citizen price reports and allows admins to:
 *   - validate, reject, or flag contributions
 *   - filter by territory, type and status
 */
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Flag, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { logError } from '../../../utils/logger';
import type { ContributionStatus } from '../../../types/contribution';

// Extended interface to accommodate real Firestore documents
interface SignalementDoc {
  id: string;
  productName?: string;
  storeName?: string;
  territory?: string;
  description?: string;
  status: ContributionStatus;
  submittedAt?: string;
  [key: string]: unknown;
}

type Row = SignalementDoc;

const STATUS_LABELS: Record<ContributionStatus, string> = {
  pending: '⏳ En attente',
  validated: '✅ Validé',
  rejected: '❌ Rejeté',
  flagged: '�� Signalé',
};

const STATUS_COLORS: Record<ContributionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  validated: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  flagged: 'bg-orange-100 text-orange-800',
};

export default function SignalementModeration() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContributionStatus | 'all'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchRows = async () => {
    if (!db) {
      setError("Firebase non configuré. Vérifiez les variables d'environnement.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'contributions'), orderBy('submittedAt', 'desc'), limit(200));
      const snap = await getDocs(q);
      const data: Row[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Row);
      setRows(data);
    } catch (err) {
      logError('SignalementModeration: fetch failed', err);
      setError('Impossible de charger les signalements. Vérifiez vos permissions Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const updateStatus = async (id: string, status: ContributionStatus) => {
    if (!db) return;
    setUpdating(id);
    try {
      await updateDoc(doc(db, 'contributions', id), {
        status,
        moderatedAt: Timestamp.now(),
      });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      logError('SignalementModeration: update failed', err);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = rows.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.productName?.toLowerCase().includes(q) ||
      r.storeName?.toLowerCase().includes(q) ||
      r.territory?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modération des signalements</h1>
          <p className="text-sm text-gray-500 mt-1">
            {rows.length} signalement{rows.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={fetchRows}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          disabled={loading}
          aria-label="Rafraîchir la liste"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Rafraîchir
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Rechercher par produit, enseigne, territoire…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="Rechercher dans les signalements"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContributionStatus | 'all')}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          aria-label="Filtrer par statut"
        >
          <option value="all">Tous les statuts</option>
          {(Object.keys(STATUS_LABELS) as ContributionStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-gray-500" aria-live="polite">
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-500" aria-live="polite">
          Aucun signalement correspondant.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <caption className="sr-only">Liste des signalements citoyens</caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  Produit
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  Enseigne
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  Territoire
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  Description
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  Statut
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td
                    className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate"
                    title={row.productName}
                  >
                    {row.productName ?? '—'}
                  </td>
                  <td
                    className="px-4 py-3 text-gray-600 max-w-[120px] truncate"
                    title={row.storeName}
                  >
                    {row.storeName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.territory ?? '—'}</td>
                  <td
                    className="px-4 py-3 text-gray-600 max-w-[140px] truncate"
                    title={row.description}
                  >
                    {row.description ? row.description.slice(0, 60) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateStatus(row.id, 'validated')}
                        disabled={updating === row.id || row.status === 'validated'}
                        className="rounded p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
                        aria-label={`Valider le signalement de ${row.productName ?? row.id}`}
                      >
                        <CheckCircle className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => updateStatus(row.id, 'rejected')}
                        disabled={updating === row.id || row.status === 'rejected'}
                        className="rounded p-1 text-red-500 hover:bg-red-50 disabled:opacity-40"
                        aria-label={`Rejeter le signalement de ${row.productName ?? row.id}`}
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => updateStatus(row.id, 'flagged')}
                        disabled={updating === row.id || row.status === 'flagged'}
                        className="rounded p-1 text-orange-500 hover:bg-orange-50 disabled:opacity-40"
                        aria-label={`Marquer comme suspect le signalement de ${row.productName ?? row.id}`}
                      >
                        <Flag className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
