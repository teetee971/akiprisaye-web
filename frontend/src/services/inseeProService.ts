/**
 * inseeProService.ts
 *
 * Service frontend pour l'intégration de l'API INSEE Sirene.
 *
 * Responsabilités :
 *  1. Appel au proxy Cloudflare /api/insee-pros-batiment
 *  2. Transformation du format INSEE → ProBatimentProfile (partiel)
 *  3. Import dans Firestore via proBatimentService
 *  4. Déduplication par SIRET
 *
 * Note légale :
 *   Les données INSEE (SIRET, raison sociale, adresse, NAF) sont des
 *   données publiques librement réutilisables (Licence Ouverte / Open
 *   Licence). Source : https://api.insee.fr/catalogue/
 *   Les données personnelles (téléphone, email) ne sont PAS fournies
 *   par l'API Sirene et ne doivent PAS être ajoutées sans consentement.
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  registerProBatiment,
  NAF_TO_METIERS,
  type MetierBatiment,
  type ProBatPlan,
  type NewProPayload,
} from '@/services/proBatimentService';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InseeEtablissement {
  siret: string;
  siren: string;
  raisonSociale: string;
  denomination: string | null;
  nomUsuel: string | null;
  nafCode: string;
  nafLibelle: string;
  formeJuridique: string;
  codeFormeJuridique: string;
  adresse: string;
  codePostal: string;
  ville: string;
  departement: string;
  dateCreation: string;
  etatAdministratif: 'A' | 'F';
  trancheEffectifs: string | null;
  telephone: null;
  siège: boolean;
}

export interface InseeSearchResult {
  total: number;
  page: number;
  perPage: number;
  results: InseeEtablissement[];
  source: 'insee_sirene_v3';
  territory: string;
  deptCode: string;
  nafCodes: string[];
  error?: string;
}

export type ImportStatus = 'new' | 'already_exists' | 'imported' | 'error';

export interface ImportResult {
  siret: string;
  raisonSociale: string;
  status: ImportStatus;
  firestoreId?: string;
  errorMsg?: string;
}

// ── Correspondance code forme juridique INSEE → label ─────────────────────────

const CODE_FORME_JURIDIQUE: Record<string, string> = {
  '1000': 'ei', // Entrepreneur individuel
  '1010': 'ei',
  '5710': 'sasu', // SAS unipersonnelle
  '5720': 'sas', // SAS
  '5498': 'sarl', // SARL
  '5499': 'eurl', // EURL
  '5308': 'sa', // SA
  '9220': 'association',
};

function mapFormeJuridique(code: string): string {
  if (!code) return 'autre';
  const found = CODE_FORME_JURIDIQUE[code];
  if (found) return found;
  // Micro / auto-entrepreneur
  if (code.startsWith('10')) return 'micro';
  return 'autre';
}

// ── Correspondance territoire DOM → code département ─────────────────────────

const DEPT_TO_TERRITOIRE: Record<string, string> = {
  '971': 'GP',
  '972': 'MQ',
  '973': 'GF',
  '974': 'RE',
  '976': 'YT',
};

// ── API call ──────────────────────────────────────────────────────────────────

/**
 * Interroge /api/insee-pros-batiment (proxy Cloudflare → INSEE Sirene).
 */
export async function searchInseeProsBatiment(params: {
  territory: string;
  naf?: string; // codes NAF filtrés (séparés virgule)
  page?: number;
  perPage?: number;
}): Promise<InseeSearchResult> {
  const url = new URL('/api/insee-pros-batiment', window.location.origin);
  url.searchParams.set('territory', params.territory.toUpperCase());
  if (params.naf) url.searchParams.set('naf', params.naf);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.perPage) url.searchParams.set('perPage', String(params.perPage));

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const err = (await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }))) as {
      error: string;
    };
    return {
      total: 0,
      page: params.page ?? 1,
      perPage: params.perPage ?? 20,
      results: [],
      source: 'insee_sirene_v3',
      territory: params.territory,
      deptCode: '',
      nafCodes: [],
      error: err.error ?? `HTTP ${resp.status}`,
    };
  }
  return resp.json() as Promise<InseeSearchResult>;
}

// ── Deduplication check ───────────────────────────────────────────────────────

