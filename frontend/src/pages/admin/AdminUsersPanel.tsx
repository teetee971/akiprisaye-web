/**
 * AdminUsersPanel.tsx — /admin/users
 *
 * Panneau d'administration des utilisateurs.
 * Permet de rechercher un utilisateur par email ou UID,
 * consulter son rôle actuel (claims + Firestore),
 * et changer son rôle via une Cloud Function sécurisée.
 *
 * Le changement de rôle met à jour simultanément :
 *   - Les Firebase custom claims (token ID)
 *   - Firestore users/{uid}.role
 *   - auditLogs (traçabilité complète)
 *
 * Après promotion, l'utilisateur ciblé verra son nouveau rôle
 * lors de son prochain retour sur l'application (auto-refresh via visibilitychange)
 * ou en se reconnectant.
 */

import { useState } from 'react';
import { Search, ShieldCheck, User, UserCog, RefreshCw } from 'lucide-react';
import {
  findUserAdmin,
  setUserRoleAdmin,
  type AppRole,
  type AdminUserResult,
} from '../../services/adminUsersService';

const ROLES: { value: AppRole; label: string; color: string }[] = [
  { value: 'citoyen', label: 'Citoyen', color: 'text-emerald-400' },
  { value: 'observateur', label: 'Observateur', color: 'text-sky-400' },
  { value: 'creator', label: 'Créateur', color: 'text-amber-400' },
  { value: 'admin', label: 'Admin', color: 'text-purple-400' },
];

function RoleBadge({ role }: { role: AppRole | null }) {
  if (!role) return <span className="text-slate-500">—</span>;
  const def = ROLES.find((r) => r.value === role);
  return (
    <span className={`font-medium ${def?.color ?? 'text-slate-300'}`}>{def?.label ?? role}</span>
  );
}

export default function AdminUsersPanel() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUserResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('citoyen');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    setUser(null);

    try {
      const result = await findUserAdmin(query);
      setUser(result);
      setSelectedRole(result.role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Recherche impossible.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await setUserRoleAdmin(user.uid, selectedRole);
      setUser({
        ...user,
        role: result.newRole,
        firestoreRole: result.newRole,
        claimRole: result.newRole,
      });
      setSuccess(
        `✅ Rôle mis à jour : ${result.oldRole} → ${result.newRole}. ` +
          `Le changement sera effectif pour l'utilisateur à son prochain retour sur l'application.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Mise à jour impossible.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const roleChanged = user && selectedRole !== user.role;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <UserCog className="w-6 h-6 text-amber-400 shrink-0" />
        <div>
          <h1 className="text-xl font-semibold text-white">Gestion des utilisateurs</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Recherche par email ou UID — changement de rôle sécurisé via Cloud Function
          </p>
        </div>
      </div>

      {/* ── Search form ────────────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Email ou UID Firebase"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="rounded-xl px-5 py-3 bg-slate-100 text-slate-900 text-sm font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Rechercher'}
        </button>
      </form>

      {/* ── Messages ───────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* ── User card ──────────────────────────────────────────────────── */}
      {user && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-slate-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user.displayName ?? user.email ?? 'Utilisateur sans nom'}
              </div>
              <div className="text-xs text-slate-400 truncate">{user.email ?? '—'}</div>
            </div>
            {user.disabled && (
              <span className="ml-auto text-xs bg-red-900/40 text-red-300 border border-red-800 rounded-full px-2.5 py-0.5 shrink-0">
                Désactivé
              </span>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500 mb-1">UID</div>
              <div className="text-white font-mono text-xs break-all">{user.uid}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Rôle effectif</div>
              <RoleBadge role={user.role} />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Claims Firebase</div>
              <RoleBadge role={user.claimRole} />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Firestore</div>
              <RoleBadge role={user.firestoreRole} />
            </div>
          </div>

          {/* Divergence warning */}
          {user.claimRole !== user.firestoreRole && user.claimRole !== null && (
            <div className="rounded-lg border border-amber-800 bg-amber-950/30 px-3 py-2 text-xs text-amber-300 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              Les claims et Firestore sont désynchronisés — une mise à jour corrigera les deux.
            </div>
          )}

          {/* Role selector + save */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end pt-2">
            <div className="flex-1">
              <label htmlFor="role-select" className="text-xs text-slate-500 block mb-2">
                Nouveau rôle
              </label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as AppRole)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none transition-colors"
              >
                {ROLES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !roleChanged}
              className="rounded-xl px-5 py-3 bg-amber-400 text-slate-950 text-sm font-semibold hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 sm:self-end"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {saving ? 'Enregistrement…' : 'Mettre à jour le rôle'}
            </button>
          </div>
        </div>
      )}

      {/* ── Usage note ─────────────────────────────────────────────────── */}
      <p className="text-xs text-slate-600">
        Chaque changement de rôle est journalisé dans{' '}
        <code className="text-slate-500">auditLogs</code>. L'utilisateur ciblé devra retourner sur
        l'application ou se reconnecter pour que le nouveau rôle soit actif côté client.
      </p>
    </div>
  );
}
