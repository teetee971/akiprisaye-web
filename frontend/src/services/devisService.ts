/**
 * Devis IA Service — Module Devis IA Automatique + Paiement Direct
 *
 * Stockage Firestore :
 *   devis/{devisId}
 *     ref:              string        (ex. DEVIS-20260308-0001)
 *     status:           DevisStatus
 *     clientType:       ClientType
 *     organisation:     string
 *     siret:            string
 *     contactNom:       string
 *     contactEmail:     string
 *     contactTel:       string
 *     territoire:       string
 *     typesBesoin:      TypeBesoin[]
 *     delai:            DelaiSouhaite
 *     niveauProfondeur: NiveauProfondeur
 *     descriptionLibre: string
 *     estimation:       DevisEstimation   (moteur IA — non contractuel)
 *     quote:            DevisQuote | null  (devis structuré validé humainement)
 *     paiement:         DevisPaiement | null
 *     createdAt:        Timestamp
 *     updatedAt:        Timestamp
 *     createdBy:        string  (uid ou "anonymous")
 *     validatedBy:      string | null  (uid admin)
 *     validatedAt:      Timestamp | null
 *     auditTrail:       DevisAuditEntry[]
 *
 *   devis/{devisId}/messages/{msgId}   → liaison messagerie interne
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ── Enumerations ──────────────────────────────────────────────────────────────

export type DevisStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'SENT'
  | 'ACCEPTED'
  | 'PAID'
  | 'CANCELLED';

export type ClientType =
  | 'collectivite'
  | 'ministere'
  | 'association'
  | 'franchise'
  | 'cabinet'
  | 'autre';

export type TypeBesoin =
  | 'analyse_prix'
  | 'etude_territoriale'
  | 'audit_vie_chere'
  | 'rapport_institutionnel'
  | 'acces_donnees';

export type DelaiSouhaite = 'urgent' | '1_semaine' | '2_semaines' | '1_mois' | 'flexible';

export type NiveauProfondeur = 'leger' | 'standard' | 'approfondi' | 'exhaustif';

export type ModePaiement = 'carte' | 'virement';

// ── Sub-types ─────────────────────────────────────────────────────────────────

export interface DevisEstimation {
  /** IA estimate only — NOT a legal commitment */
  joursCharge: number;
  tauxJournalier: number;
  prixHT: number;
  tvaRate: number;        // e.g. 0.085 for DOM 8.5%
  prixTTC: number;
  justification: string[];  // explainable AI: list of cost factors
  generatedAt: Timestamp | null;
  /** Explicit disclaimer — IA n'engage pas juridiquement la plateforme */
  disclaimer: string;
}

export interface DevisLigneDetail {
  description: string;
  quantite: number;
  prixUnitaireHT: number;
  totalHT: number;
}

export interface DevisQuote {
  /** Devis structuré — seul le devis signé par un humain est contractuel */
  ref: string;
  descriptionMission: string;
  methodologie: string;
  perimetre: string;
  livrables: string[];
  delais: string;
  lignes: DevisLigneDetail[];
  prixHT: number;
  tvaRate: number;
  tvaAmount: number;
  prixTTC: number;
  validiteJours: number;
  validiteExpire: Timestamp | null;
  conditions: string;
  buildAt: Timestamp | null;
}

export interface DevisPaiement {
  mode: ModePaiement;
  montantTTC: number;
  statut: 'en_attente' | 'traite' | 'echec' | 'rembourse';
  transactionRef: string | null;
  factureRef: string | null;
  paidAt: Timestamp | null;
}

export interface DevisAuditEntry {
  action: string;
  by: string;         // uid or "system"
  at: Timestamp | null;
  details?: string;
}

// ── Main document type ────────────────────────────────────────────────────────

export interface DevisRequest {
  id: string;
  ref: string;
  status: DevisStatus;
  clientType: ClientType;
  organisation: string;
  siret: string;
  contactNom: string;
  contactEmail: string;
  contactTel: string;
  territoire: string;
  typesBesoin: TypeBesoin[];
  delai: DelaiSouhaite;
  niveauProfondeur: NiveauProfondeur;
  descriptionLibre: string;
  estimation: DevisEstimation | null;
  quote: DevisQuote | null;
  paiement: DevisPaiement | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
  validatedBy: string | null;
  validatedAt: Timestamp | null;
  auditTrail: DevisAuditEntry[];
}

// ── Firestore helpers ─────────────────────────────────────────────────────────

const COLLECTION = 'devis';

function mapDoc(id: string, data: Record<string, any>): DevisRequest {
  return {
    id,
    ref: data.ref ?? '',
    status: data.status ?? 'DRAFT',
    clientType: data.clientType ?? 'autre',
    organisation: data.organisation ?? '',
    siret: data.siret ?? '',
    contactNom: data.contactNom ?? '',
    contactEmail: data.contactEmail ?? '',
    contactTel: data.contactTel ?? '',
    territoire: data.territoire ?? '',
    typesBesoin: data.typesBesoin ?? [],
    delai: data.delai ?? 'flexible',
    niveauProfondeur: data.niveauProfondeur ?? 'standard',
    descriptionLibre: data.descriptionLibre ?? '',
    estimation: data.estimation ?? null,
    quote: data.quote ?? null,
    paiement: data.paiement ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    createdBy: data.createdBy ?? 'anonymous',
    validatedBy: data.validatedBy ?? null,
    validatedAt: data.validatedAt ?? null,
    auditTrail: data.auditTrail ?? [],
  };
}