/**
 * Retourne l'ensemble des SIRET déjà présents dans Firestore.
 */
export async function getExistingSirets(): Promise<Set<string>> {
  if (!db) return new Set();
  try {
    const snap = await getDocs(collection(db, 'pros_batiment'));
    return new Set(
      snap.docs.map((d) => (d.data() as { siret?: string }).siret ?? '').filter(Boolean)
    );
  } catch {
    return new Set();
  }
}

/**
 * Vérifie si un SIRET donné est déjà dans Firestore.
 */
export async function siretAlreadyExists(siret: string): Promise<boolean> {
  if (!db) return false;
  try {
    const q = query(collection(db, 'pros_batiment'), where('siret', '==', siret));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
}

// ── INSEE → ProBatiment mapping ───────────────────────────────────────────────

/**
 * Construit un `NewProPayload` minimal à partir d'un établissement INSEE.
 * Les champs non disponibles (téléphone, email, description) sont vides.
 * Le pro devra compléter son profil lors de l'inscription.
 */
export function mapInseeToProPayload(etab: InseeEtablissement): NewProPayload {
  const territoire = DEPT_TO_TERRITOIRE[etab.departement] ?? 'GP';
  const metiers =
    NAF_TO_METIERS[etab.nafCode] ?? NAF_TO_METIERS[etab.nafCode.replace('.', '')] ?? [];
  const annee = etab.dateCreation ? parseInt(etab.dateCreation.slice(0, 4), 10) : null;

  return {
    uid: 'insee_import', // sera mis à jour lors de l'inscription du pro
    siret: etab.siret,
    siren: etab.siren,
    tva: deriveTva(etab.siren),
    raisonSociale: etab.raisonSociale || etab.denomination || etab.nomUsuel || etab.siret,
    formeJuridique: mapFormeJuridique(etab.codeFormeJuridique),
    gerantPrenom: '',
    gerantNom: '',
    email: '',
    telephone: '',
    adresse: etab.adresse,
    codePostal: etab.codePostal,
    ville: etab.ville,
    territoire,
    metiers: metiers as MetierBatiment[],
    specialites: [etab.nafLibelle].filter(Boolean),
    description: `Profil pré-rempli depuis l'annuaire INSEE Sirene. Code NAF : ${etab.nafCode} — ${etab.nafLibelle}. Ce professionnel doit valider et compléter son profil.`,
    zoneIntervention: etab.ville,
    tarifHoraire: null,
    certifications: [],
    assuranceDecen: false,
    anneeCreation: isNaN(annee!) ? null : annee,
    documents: [],
    plan: 'free' as ProBatPlan,
  };
}

function deriveTva(siren: string): string {
  const n = parseInt(siren, 10);
  if (isNaN(n)) return '';
  const key = (12 + 3 * (n % 97)) % 97;
  return `FR${String(key).padStart(2, '0')}${siren}`;
}

// ── Batch import ──────────────────────────────────────────────────────────────

/**
 * Importe une liste d'établissements INSEE dans Firestore.
 * Ignore les doublons (même SIRET).
 * Retourne un rapport détaillé par établissement.
 */
export async function importInseeEtablissements(
  etabs: InseeEtablissement[],
  existingSirets?: Set<string>
): Promise<ImportResult[]> {
  const known = existingSirets ?? (await getExistingSirets());
  const results: ImportResult[] = [];

  for (const etab of etabs) {
    if (!etab.siret) {
      results.push({
        siret: '',
        raisonSociale: etab.raisonSociale,
        status: 'error',
        errorMsg: 'SIRET manquant',
      });
      continue;
    }
    if (known.has(etab.siret)) {
      results.push({
        siret: etab.siret,
        raisonSociale: etab.raisonSociale,
        status: 'already_exists',
      });
      continue;
    }

    const payload = mapInseeToProPayload(etab);
    const res = await registerProBatiment(payload);

    if (res.success) {
      known.add(etab.siret);
      results.push({
        siret: etab.siret,
        raisonSociale: etab.raisonSociale,
        status: 'imported',
        firestoreId: res.id,
      });
    } else {
      results.push({
        siret: etab.siret,
        raisonSociale: etab.raisonSociale,
        status: 'error',
        errorMsg: res.error,
      });
    }
  }

  return results;
}
