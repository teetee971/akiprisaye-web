/**
 * Admin – Gestion des utilisateurs
 *
 * Allows admins to list users from Firestore and update their roles,
 * including granting "creator" access.
 */
import { useState, useEffect } from 'react';
import { Search, RefreshCw, UserCheck, Shield, Eye, User, AlertTriangle } from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { logError } from '../../utils/logger';

type UserRole = 'citoyen' | 'observateur' | 'admin' | 'creator';

interface FirestoreUser {
  id: string;
  email?: string;
  displayName?: string;
  role?: UserRole;
  plan?: string;
  createdAt?: string;
  [key: string]: unknown;
}

const ROLE_LABELS: Record<UserRole, string> = {
  citoyen: '👤 Citoyen',
  observateur: '👁️ Observateur',
  admin: '🛡️ Administrateur',
  creator: '✨ Créateur',
};

const ROLE_COLORS: Record<UserRole, string> = {
  citoyen: 'bg-green-100 text-green-800',
  observateur: 'bg-blue-100 text-blue-800',
  admin: 'bg-purple-100 text-purple-800',
  creator: 'bg-amber-100 text-amber-800',
};

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchUsers = async (afterDoc?: QueryDocumentSnapshot<DocumentData> | null) => {
    if (!db) {
      setError("Firebase non configuré. Vérifiez les variables d'environnement.");
      setLoading(false);
      return;
    }
    if (!afterDoc) {
      setLoading(true);
    }
    setError(null);
    try {
      let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE + 1));
      if (afterDoc) {
        q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          startAfter(afterDoc),
          limit(PAGE_SIZE + 1)
        );
      }
      const snap = await getDocs(q);
      const docs = snap.docs;
      const hasMoreResults = docs.length > PAGE_SIZE;
      const page = docs
        .slice(0, PAGE_SIZE)
        .map((d) => ({ id: d.id, ...d.data() }) as FirestoreUser);

      if (afterDoc) {
        setUsers((prev) => [...prev, ...page]);
      } else {
        setUsers(page);
      }
      setLastDoc(hasMoreResults ? docs[PAGE_SIZE - 1] : null);
      setHasMore(hasMoreResults);
    } catch (err) {
      logError('AdminUsers.fetchUsers', err);
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!db) return;
    setUpdating(userId);
    setSuccessMsg(null);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setSuccessMsg(`Rôle mis à jour avec succès.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      logError('AdminUsers.handleRoleChange', err);
      setError('Impossible de mettre à jour le rôle.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      search === '' ||
      (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.displayName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des utilisateurs</h1>
          <p className="text-white/60 text-sm mt-1">
            Gérez les rôles et accès des utilisateurs, y compris l&apos;accès créateur.
          </p>
        </div>
        <button
          onClick={() => fetchUsers()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-900/30 border border-red-700 text-red-200 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success */}
      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-700 text-emerald-200 text-sm">
          {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Rechercher par email, nom ou UID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/40"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-white/40"
        >
          <option value="all">Tous les rôles</option>
          <option value="citoyen">Citoyen</option>
          <option value="observateur">Observateur</option>
          <option value="admin">Administrateur</option>
          <option value="creator">Créateur</option>
        </select>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([role, label]) => (
          <div
            key={role}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${ROLE_COLORS[role]}`}
          >
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Creator access info */}
      <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-700/50 text-amber-200 text-sm">
        <p className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Accès Créateur
        </p>
        <p className="mt-1 text-amber-200/80">
          Le rôle <strong>Créateur</strong> donne accès à toutes les fonctionnalités (plan CREATOR),
          des quotas illimités et les privilèges administrateur. Attribuez ce rôle avec précaution.
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 text-white/40 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          {search || roleFilter !== 'all'
            ? 'Aucun utilisateur ne correspond aux filtres.'
            : 'Aucun utilisateur trouvé.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-white">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left font-medium text-white/70">Utilisateur</th>
                <th className="px-4 py-3 text-left font-medium text-white/70">Rôle actuel</th>
                <th className="px-4 py-3 text-left font-medium text-white/70">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-white/70">Changer le rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((u) => {
                const role = (u.role ?? 'citoyen') as UserRole;
                return (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white truncate max-w-[180px]">
                            {u.displayName ?? u.email ?? 'Sans nom'}
                          </p>
                          {u.displayName && u.email && (
                            <p className="text-white/50 text-xs truncate max-w-[180px]">
                              {u.email}
                            </p>
                          )}
                          <p className="text-white/30 text-xs font-mono">{u.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-800'}`}
                      >
                        {ROLE_LABELS[role] ?? role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs uppercase">{u.plan ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(['citoyen', 'observateur', 'admin', 'creator'] as UserRole[]).map((r) => {
                          const isCurrent = role === r;
                          const isUpdating = updating === u.id;
                          return (
                            <button
                              key={r}
                              disabled={isCurrent || isUpdating}
                              onClick={() => handleRoleChange(u.id, r)}
                              title={
                                isCurrent
                                  ? `Rôle actuel : ${ROLE_LABELS[r]}`
                                  : `Attribuer le rôle ${ROLE_LABELS[r]}`
                              }
                              className={`
                                flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all
                                ${
                                  isCurrent
                                    ? 'opacity-50 cursor-default bg-white/10 text-white/50'
                                    : isUpdating
                                      ? 'cursor-wait opacity-50 bg-white/10 text-white/50'
                                      : r === 'creator'
                                        ? 'bg-amber-600/80 hover:bg-amber-500 text-white'
                                        : r === 'admin'
                                          ? 'bg-purple-600/80 hover:bg-purple-500 text-white'
                                          : r === 'observateur'
                                            ? 'bg-blue-600/80 hover:bg-blue-500 text-white'
                                            : 'bg-green-700/80 hover:bg-green-600 text-white'
                                }
                              `}
                            >
                              {r === 'creator' && <UserCheck className="w-3 h-3" />}
                              {r === 'admin' && <Shield className="w-3 h-3" />}
                              {r === 'observateur' && <Eye className="w-3 h-3" />}
                              {r === 'citoyen' && <User className="w-3 h-3" />}
                              {r === 'creator'
                                ? 'Créateur'
                                : r === 'admin'
                                  ? 'Admin'
                                  : r === 'observateur'
                                    ? 'Observateur'
                                    : 'Citoyen'}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="text-center">
          <button
            onClick={() => fetchUsers(lastDoc)}
            className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            Charger plus d&apos;utilisateurs
          </button>
        </div>
      )}

      <p className="text-white/30 text-xs text-center">
        {filtered.length} utilisateur{filtered.length > 1 ? 's' : ''} affiché
        {filtered.length > 1 ? 's' : ''}
        {users.length !== filtered.length
          ? ` sur ${users.length} chargé${users.length > 1 ? 's' : ''}`
          : ''}
      </p>
    </div>
  );
}