function generateRef(index: number): string {
  const date = new Date();
  const ymd =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  return `DEVIS-${ymd}-${String(index).padStart(4, '0')}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create a new DRAFT devis request.
 * AI estimation is computed client-side and stored with an explicit disclaimer.
 * No legal commitment is created at this stage.
 */
export async function createDevisRequest(
  payload: Omit<DevisRequest, 'id' | 'ref' | 'status' | 'quote' | 'paiement' | 'createdAt' | 'updatedAt' | 'validatedBy' | 'validatedAt' | 'auditTrail'>,
): Promise<string> {
  if (!db) throw new Error('Firebase non initialisé');

  // Count existing devis to generate sequential ref
  const snap = await getDocs(collection(db, COLLECTION));
  const ref = generateRef(snap.size + 1);

  const entry: DevisAuditEntry = {
    action: 'CREATED',
    by: payload.createdBy,
    at: null, // will be set server-side via serverTimestamp()
    details: 'Demande de devis soumise',
  };

  const docRef = await addDoc(collection(db, COLLECTION), {
    ...payload,
    ref,
    status: 'DRAFT' as DevisStatus,
    quote: null,
    paiement: null,
    validatedBy: null,
    validatedAt: null,
    auditTrail: [{ ...entry, at: serverTimestamp() }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/** Fetch a single devis by Firestore document ID */
export async function getDevisById(devisId: string): Promise<DevisRequest | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTION, devisId));
  if (!snap.exists()) return null;
  return mapDoc(snap.id, snap.data() as Record<string, any>);
}

/** Fetch all devis for a given user (client view) */
export async function getDevisByUser(uid: string): Promise<DevisRequest[]> {
  if (!db) return [];
  const q = query(
    collection(db, COLLECTION),
    where('createdBy', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, any>));
}

/** Real-time subscription to a user's devis list */
export function subscribeToUserDevis(
  uid: string,
  onUpdate: (devis: DevisRequest[]) => void,
): Unsubscribe {
  if (!db) {
    onUpdate([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where('createdBy', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, any>)));
  });
}

/** Real-time subscription to ALL devis (admin view) */
export function subscribeToAllDevis(
  onUpdate: (devis: DevisRequest[]) => void,
): Unsubscribe {
  if (!db) {
    onUpdate([]);
    return () => {};
  }
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, any>)));
  });
}

/** Admin: transition devis status with audit trail */
export async function updateDevisStatus(
  devisId: string,
  newStatus: DevisStatus,
  adminUid: string,
  details?: string,
): Promise<void> {
  if (!db) throw new Error('Firebase non initialisé');
  const entry: DevisAuditEntry = {
    action: `STATUS_${newStatus}`,
    by: adminUid,
    at: null,
    details: details ?? `Statut passé à ${newStatus}`,
  };
  const update: Record<string, any> = {
    status: newStatus,
    updatedAt: serverTimestamp(),
    auditTrail: arrayUnion({ ...entry, at: serverTimestamp() }),
  };
  if (newStatus === 'VALIDATED') {
    update.validatedBy = adminUid;
    update.validatedAt = serverTimestamp();
  }
  await updateDoc(doc(db, COLLECTION, devisId), update);
}

/** Admin: attach validated quote document */
export async function attachQuote(
  devisId: string,
  quote: Omit<DevisQuote, 'buildAt'>,
  adminUid: string,
): Promise<void> {
  if (!db) throw new Error('Firebase non initialisé');
  const entry: DevisAuditEntry = {
    action: 'QUOTE_BUILT',
    by: adminUid,
    at: null,
    details: `Devis structuré ${quote.ref} généré`,
  };
  await updateDoc(doc(db, COLLECTION, devisId), {
    quote: { ...quote, buildAt: serverTimestamp() },
    status: 'VALIDATED' as DevisStatus,
    validatedBy: adminUid,
    validatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    auditTrail: arrayUnion({ ...entry, at: serverTimestamp() }),
  });
}

/** Client: accept a sent devis (legal acceptance) */
export async function acceptDevis(
  devisId: string,
  clientUid: string,
): Promise<void> {
  if (!db) throw new Error('Firebase non initialisé');
  const entry: DevisAuditEntry = {
    action: 'ACCEPTED',
    by: clientUid,
    at: null,
    details: 'Devis accepté par le client — acceptation contractuelle',
  };
  await updateDoc(doc(db, COLLECTION, devisId), {
    status: 'ACCEPTED' as DevisStatus,
    updatedAt: serverTimestamp(),
    auditTrail: arrayUnion({ ...entry, at: serverTimestamp() }),
  });
}

/** Client/System: record payment */
export async function recordPayment(
  devisId: string,
  paiement: Omit<DevisPaiement, 'paidAt'>,
  actorUid: string,
): Promise<void> {
  if (!db) throw new Error('Firebase non initialisé');
  const entry: DevisAuditEntry = {
    action: 'PAID',
    by: actorUid,
    at: null,
    details: `Paiement ${paiement.mode} — réf. ${paiement.transactionRef ?? 'N/A'}`,
  };
  await updateDoc(doc(db, COLLECTION, devisId), {
    paiement: { ...paiement, paidAt: serverTimestamp() },
    status: 'PAID' as DevisStatus,
    updatedAt: serverTimestamp(),
    auditTrail: arrayUnion({ ...entry, at: serverTimestamp() }),
  });
}

/** Cancel a devis */
export async function cancelDevis(
  devisId: string,
  actorUid: string,
  motif: string,
): Promise<void> {
  if (!db) throw new Error('Firebase non initialisé');
  const entry: DevisAuditEntry = {
    action: 'CANCELLED',
    by: actorUid,
    at: null,
    details: motif,
  };
  await updateDoc(doc(db, COLLECTION, devisId), {
    status: 'CANCELLED' as DevisStatus,
    updatedAt: serverTimestamp(),
    auditTrail: arrayUnion({ ...entry, at: serverTimestamp() }),
  });
}
