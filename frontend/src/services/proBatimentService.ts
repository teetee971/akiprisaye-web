/**
 * proBatimentService.ts
 *
 * Marketplace des professionnels du bâtiment
 *
 * Collection Firestore : pros_batiment
 * Document ProBatiment :
 *   uid              string        Firebase Auth uid
 *   siret            string        SIRET 14 chiffres (validé Luhn)
 *   siren            string        9 premiers chiffres
 *   tva              string        numéro TVA FR calculé
 *   raisonSociale    string        nom légal de l'entreprise
 *   formeJuridique   string        eurl | sarl | micro | ei | ...
 *   gerantPrenom     string
 *   gerantNom        string
 *   email            string
 *   telephone        string
 *   adresse          string
 *   codePostal       string
 *   ville            string
 *   territoire       string        GP | MQ | RE | GF | YT | ...
 *   metiers          string[]      liste des corps de métier
 *   specialites      string[]      spécialités détaillées
 *   description      string        présentation libre
 *   zoneIntervention string[]      villes / zones couvertes
 *   tarifHoraire     number|null   tarif moyen HT (€/h)
 *   certifications   string[]      RGE, Qualibat, label...
 *   assuranceDecen   boolean       assurance décennale obligatoire
 *   anneeCreation    number|null
 *   documents        DocRecord[]   KBIS, identité, assurance...
 *   status           ProBatStatus  pending | verified | rejected | suspended
 *   verifiedAt       Timestamp|null
 *   verifiedBy       string|null   uid admin
 *   adminNote        string|null
 *   plan             ProBatPlan    free | essentiel | premium
 *   planActiveSince  Timestamp|null
 *   commissionRate   number        % commission sur devis (défaut 5)
 *   totalContacts    number        nb de contacts envoyés par clients
 *   createdAt        Timestamp
 *   updatedAt        Timestamp
 *
 * Collection Firestore : contacts_pros_batiment
 * (enregistrement des mises en relation + facturation commission)
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COL_PROS     = 'pros_batiment';
const COL_CONTACTS = 'contacts_pros_batiment';

// ── Enumerations ──────────────────────────────────────────────────────────────

export type ProBatStatus = 'pending' | 'verified' | 'rejected' | 'suspended';
export type ProBatPlan   = 'free' | 'essentiel' | 'premium';

export type MetierBatiment =
  | 'maconnerie'          | 'beton_dalle'       | 'fondations'
  | 'couverture_toiture'  | 'charpente'         | 'isolation'
  | 'plomberie'           | 'electricite'       | 'climatisation_vmc'
  | 'carrelage_faience'   | 'peinture_enduit'   | 'menuiserie'
  | 'serrurerie_metal'    | 'vitrerie'          | 'terrassement'
  | 'cloture_portail'     | 'jardinage_espaces_verts' | 'piscine'
  | 'demolition'          | 'autre';

// ── Labels ────────────────────────────────────────────────────────────────────

export const METIER_LABELS: Record<MetierBatiment, string> = {
  maconnerie:              '🧱 Maçonnerie',
  beton_dalle:             '🏗️ Béton & Dalle',
  fondations:              '⚓ Fondations & Terrassement',
  couverture_toiture:      '🏠 Couverture & Toiture',
  charpente:               '🪵 Charpente',
  isolation:               '🌡️ Isolation',
  plomberie:               '🔧 Plomberie & Sanitaire',
  electricite:             '⚡ Électricité',
  climatisation_vmc:       '🌀 Climatisation & VMC',
  carrelage_faience:       '🟫 Carrelage & Faïence',
  peinture_enduit:         '🎨 Peinture & Enduit',
  menuiserie:              '🚪 Menuiserie (portes, fenêtres)',
  serrurerie_metal:        '🔩 Serrurerie & Métallerie',
  vitrerie:                '🪟 Vitrerie & Miroiterie',
  terrassement:            '⛏️ Terrassement & VRD',
  cloture_portail:         '🚧 Clôture & Portail',
  jardinage_espaces_verts: '🌿 Jardinage & Espaces verts',
  piscine:                 '🏊 Piscine & Spa',
  demolition:              '💥 Démolition & Débarras',
  autre:                   '🔨 Autre corps de métier',
};

export const STATUT_LABELS: Record<ProBatStatus, string> = {
  pending:   '⏳ En attente de vérification',
  verified:  '✅ Professionnel vérifié',
  rejected:  '❌ Dossier refusé',
  suspended: '🔒 Compte suspendu',
};

export const STATUT_COLORS: Record<ProBatStatus, string> = {
  pending:   'bg-yellow-900/30 text-yellow-300 border-yellow-500/30',
  verified:  'bg-green-900/30 text-green-300 border-green-500/30',
  rejected:  'bg-red-900/30 text-red-300 border-red-500/30',
  suspended: 'bg-slate-800/60 text-slate-400 border-slate-600/30',
};

export const PLAN_LABELS: Record<ProBatPlan, string> = {
  free:      '🆓 Gratuit (1 service)',
  essentiel: '⭐ Essentiel — 14,90 €/mois',
  premium:   '💎 Premium — 29,90 €/mois',
};

export const PLAN_FEATURES: Record<ProBatPlan, string[]> = {
  free: [
    '1 service publié',
    'Fiche de base dans l\'annuaire',
    'Visible sur la carte',
    'Badge "Pro Bâtiment" en attente de vérification',
  ],
  essentiel: [
    'Jusqu\'à 5 services publiés',
    'Badge "Pro Vérifié ✅"',
    'Mise en avant dans l\'annuaire',
    'Alertes contacts par email',
    'Commission 5% sur devis accepté',
    'Statistiques de visibilité',
  ],
  premium: [
    'Services illimités',
    'Badge "Premium 💎" prioritaire',
    'En tête de liste dans l\'annuaire',
    'Commission réduite 3% sur devis accepté',
    'Analytics avancées',
    'Lien direct vers votre site / WhatsApp',
    'Support prioritaire A KI PRI SA YÉ',
  ],
};

export const COMMISSION_RATES: Record<ProBatPlan, number> = {
  free:      0,    // pas de commission → pas de contacts tracés
  essentiel: 5,    // 5% sur devis accepté
  premium:   3,    // 3% sur devis accepté
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DocRecord {
  type: 'kbis_insee' | 'identite' | 'assurance_decennale' | 'rge' | 'rib' | 'attestation_urssaf' | 'autre';
  label: string;
  fileName: string;
  uploadedAt: string; // ISO
  status: 'pending' | 'validated' | 'rejected';
}

export interface ProBatimentProfile {
  id: string;
  uid: string;
  siret: string;
  siren: string;
  tva: string;
  raisonSociale: string;
  formeJuridique: string;
  gerantPrenom: string;
  gerantNom: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  territoire: string;
  metiers: MetierBatiment[];
  specialites: string[];
  description: string;
  zoneIntervention: string;
  tarifHoraire: number | null;
  certifications: string[];
  assuranceDecen: boolean;
  anneeCreation: number | null;
  documents: DocRecord[];
  status: ProBatStatus;
  verifiedAt: { seconds: number } | null;
  verifiedBy: string | null;
  adminNote: string | null;
  plan: ProBatPlan;
  planActiveSince: { seconds: number } | null;
  commissionRate: number;
  totalContacts: number;
  createdAt: { seconds: number } | null;
  updatedAt: { seconds: number } | null;
}

export interface ProContactRecord {
  id: string;
  proId: string;
  proName: string;
  clientUserId: string; // 'anonymous' if not connected
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  message: string;
  territory: string;
  metier: MetierBatiment;
  devisEstimate: number | null;  // montant devis déclaré
  commissionDue: number | null;  // commission plateforme calculée
  status: 'new' | 'contacted' | 'devis_sent' | 'accepted' | 'paid' | 'cancelled';
  createdAt: { seconds: number } | null;
}

// ── SIRET helpers ──────────────────────────────────────────────────────────────

export function validateSiretLuhn(siret: string): boolean {
  const cleaned = siret.replace(/\s/g, '');
  if (!/^\d{14}$/.test(cleaned)) return false;
  let total = 0;
  for (let i = 0; i < 14; i++) {
    let d = parseInt(cleaned[i], 10);
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    total += d;
  }
  return total % 10 === 0;
}

export function sirenFromSiret(siret: string): string {
  return siret.replace(/\s/g, '').slice(0, 9);
}

export function tvaFromSiren(siren: string): string {
  const n = parseInt(siren, 10);
  if (isNaN(n)) return '';
  const key = (12 + 3 * (n % 97)) % 97;
  return `FR${String(key).padStart(2, '0')}${siren}`;
}

export function formatSiret(siret: string): string {
  const c = siret.replace(/\s/g, '');
  return `${c.slice(0, 3)} ${c.slice(3, 6)} ${c.slice(6, 9)} ${c.slice(9)}`.trim();
}

// ── Write ─────────────────────────────────────────────────────────────────────

export type NewProPayload = Omit<ProBatimentProfile, 'id' | 'status' | 'verifiedAt' | 'verifiedBy' | 'adminNote' | 'totalContacts' | 'createdAt' | 'updatedAt' | 'commissionRate' | 'planActiveSince'>;

export async function registerProBatiment(
  payload: NewProPayload,
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!db) return { success: false, error: 'Firebase non disponible' };
  try {
    const ref = await addDoc(collection(db, COL_PROS), {
      ...payload,
      status: 'pending' as ProBatStatus,
      verifiedAt: null,
      verifiedBy: null,
      adminNote: null,
      commissionRate: COMMISSION_RATES[payload.plan],
      totalContacts: 0,
      planActiveSince: payload.plan !== 'free' ? serverTimestamp() : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateProStatus(
  id: string,
  status: ProBatStatus,
  adminNote?: string,
  verifiedByUid?: string,
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COL_PROS, id), {
    status,
    adminNote: adminNote ?? null,
    verifiedAt: status === 'verified' ? serverTimestamp() : null,
    verifiedBy: status === 'verified' ? (verifiedByUid ?? null) : null,
    updatedAt: serverTimestamp(),
  });
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getAllProsBatiment(): Promise<ProBatimentProfile[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, COL_PROS), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProBatimentProfile));
  } catch { return []; }
}

export async function getVerifiedProsByTerritory(territory: string): Promise<ProBatimentProfile[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, COL_PROS),
      where('status', '==', 'verified'),
      where('territoire', '==', territory),
      orderBy('plan', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProBatimentProfile));
  } catch { return []; }
}

export async function getProById(id: string): Promise<ProBatimentProfile | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, COL_PROS, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as ProBatimentProfile;
  } catch { return null; }
}

// ── Contact / Commission ──────────────────────────────────────────────────────

export async function recordProContact(
  payload: Omit<ProContactRecord, 'id' | 'status' | 'commissionDue' | 'createdAt'>,
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!db) return { success: false, error: 'Firebase non disponible' };
  try {
    // Retrieve commission rate from pro profile
    const pro = await getProById(payload.proId);
    const rate = pro?.commissionRate ?? 5;
    const commissionDue = payload.devisEstimate != null
      ? Math.round(payload.devisEstimate * rate) / 100
      : null;

    const ref = await addDoc(collection(db, COL_CONTACTS), {
      ...payload,
      commissionDue,
      status: 'new' as ProContactRecord['status'],
      createdAt: serverTimestamp(),
    });

    // Increment contact counter on pro profile
    if (pro) {
      await updateDoc(doc(db, COL_PROS, payload.proId), {
        totalContacts: increment(1),
      });
    }

    return { success: true, id: ref.id };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getAllContacts(): Promise<ProContactRecord[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, COL_CONTACTS), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProContactRecord));
  } catch { return []; }
}
