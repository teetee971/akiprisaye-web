/**
 * DevisTracking — Tableau de bord de suivi devis pour le client
 *
 * Affiche l'état du pipeline de devis de l'utilisateur connecté :
 *   DRAFT → VALIDATED → SENT → ACCEPTED → PAID
 *
 * Chaque devis peut être consulté en détail avec son historique d'audit.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  AlertTriangle,
  Send,
  CreditCard,
  Eye,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  subscribeToUserDevis,
  acceptDevis,
  type DevisRequest,
  type DevisStatus,
} from '@/services/devisService';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  TYPE_BESOIN_LABELS,
  CLIENT_TYPE_LABELS,
  DELAI_LABELS,
  PROFONDEUR_LABELS,
} from '@/services/devisEstimationEngine';
import { HeroImage } from '@/components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '@/config/imageAssets';

// ── Status pipeline config ────────────────────────────────────────────────────

const PIPELINE: { status: DevisStatus; label: string; icon: React.ElementType }[] = [
  { status: 'DRAFT', label: 'Reçu', icon: FileText },
  { status: 'VALIDATED', label: 'Validé', icon: CheckCircle },
  { status: 'SENT', label: 'Envoyé', icon: Send },
  { status: 'ACCEPTED', label: 'Accepté', icon: CheckCircle },
  { status: 'PAID', label: 'Payé', icon: CreditCard },
];

const STATUS_ORDER: Record<DevisStatus, number> = {
  DRAFT: 0,
  VALIDATED: 1,
  SENT: 2,
  ACCEPTED: 3,
  PAID: 4,
  CANCELLED: -1,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DevisTracking() {
  const { devisId } = useParams<{ devisId?: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [devisList, setDevisList] = useState<DevisRequest[]>([]);
  const [selected, setSelected] = useState<DevisRequest | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth!, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserDevis(user.uid, (list) => {
      setDevisList(list);
      if (devisId) {
        setSelected(list.find((d) => d.id === devisId) ?? null);
      }
    });
    return unsub;
  }, [user, devisId]);

  async function handleAccept() {
    if (!selected || !user) return;
    setAccepting(true);
    setError(null);
    try {
      await acceptDevis(selected.id, user.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'acceptation.');
    } finally {
      setAccepting(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
          <FileText className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Connexion requise</h1>
          <p className="text-sm text-gray-500 mb-4">
            Connectez-vous pour accéder à vos devis.
          </p>
          <Link
            to="/login"
            className="block bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mes Devis — A KI PRI SA YÉ</title>
      </Helmet>

      <HeroImage
        src={PAGE_HERO_IMAGES.devisTracking}
        alt="Suivi de devis"
        gradient="from-slate-950 to-violet-900"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>📋 Suivi de devis</h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Suivez l'avancement de vos devis</p>
      </HeroImage>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
          {/* Left: list */}
          <div className="w-64 flex-shrink-0 space-y-2">
            {devisList.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-sm text-gray-500">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                Aucun devis pour l'instant.
              </div>
            ) : (
              devisList.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className={`w-full text-left border rounded-xl p-3 transition
                    ${selected?.id === d.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                >
                  <p className="text-xs font-mono text-gray-500 mb-0.5">{d.ref}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{d.organisation}</p>
                  <div className="mt-1">
                    <StatusBadge status={d.status} />
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Right: detail */}
          {selected ? (
            <div className="flex-1 min-w-0 space-y-4">
              {/* Pipeline */}
              {selected.status !== 'CANCELLED' && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wide">
                    Progression
                  </p>
                  <div className="flex items-center gap-0">
                    {PIPELINE.map((step, idx) => {
                      const current = STATUS_ORDER[selected.status];
                      const done = STATUS_ORDER[step.status] <= current;
                      const active = step.status === selected.status;
                      return (
                        <div key={step.status} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center
                                ${done
                                  ? active
                                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                                    : 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-400'}`}
                            >
                              <step.icon className="w-4 h-4" />
                            </div>
                            <span className={`text-xs mt-1 text-center ${active ? 'text-indigo-700 font-semibold' : 'text-gray-400'}`}>
                              {step.label}
                            </span>
                          </div>
                          {idx < PIPELINE.length - 1 && (
                            <div
                              className={`flex-1 h-0.5 mx-1 mb-4 ${
                                STATUS_ORDER[step.status] < current
                                  ? 'bg-indigo-600'
                                  : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selected.status === 'CANCELLED' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-2 text-red-700 text-sm">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Ce devis a été annulé.
                </div>
              )}

              {/* Summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-mono text-xs text-gray-500">{selected.ref}</p>
                    <h2 className="text-lg font-bold text-gray-900">{selected.organisation}</h2>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <Row label="Type" value={CLIENT_TYPE_LABELS[selected.clientType] ?? selected.clientType} />
                  <Row label="Territoire" value={selected.territoire} />
                  <Row
                    label="Besoins"
                    value={selected.typesBesoin.map((b) => TYPE_BESOIN_LABELS[b]).join(', ')}
                  />
                  <Row label="Délai" value={DELAI_LABELS[selected.delai]} />
                  <Row label="Profondeur" value={PROFONDEUR_LABELS[selected.niveauProfondeur]} />
                  <Row label="Contact" value={`${selected.contactNom} — ${selected.contactEmail}`} />
                </div>
              </div>

              {/* AI Estimation */}
              {selected.estimation && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Estimation IA (indicative)
                  </p>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <EstCard label="Charge" value={`${selected.estimation.joursCharge} j`} />
                    <EstCard label="Montant HT" value={`${selected.estimation.prixHT.toLocaleString('fr-FR')} €`} />
                    <EstCard label="Montant TTC" value={`${selected.estimation.prixTTC.toLocaleString('fr-FR')} €`} />
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                    {selected.estimation.disclaimer}
                  </div>
                </div>
              )}

              {/* Validated quote */}
              {selected.quote && (
                <div className="bg-white border border-green-200 rounded-xl p-5">
                  <p className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Devis structuré — {selected.quote.ref}
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
                    <Row label="Mission" value={selected.quote.descriptionMission} />
                    <Row label="Délai livraison" value={selected.quote.delais} />
                    <Row label="Montant HT" value={`${selected.quote.prixHT.toLocaleString('fr-FR')} €`} />
                    <Row label="TVA" value={`${(selected.quote.tvaRate * 100).toFixed(1)} %`} />
                    <Row label="Montant TTC" value={`${selected.quote.prixTTC.toLocaleString('fr-FR')} €`} />
                    <Row label="Validité" value={`${selected.quote.validiteJours} jours`} />
                  </div>

                  {selected.status === 'SENT' && (
                    <>
                      {error && (
                        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          {error}
                        </div>
                      )}
                      <button
                        onClick={handleAccept}
                        disabled={accepting}
                        className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition"
                      >
                        {accepting ? 'En cours…' : 'Accepter ce devis — Engagement contractuel'}
                      </button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        L'acceptation constitue un engagement contractuel. Le paiement sera traité séparément.
                      </p>
                    </>
                  )}

                  {selected.status === 'ACCEPTED' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      Devis accepté. Votre contact prendra en charge le règlement selon les modalités convenues.
                    </div>
                  )}
                </div>
              )}

              {/* Audit trail */}
              {selected.auditTrail.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Historique</p>
                  <ol className="relative border-l border-gray-200 ml-2 space-y-3">
                    {selected.auditTrail.map((entry, i) => (
                      <li key={i} className="ml-4">
                        <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-indigo-300 border-2 border-white" />
                        <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                        {entry.details && (
                          <p className="text-xs text-gray-500">{entry.details}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Eye className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Sélectionnez un devis pour voir les détails</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DevisStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-500 text-xs">{label}</span>
      <p className="text-gray-900 font-medium leading-tight">{value}</p>
    </div>
  );
}

function EstCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="font-bold text-gray-900 text-sm">{value}</p>
    </div>
  );
}
