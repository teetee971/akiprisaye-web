/**
 * Service – Compte Professionnel v1.0.0
 *
 * - Validation du numéro SIRET (algorithme de Luhn)
 * - Gestion du profil pro et des annonces (localStorage)
 * - Plans tarifaires et calcul de quota
 */

import type {
  ProProfile,
  ProPlan,
  ProPlanDetails,
  ProPriceAnnonce,
  ProRegistrationForm,
  FormeJuridique,
  SecteurActivite,
} from '../types/proAccount';
import { safeLocalStorage } from '../utils/safeLocalStorage';

// ─── Clés localStorage ───────────────────────────────────────────────────────

const STORAGE_PROFILE = 'akiprisaye_pro_profile';
const STORAGE_ANNONCES = 'akiprisaye_pro_annonces';

// ─── Plans tarifaires ────────────────────────────────────────────────────────

export const PRO_PLANS: ProPlanDetails[] = [
  {
    id: 'decouverte',
    label: 'Découverte',
    price: 0,
    priceUnit: 'gratuit',
    annoncesMax: 1,
    durationDays: 7,
    priorityDisplay: false,
    analytics: false,
    badgePro: false,
    highlight: false,
    description: 'Testez gratuitement avec une annonce pendant 7 jours.',
    features: ['1 annonce active (7 jours)', 'Fiche établissement de base', 'Visible sur la carte'],
  },
  {
    id: 'essentiel',
    label: 'Essentiel Pro',
    price: 9.99,
    priceUnit: 'mois',
    annoncesMax: 10,
    durationDays: 30,
    priorityDisplay: false,
    analytics: false,
    badgePro: true,
    highlight: false,
    description: 'Idéal pour les petits commerces et artisans.',
    features: [
      '10 annonces actives / mois',
      'Badge "Professionnel Vérifié"',
      'Fiche établissement complète',
      'Visible sur la carte interactive',
      'Renouvellement automatique',
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce Pro',
    price: 24.99,
    priceUnit: 'mois',
    annoncesMax: 50,
    durationDays: 30,
    priorityDisplay: false,
    analytics: true,
    badgePro: true,
    highlight: true,
    description: 'Pour les commerces de proximité et supérettes.',
    features: [
      '50 annonces actives / mois',
      'Badge "Professionnel Vérifié"',
      'Statistiques de consultation',
      "Priorité d'affichage dans la catégorie",
      "Logo de l'entreprise affiché",
      'Support prioritaire',
    ],
  },
  {
    id: 'franchise',
    label: 'Franchise / Enseigne',
    price: 49.99,
    priceUnit: 'mois',
    annoncesMax: null,
    durationDays: null,
    priorityDisplay: true,
    analytics: true,
    badgePro: true,
    highlight: false,
    description: 'Pour les grandes enseignes et franchises multi-sites.',
    features: [
      'Annonces illimitées',
      "Priorité d'affichage globale",
      'Statistiques avancées',
      'Multi-établissements',
      "API d'import des prix (CSV)",
      'Account manager dédié',
    ],
  },
  {
    id: 'a_la_carte',
    label: 'À la carte',
    price: 2.99,
    priceUnit: 'annonce',
    annoncesMax: null,
    durationDays: 30,
    priorityDisplay: false,
    analytics: false,
    badgePro: true,
    highlight: false,
    description: "Payez uniquement à l'annonce, sans abonnement.",
    features: [
      '2,99 € par annonce (30 jours)',
      'Badge "Professionnel Vérifié"',
      "Pas d'engagement",
      'Recharge possible à tout moment',
    ],
  },
];

// ─── Libellés ────────────────────────────────────────────────────────────────

export const FORME_JURIDIQUE_LABELS: Record<FormeJuridique, string> = {
  eurl: 'EURL',
  sarl: 'SARL',
  sas: 'SAS',
  sasu: 'SASU',
  sa: 'SA',
  ei: 'Entreprise Individuelle (EI)',
  micro: 'Micro-entreprise / Auto-entrepreneur',
  association: 'Association (loi 1901)',
  collectivite: 'Collectivité territoriale',
  sci: 'SCI',
  snc: 'SNC',
  autre: 'Autre forme juridique',
};

export const SECTEUR_LABELS: Record<SecteurActivite, string> = {
  alimentation_grande_surface: 'Grande surface alimentaire',
  alimentation_epicerie: 'Épicerie / Commerce de proximité',
  boulangerie_patisserie: 'Boulangerie / Pâtisserie',
  boucherie_charcuterie: 'Boucherie / Charcuterie',
  fruits_legumes: 'Fruits & Légumes',
  poissonnerie: 'Poissonnerie',
  restauration: 'Restauration',
  pharmacie_parapharmacie: 'Pharmacie / Parapharmacie',
  materiel_bricolage: 'Matériaux / Bricolage',
  jardinerie: 'Jardinerie / Horticulture',
  habillement_textile: 'Habillement / Textile',
  electronique_informatique: 'Électronique / Informatique',
  automobile_transport: 'Automobile / Transport',
  location_vehicules: 'Location de véhicules',
  services_domicile: 'Services à domicile',
  sante_bien_etre: 'Santé / Bien-être',
  education_formation: 'Éducation / Formation',
  tourisme_loisirs: 'Tourisme / Loisirs',
  immobilier: 'Immobilier',
  autre: 'Autre secteur',
};

// ─── Validation SIRET ────────────────────────────────────────────────────────

/**
 * Valide un numéro SIRET par l'algorithme de Luhn.
 * Le SIRET est composé de 14 chiffres (SIREN 9 + NIC 5).
 */
export function validateSiret(siret: string): { valid: boolean; error?: string } {
  const cleaned = siret.replace(/\s/g, '');

  if (!/^\d{14}$/.test(cleaned)) {
    return { valid: false, error: 'Le numéro SIRET doit contenir exactement 14 chiffres.' };
  }

  // Algorithme de Luhn
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleaned[i], 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  if (sum % 10 !== 0) {
    return { valid: false, error: 'Le numéro SIRET est invalide (vérification Luhn échouée).' };
  }

  return { valid: true };
}

/** Extraire le SIREN depuis un SIRET */
export function extractSiren(siret: string): string {
  return siret.replace(/\s/g, '').slice(0, 9);
}

/** Formater l'affichage du SIRET : 123 456 789 00012 */
export function formatSiret(siret: string): string {
  const s = siret.replace(/\s/g, '');
  if (s.length !== 14) return s;
  return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 9)} ${s.slice(9)}`;
}

// ─── Gestion du profil pro ───────────────────────────────────────────────────

export function saveProProfile(profile: ProProfile): void {
  safeLocalStorage.setItem(STORAGE_PROFILE, JSON.stringify(profile));
}

export function loadProProfile(): ProProfile | null {
  return safeLocalStorage.getJSON<ProProfile | null>(STORAGE_PROFILE, null);
}

export function clearProProfile(): void {
  safeLocalStorage.removeItem(STORAGE_PROFILE);
}

/** Créer un profil pro depuis le formulaire d'inscription */
export function createProProfileFromForm(form: ProRegistrationForm): ProProfile {
  const now = new Date().toISOString();
  return {
    id: `pro-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    raisonSociale: form.raisonSociale,
    siret: form.siret.replace(/\s/g, ''),
    siren: extractSiren(form.siret),
    codeApe: form.codeApe,
    formeJuridique: form.formeJuridique,
    secteurActivite: form.secteurActivite,
    nomResponsable: form.nomResponsable,
    email: form.email,
    telephone: form.telephone,
    siteWeb: form.siteWeb,
    adresse: form.adresse,
    codePostal: form.codePostal,
    ville: form.ville,
    territoire: form.territoire,
    descriptionActivite: form.descriptionActivite,
    slogan: form.slogan,
    plan: form.plan,
    annoncesActives: 0,
    annoncesTotal: 0,
    verificationStatus: 'pending',
    documents: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Gestion des annonces ────────────────────────────────────────────────────

