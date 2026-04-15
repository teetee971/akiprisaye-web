/**
 * AdminDevis — Interface admin de gestion du pipeline Devis IA
 *
 * Accès restreint aux administrateurs.
 * Pipeline : DRAFT → VALIDATED → SENT → ACCEPTED → PAID / CANCELLED
 *
 * ⚠️  Règle absolue : seul un humain habilité peut valider et envoyer un devis.
 *     L'IA fournit une estimation indicative uniquement.
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  FileText,
  CheckCircle,
  Send,
  XCircle,
  Eye,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  subscribeToAllDevis,
  updateDevisStatus,
  attachQuote,
  type DevisRequest,
  type DevisStatus,
  type DevisQuote,
} from '@/services/devisService';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  TYPE_BESOIN_LABELS,
  CLIENT_TYPE_LABELS,
  PROFONDEUR_LABELS,
  DELAI_LABELS,
} from '@/services/devisEstimationEngine';
import { isStaticPreviewEnv } from '@/services/admin/runtimeEnv';

const PIPELINE_ACTIONS: Partial<Record<DevisStatus, { next: DevisStatus; label: string; color: string }>> = {
  DRAFT: { next: 'VALIDATED', label: 'Valider le devis', color: 'bg-blue-600 hover:bg-blue-700' },
  VALIDATED: { next: 'SENT', label: 'Envoyer au client', color: 'bg-indigo-600 hover:bg-indigo-700' },
  SENT: { next: 'ACCEPTED', label: 'Marquer comme accepté', color: 'bg-green-600 hover:bg-green-700' },
  ACCEPTED: { next: 'PAID', label: 'Marquer comme payé', color: 'bg-emerald-600 hover:bg-emerald-700' },
};

export default function AdminDevis() {
  const isDegradedMode = isStaticPreviewEnv();
  const [user, setUser] = useState<User | null>(null);
  const [devisList, setDevisList] = useState<DevisRequest[]>([]);
  const [selected, setSelected] = useState<DevisRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<DevisStatus | 'ALL'>('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState<Partial<DevisQuote>>({});

  useEffect(() => {
    return onAuthStateChanged(auth!, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user || isDegradedMode) return;
    return subscribeToAllDevis((list) => {
      setDevisList(list);
      if (selected) {
        setSelected(list.find((d) => d.id === selected.id) ?? null);
      }
    });
  }, [user, isDegradedMode]);

  async function handleAdvance(devis: DevisRequest) {
    const action = PIPELINE_ACTIONS[devis.status];
    if (!action || !user) return;
    setActionLoading(true);
    setError(null);
    try {
      await updateDevisStatus(devis.id, action.next, user.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel(devis: DevisRequest) {
    if (!user) return;
    setActionLoading(true);
    setError(null);
    try {
      await updateDevisStatus(devis.id, 'CANCELLED', user.uid, 'Annulé par l\'administrateur');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAttachQuote() {
    if (!selected || !user || !quoteForm.descriptionMission) return;
    setActionLoading(true);
    setError(null);
    try {
      const prixHT = quoteForm.prixHT ?? selected.estimation?.prixHT ?? 0;
      const tvaRate = quoteForm.tvaRate ?? selected.estimation?.tvaRate ?? 0.085;
      const tvaAmount = Math.round(prixHT * tvaRate);
      const prixTTC = prixHT + tvaAmount;

      await attachQuote(
        selected.id,
        {
          ref: `${selected.ref}-Q1`,
          descriptionMission: quoteForm.descriptionMission ?? '',
          methodologie: quoteForm.methodologie ?? 'Analyse documentaire + collecte terrain',
          perimetre: quoteForm.perimetre ?? selected.territoire,
          livrables: quoteForm.livrables ?? ['Rapport final PDF', 'Dataset structuré'],
          delais: quoteForm.delais ?? `Livraison selon délai convenu (${DELAI_LABELS[selected.delai]})`,
          lignes: quoteForm.lignes ?? [
            {
              description: selected.typesBesoin.map((b) => TYPE_BESOIN_LABELS[b]).join(' + '),
              quantite: selected.estimation?.joursCharge ?? 1,
              prixUnitaireHT: selected.estimation?.tauxJournalier ?? prixHT,
              totalHT: prixHT,
            },
          ],
          prixHT,
          tvaRate,
          tvaAmount,
          prixTTC,
          validiteJours: quoteForm.validiteJours ?? 30,
          validiteExpire: null,
          conditions: quoteForm.conditions ?? 'Paiement à 30 jours. Acompte 30 % à la commande.',
        },
        user.uid,
      );
      setShowQuoteModal(false);
      setQuoteForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération du devis.');
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = filterStatus === 'ALL'
    ? devisList
    : devisList.filter((d) => d.status === filterStatus);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = {
    total: devisList.length,
    draft: devisList.filter((d) => d.status === 'DRAFT').length,
    paid: devisList.filter((d) => d.status === 'PAID').length,
    revenueHT: devisList
      .filter((d) => d.status === 'PAID' && d.quote)
      .reduce((sum, d) => sum + (d.quote?.prixHT ?? 0), 0),
  };

  return (
    <>
      <Helmet>
        <title>Admin — Devis IA | A KI PRI SA YÉ</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {isDegradedMode && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Mode preview statique — les devis Firestore ne sont pas disponibles dans cet environnement. Les actions de modification sont désactivées.
          </div>
        )}
        {/* Header */}
        <div className="bg-slate-900 text-white py-6 px-4">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h1 className="text-lg font-bold">Pipeline Devis IA</h1>
              <p className="text-slate-400 text-xs">Administration — Validation humaine obligatoire</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total devis', value: kpis.total, icon: FileText, color: 'text-gray-700' },
              { label: 'En attente', value: kpis.draft, icon: AlertTriangle, color: 'text-yellow-600' },
              { label: 'Payés', value: kpis.paid, icon: CheckCircle, color: 'text-green-600' },
              {
                label: 'Revenu HT payé',
                value: `${kpis.revenueHT.toLocaleString('fr-FR')} €`,
                icon: TrendingUp,
                color: 'text-indigo-600',
              },
            ].map((k) => (
              <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <k.icon className={`w-4 h-4 ${k.color}`} />
                  <p className="text-xs text-gray-500">{k.label}</p>
                </div>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex gap-2 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-5">
            {/* List */}
            <div className="w-72 flex-shrink-0 space-y-2">
              {/* Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as DevisStatus | 'ALL')}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="ALL">Tous les statuts</option>
                {(Object.keys(STATUS_LABELS) as DevisStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>

              {filtered.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-400">
                  Aucun devis
                </div>
              ) : (
                filtered.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className={`w-full text-left border rounded-xl p-3 transition
                      ${selected?.id === d.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-200'}`}
                  >
                    <p className="text-xs font-mono text-gray-400">{d.ref}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{d.organisation}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[d.status] ?? ''}`}>
                        {STATUS_LABELS[d.status] ?? d.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {d.estimation?.prixTTC ? `${d.estimation.prixTTC.toLocaleString('fr-FR')} €` : '—'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Detail */}
            {selected ? (
              <div className="flex-1 min-w-0 space-y-4">
                {/* Header */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-mono text-xs text-gray-400">{selected.ref}</p>
                      <h2 className="text-lg font-bold text-gray-900">{selected.organisation}</h2>
                      <p className="text-sm text-gray-500">
                        {CLIENT_TYPE_LABELS[selected.clientType]} · SIRET {selected.siret}
                      </p>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status] ?? ''}`}>
                      {STATUS_LABELS[selected.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-5">
                    <Row label="Contact" value={`${selected.contactNom} — ${selected.contactEmail}`} />
                    {selected.contactTel && <Row label="Téléphone" value={selected.contactTel} />}
                    <Row label="Territoire" value={selected.territoire} />
                    <Row
                      label="Besoins"
                      value={selected.typesBesoin.map((b) => TYPE_BESOIN_LABELS[b]).join(', ')}
                    />
                    <Row label="Délai" value={DELAI_LABELS[selected.delai]} />
                    <Row label="Profondeur" value={PROFONDEUR_LABELS[selected.niveauProfondeur]} />
                  </div>

                  {selected.descriptionLibre && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                      <p className="font-medium text-gray-900 mb-1">Description libre</p>
                      {selected.descriptionLibre}
                    </div>
                  )}
                </div>

                {/* Estimation IA */}
                {selected.estimation && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-sm font-semibold text-gray-900 mb-3">
                      Estimation IA — indicative (non contractuelle)
                    </p>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <EstCard label="Charge" value={`${selected.estimation.joursCharge} j`} />
                      <EstCard label="Montant HT" value={`${selected.estimation.prixHT.toLocaleString('fr-FR')} €`} />
                      <EstCard label="Montant TTC" value={`${selected.estimation.prixTTC.toLocaleString('fr-FR')} €`} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">Facteurs de calcul</p>
                      <ul className="space-y-0.5">
                        {selected.estimation.justification.map((line, i) => (
                          <li key={i} className="text-xs font-mono text-gray-600">{line}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Validated quote preview */}
                {selected.quote && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                    <p className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      Devis structuré attaché — {selected.quote.ref}
                    </p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <Row label="Mission" value={selected.quote.descriptionMission} />
                      <Row label="Livraison" value={selected.quote.delais} />
                      <Row label="HT" value={`${selected.quote.prixHT.toLocaleString('fr-FR')} €`} />
                      <Row label="TTC" value={`${selected.quote.prixTTC.toLocaleString('fr-FR')} €`} />
                      <Row label="Validité" value={`${selected.quote.validiteJours} jours`} />
                      <Row label="Conditions" value={selected.quote.conditions} />
                    </div>
                  </div>
                )}

                {/* Audit trail */}
                {selected.auditTrail.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Piste d'audit</p>
                    <ol className="relative border-l border-gray-200 ml-2 space-y-3">
                      {selected.auditTrail.map((entry, i) => (
                        <li key={i} className="ml-4">
                          <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-indigo-300 border-2 border-white" />
                          <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                          {entry.details && (
                            <p className="text-xs text-gray-500">{entry.details}</p>
                          )}
                          {entry.by && (
                            <p className="text-xs text-gray-400">par {entry.by}</p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Actions */}
                {selected.status !== 'CANCELLED' && selected.status !== 'PAID' && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wide">
                      Actions — Validation humaine obligatoire
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {selected.status === 'DRAFT' && !selected.quote && (
                        <button
                          onClick={() => setShowQuoteModal(true)}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                        >
                          <FileText className="w-4 h-4" />
                          Générer le devis structuré
                        </button>
                      )}
                      {PIPELINE_ACTIONS[selected.status] && (
                        <button
                          onClick={() => handleAdvance(selected)}
                          disabled={actionLoading || (selected.status === 'DRAFT' && !selected.quote)}
                          className={`flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${PIPELINE_ACTIONS[selected.status]?.color ?? ''}`}
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {PIPELINE_ACTIONS[selected.status]?.label}
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(selected)}
                        disabled={actionLoading}
                        className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Annuler le devis
                      </button>
                    </div>
                    {selected.status === 'DRAFT' && !selected.quote && (
                      <p className="text-xs text-amber-600 mt-2">
                        ⚠️ Générez d'abord le devis structuré avant de valider.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Eye className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">Sélectionnez un devis</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quote modal */}
        {showQuoteModal && selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Générer le devis structuré</h3>
                <p className="text-sm text-gray-500 mb-5">
                  Seul un humain habilité peut valider ce document.
                </p>

                <div className="space-y-3">
                  <Field
                    label="Description de la mission *"
                    value={quoteForm.descriptionMission ?? ''}
                    onChange={(v) => setQuoteForm((f) => ({ ...f, descriptionMission: v }))}
                    multiline
                  />
                  <Field
                    label="Méthodologie"
                    value={quoteForm.methodologie ?? ''}
                    onChange={(v) => setQuoteForm((f) => ({ ...f, methodologie: v }))}
                    multiline
                  />
                  <Field
                    label="Périmètre"
                    value={quoteForm.perimetre ?? selected.territoire}
                    onChange={(v) => setQuoteForm((f) => ({ ...f, perimetre: v }))}
                  />
                  <Field
                    label="Délai de livraison"
                    value={quoteForm.delais ?? ''}
                    onChange={(v) => setQuoteForm((f) => ({ ...f, delais: v }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Montant HT (€)"
                      value={String(quoteForm.prixHT ?? selected.estimation?.prixHT ?? '')}
                      onChange={(v) => setQuoteForm((f) => ({ ...f, prixHT: parseFloat(v) || 0 }))}
                      type="number"
                    />
                    <Field
                      label="Validité (jours)"
                      value={String(quoteForm.validiteJours ?? 30)}
                      onChange={(v) => setQuoteForm((f) => ({ ...f, validiteJours: parseInt(v) || 30 }))}
                      type="number"
                    />
                  </div>
                  <Field
                    label="Conditions de paiement"
                    value={quoteForm.conditions ?? 'Paiement à 30 jours. Acompte 30 % à la commande.'}
                    onChange={(v) => setQuoteForm((f) => ({ ...f, conditions: v }))}
                    multiline
                  />
                </div>

                {error && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => { setShowQuoteModal(false); setQuoteForm({}); }}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAttachQuote}
                    disabled={actionLoading || !quoteForm.descriptionMission}
                    className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {actionLoading ? 'Génération…' : 'Générer & Valider'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <p className="font-medium text-gray-900 text-sm leading-tight">{value}</p>
    </div>
  );
}

function EstCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  const cls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
    </div>
  );
}
