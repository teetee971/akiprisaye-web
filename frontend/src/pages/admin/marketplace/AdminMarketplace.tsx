/**
 * AdminMarketplace — Panneau d'administration de la Marketplace
 *
 * Fonctions :
 * - Validation / rejet des enseignes (statut PENDING → APPROVED / REJECTED)
 * - Suspension / réactivation des comptes
 * - Contrôle qualité des données
 * - Journal d'audit immuable
 * - Vue d'ensemble des abonnements et revenus
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Slash,
  RotateCcw,
  BarChart3,
  CreditCard,
  FileText,
  Shield,
} from 'lucide-react';
import {
  getAllMerchants,
  getMerchantsByStatus,
  adminChangeMerchantStatus,
  getAuditLog,
  formatSiret,
  MARKETPLACE_PLANS,
} from '../../../services/merchantService';
import { getTotalRevenue, getMerchantInvoices } from '../../../services/merchantBillingService';
import { auth } from '../../../lib/firebase';
import type {
  MerchantProfile,
  MerchantStatus,
  AdminAuditLog,
  AdminActionType,
} from '../../../types/merchant';

// ─── Badge statut ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MerchantStatus }) {
  const cfg = {
    PENDING: {
      label: 'En attente',
      cls: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30',
      icon: <Clock className="w-3 h-3" />,
    },
    APPROVED: {
      label: 'Approuvé',
      cls: 'bg-green-600/20 text-green-300 border-green-600/30',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    SUSPENDED: {
      label: 'Suspendu',
      cls: 'bg-red-600/20 text-red-400 border-red-600/30',
      icon: <XCircle className="w-3 h-3" />,
    },
    REJECTED: {
      label: 'Rejeté',
      cls: 'bg-orange-600/20 text-orange-300 border-orange-600/30',
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };
  const c = cfg[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${c.cls}`}
    >
      {c.icon} {c.label}
    </span>
  );
}

// ─── Modal de confirmation d'action ───────────────────────────────────────────

function ActionModal({
  merchant,
  action,
  onConfirm,
  onCancel,
}: {
  merchant: MerchantProfile;
  action: AdminActionType;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const requiresReason = action === 'REJECT' || action === 'SUSPEND';

  const labels: Record<
    AdminActionType,
    { title: string; desc: string; btn: string; btnCls: string }
  > = {
    APPROVE: {
      title: "Approuver l'enseigne",
      desc: "Le compte sera activé et l'enseigne apparaîtra dans le comparateur.",
      btn: 'Approuver',
      btnCls: 'bg-green-600 hover:bg-green-700',
    },
    REJECT: {
      title: 'Rejeter le dossier',
      desc: "L'enseigne sera notifiée par email avec le motif de rejet.",
      btn: 'Rejeter',
      btnCls: 'bg-orange-600 hover:bg-orange-700',
    },
    SUSPEND: {
      title: 'Suspendre le compte',
      desc: "L'enseigne ne sera plus visible dans le comparateur.",
      btn: 'Suspendre',
      btnCls: 'bg-red-600 hover:bg-red-700',
    },
    REACTIVATE: {
      title: 'Réactiver le compte',
      desc: 'Le compte sera de nouveau actif.',
      btn: 'Réactiver',
      btnCls: 'bg-blue-600 hover:bg-blue-700',
    },
    PRICE_FLAG: {
      title: 'Signaler un prix',
      desc: "Un avertissement sera ajouté au journal d'audit.",
      btn: 'Signaler',
      btnCls: 'bg-yellow-600 hover:bg-yellow-700',
    },
    DATA_CORRECTION: {
      title: 'Signaler données incorrectes',
      desc: "Une correction sera demandée à l'enseigne.",
      btn: 'Signaler',
      btnCls: 'bg-yellow-600 hover:bg-yellow-700',
    },
  };

  const cfg = labels[action];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/15 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-2">{cfg.title}</h3>
        <p className="text-gray-400 text-sm mb-1">
          Enseigne : <span className="text-white font-medium">{merchant.nomCommercial}</span>
        </p>
        <p className="text-gray-400 text-sm mb-4">{cfg.desc}</p>

        {requiresReason && (
          <div className="mb-4">
            <label htmlFor="marketplace-motif" className="block text-sm text-gray-300 mb-1">
              Motif * (obligatoire)
            </label>
            <textarea
              id="marketplace-motif"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Décrivez la raison de cette décision…"
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(reason)}
            disabled={requiresReason && !reason.trim()}
            className={`flex-1 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-40 ${cfg.btnCls}`}
          >
            {cfg.btn}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ligne enseigne ─────────────────────────────────────────────────────────

function MerchantRow({
  merchant,
  onAction,
}: {
  merchant: MerchantProfile;
  onAction: (m: MerchantProfile, action: AdminActionType) => void;
}) {
  const plan = MARKETPLACE_PLANS.find((p) => p.id === merchant.plan);
  const invoices = getMerchantInvoices(merchant.id);
  const paidInvoices = invoices.filter((i) => i.status === 'paid');

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
      <td className="py-4 pr-4">
        <div className="font-medium text-white">{merchant.nomCommercial}</div>
        <div className="text-xs text-gray-400 mt-0.5">{merchant.nomLegal}</div>
        <div className="text-xs text-gray-500 font-mono mt-0.5">{formatSiret(merchant.siret)}</div>
      </td>
      <td className="py-4 pr-4">
        <StatusBadge status={merchant.status} />
      </td>
      <td className="py-4 pr-4 text-sm text-gray-300">{plan?.label ?? merchant.plan}</td>
      <td className="py-4 pr-4 text-sm text-gray-300 uppercase">{merchant.territoire}</td>
      <td className="py-4 pr-4 text-sm text-gray-400">
        {new Date(merchant.createdAt).toLocaleDateString('fr-FR')}
      </td>
      <td className="py-4 pr-4 text-sm text-gray-300">
        {paidInvoices.length} facture{paidInvoices.length !== 1 ? 's' : ''}
      </td>
      <td className="py-4">
        <div className="flex items-center gap-1 flex-wrap">
          {merchant.status === 'PENDING' && (
            <>
              <button
                onClick={() => onAction(merchant, 'APPROVE')}
                className="p-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-400 transition-colors"
                title="Approuver"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAction(merchant, 'REJECT')}
                className="p-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 transition-colors"
                title="Rejeter"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {merchant.status === 'APPROVED' && (
            <button
              onClick={() => onAction(merchant, 'SUSPEND')}
              className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors"
              title="Suspendre"
            >
              <Slash className="w-4 h-4" />
            </button>
          )}
          {(merchant.status === 'SUSPENDED' || merchant.status === 'REJECTED') && (
            <button
              onClick={() => onAction(merchant, 'REACTIVATE')}
              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition-colors"
              title="Réactiver"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onAction(merchant, 'PRICE_FLAG')}
            className="p-1.5 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 transition-colors"
            title="Signaler un prix"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function AdminMarketplace() {
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [auditLog, setAuditLog] = useState<AdminAuditLog[]>([]);
  const [filter, setFilter] = useState<MerchantStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'merchants' | 'audit' | 'stats'>('merchants');
  const [pendingAction, setPendingAction] = useState<{
    merchant: MerchantProfile;
    action: AdminActionType;
  } | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    reload();
  }, []);

  const reload = () => {
    setMerchants(getAllMerchants());
    setAuditLog(getAuditLog().slice().reverse());
    setTotalRevenue(getTotalRevenue());
  };

  const handleAction = (merchant: MerchantProfile, action: AdminActionType) => {
    setPendingAction({ merchant, action });
  };

  const handleConfirm = (reason: string) => {
    if (!pendingAction) return;
    const actingAdminId = auth?.currentUser?.uid || 'admin_platform';
    adminChangeMerchantStatus(
      pendingAction.merchant.id,
      actingAdminId,
      pendingAction.action,
      reason
    );
    setPendingAction(null);
    reload();
  };

  // ─── Filtrage ──────────────────────────────────────────────────────────────

  const filtered = merchants.filter((m) => {
    if (filter !== 'ALL' && m.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.nomCommercial.toLowerCase().includes(q) ||
        m.nomLegal.toLowerCase().includes(q) ||
        m.siret.includes(q) ||
        m.emailContact.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    ALL: merchants.length,
    PENDING: merchants.filter((m) => m.status === 'PENDING').length,
    APPROVED: merchants.filter((m) => m.status === 'APPROVED').length,
    SUSPENDED: merchants.filter((m) => m.status === 'SUSPENDED').length,
    REJECTED: merchants.filter((m) => m.status === 'REJECTED').length,
  };

  return (
    <>
      <Helmet>
        <title>Admin Marketplace — A KI PRI SA YÉ</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6">
        {/* En-tête */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Administration Marketplace</h1>
              <p className="text-gray-400 text-sm">
                Validation, modération et contrôle des enseignes
              </p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/[0.05] border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{counts.ALL}</div>
              <div className="text-sm text-gray-400">Enseignes totales</div>
            </div>
            <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-yellow-300">{counts.PENDING}</div>
              <div className="text-sm text-yellow-400/70">En attente</div>
            </div>
            <div className="bg-green-600/10 border border-green-600/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-300">{counts.APPROVED}</div>
              <div className="text-sm text-green-400/70">Approuvées</div>
            </div>
            <div className="bg-white/[0.05] border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{totalRevenue.toFixed(0)} €</div>
              <div className="text-sm text-gray-400">Revenus TTC (payés)</div>
            </div>
          </div>

          {/* Navigation onglets */}
          <div className="flex gap-2 mb-6">
            {(
              [
                { id: 'merchants', label: 'Enseignes', icon: Building2 },
                { id: 'audit', label: "Journal d'audit", icon: FileText },
                { id: 'stats', label: 'Statistiques', icon: BarChart3 },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/[0.05] text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ── Onglet Enseignes ── */}
          {activeTab === 'merchants' && (
            <>
              {/* Filtres */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Rechercher enseigne, SIRET, email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/[0.07] border border-white/15 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-2">
                  {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        filter === s
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/[0.05] text-gray-400 hover:text-white'
                      }`}
                    >
                      {s === 'ALL' ? `Toutes (${counts.ALL})` : `${s} (${counts[s]})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tableau */}
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune enseigne{filter !== 'ALL' ? ` avec le statut ${filter}` : ''}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 text-left text-sm">
                        <th className="pb-3 font-medium">Enseigne</th>
                        <th className="pb-3 font-medium">Statut</th>
                        <th className="pb-3 font-medium">Plan</th>
                        <th className="pb-3 font-medium">Territoire</th>
                        <th className="pb-3 font-medium">Inscrit le</th>
                        <th className="pb-3 font-medium">Factures</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((m) => (
                        <MerchantRow key={m.id} merchant={m} onAction={handleAction} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── Onglet Journal d'audit ── */}
          {activeTab === 'audit' && (
            <div>
              <p className="text-gray-400 text-sm mb-4">
                Journal immuable de toutes les actions admin. Chaque entrée est horodatée et
                conservée définitivement.
              </p>
              {auditLog.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Aucune action enregistrée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLog.map((log) => {
                    const m = merchants.find((x) => x.id === log.merchantId);
                    return (
                      <div
                        key={log.id}
                        className="bg-white/[0.04] border border-white/10 rounded-xl p-4 flex items-start gap-4 text-sm"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-medium">{log.actionType}</span>
                            <span className="text-gray-500">→</span>
                            <span className="text-gray-300">
                              {m?.nomCommercial ?? log.merchantId}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {log.previousStatus} → {log.newStatus}
                            </span>
                          </div>
                          {log.reason && <p className="text-gray-400 text-xs mt-1">{log.reason}</p>}
                          <p className="text-gray-500 text-xs mt-1">
                            Admin : {log.adminId} ·{' '}
                            {new Date(log.createdAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Onglet Statistiques ── */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {MARKETPLACE_PLANS.map((plan) => {
                  const count = merchants.filter((m) => m.plan === plan.id).length;
                  return (
                    <div
                      key={plan.id}
                      className="bg-white/[0.05] border border-white/10 rounded-xl p-5"
                    >
                      <div className="text-xs text-gray-400 mb-1">{plan.label}</div>
                      <div className="text-3xl font-bold text-white">{count}</div>
                      <div className="text-sm text-gray-400">enseigne{count !== 1 ? 's' : ''}</div>
                      <div className="text-xs text-blue-400 mt-1">
                        {count > 0 ? `${(count * plan.priceMonthly).toFixed(0)} €/mois HT` : '—'}
                      </div>
                    </div>
                  );
                })}
                <div className="bg-green-600/10 border border-green-600/20 rounded-xl p-5">
                  <div className="text-xs text-green-400/70 mb-1">Revenus totaux (payés)</div>
                  <div className="text-3xl font-bold text-green-300">
                    {totalRevenue.toFixed(2)} €
                  </div>
                  <div className="text-sm text-green-400/70">TTC</div>
                </div>
              </div>

              <div className="bg-white/[0.05] border border-white/10 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Répartition par territoire</h3>
                {['gp', 'mq', 'gf', 're', 'yt', 'pf', 'nc', 'wf', 'mf', 'bl', 'pm', 'fr'].map(
                  (terr) => {
                    const count = merchants.filter((m) => m.territoire === terr).length;
                    if (count === 0) return null;
                    return (
                      <div key={terr} className="flex items-center gap-3 mb-2">
                        <span className="text-gray-400 text-sm w-12 uppercase">{terr}</span>
                        <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${(count / merchants.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-white text-sm w-8 text-right">{count}</span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal confirmation */}
      {pendingAction && (
        <ActionModal
          merchant={pendingAction.merchant}
          action={pendingAction.action}
          onConfirm={handleConfirm}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </>
  );
}