export function loadProAnnonces(proId: string): ProPriceAnnonce[] {
  return safeLocalStorage.getJSON<ProPriceAnnonce[]>(`${STORAGE_ANNONCES}_${proId}`, []);
}

export function saveProAnnonces(proId: string, annonces: ProPriceAnnonce[]): void {
  safeLocalStorage.setItem(`${STORAGE_ANNONCES}_${proId}`, JSON.stringify(annonces));
}

/** Calculer le quota restant pour un profil */
export function getRemainingQuota(profile: ProProfile): {
  max: number | null;
  used: number;
  remaining: number | null;
  canPublish: boolean;
} {
  const plan = PRO_PLANS.find((p) => p.id === profile.plan);
  const max = plan?.annoncesMax ?? null;
  const used = profile.annoncesActives;
  const remaining = max !== null ? Math.max(0, max - used) : null;
  const canPublish = max === null || used < max;
  return { max, used, remaining, canPublish };
}

/** Créer une nouvelle annonce */
export function createAnnonce(
  proId: string,
  data: Omit<
    ProPriceAnnonce,
    'id' | 'proId' | 'createdAt' | 'updatedAt' | 'expiresAt' | 'vues' | 'statut'
  >,
  plan: ProPlan
): ProPriceAnnonce {
  const planDetails = PRO_PLANS.find((p) => p.id === plan);
  const durationDays = planDetails?.durationDays ?? 30;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 3600 * 1000).toISOString();

  return {
    ...data,
    id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    proId,
    statut: 'active',
    vues: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt,
  };
}
