/**
 * Types – Compte Professionnel v1.0.0
 *
 * Formulaire d'inscription pro avec toutes les pièces justificatives,
 * numéro SIRET, quota d'annonces par plan tarifaire.
 */

// ─── Formes juridiques ──────────────────────────────────────────────────────

export type FormeJuridique =
  | 'eurl'
  | 'sarl'
  | 'sas'
  | 'sasu'
  | 'sa'
  | 'ei'           // Entreprise Individuelle
  | 'micro'        // Micro-entreprise / Auto-entrepreneur
  | 'association'
  | 'collectivite'
  | 'sci'
  | 'snc'
  | 'autre';

// ─── Secteurs d'activité (simplifiés DOM) ───────────────────────────────────

export type SecteurActivite =
  | 'alimentation_grande_surface'
  | 'alimentation_epicerie'
  | 'boulangerie_patisserie'
  | 'boucherie_charcuterie'
  | 'fruits_legumes'
  | 'poissonnerie'
  | 'restauration'
  | 'pharmacie_parapharmacie'
  | 'materiel_bricolage'
  | 'jardinerie'
  | 'habillement_textile'
  | 'electronique_informatique'
  | 'automobile_transport'
  | 'location_vehicules'
  | 'services_domicile'
  | 'sante_bien_etre'
  | 'education_formation'
  | 'tourisme_loisirs'
  | 'immobilier'
  | 'autre';

// ─── Plans tarifaires pro ────────────────────────────────────────────────────

export type ProPlan =
  | 'decouverte'   // Gratuit — 1 annonce / 7 jours
  | 'essentiel'    // 9,99 €/mois — 10 annonces actives
  | 'commerce'     // 24,99 €/mois — 50 annonces actives
  | 'franchise'    // 49,99 €/mois — illimité + priorité
  | 'a_la_carte';  // 2,99 €/annonce — sans abonnement

export interface ProPlanDetails {
  id: ProPlan;
  label: string;
  price: number | null;       // null = gratuit
  priceUnit: 'mois' | 'annonce' | 'gratuit';
  annoncesMax: number | null; // null = illimité
  durationDays: number | null;// durée de validité d'une annonce (null = illimité)
  priorityDisplay: boolean;
  analytics: boolean;         // accès aux statistiques de consultation
  badgePro: boolean;          // badge "Professionnel Vérifié" sur les annonces
  highlight: boolean;
  description: string;
  features: string[];
}

// ─── Statut de vérification ──────────────────────────────────────────────────

export type VerificationStatus =
  | 'pending'    // en attente de vérification
  | 'verified'   // compte vérifié
  | 'rejected'   // dossier rejeté
  | 'suspended'; // compte suspendu

// ─── Document justificatif ───────────────────────────────────────────────────

export type DocumentType =
  | 'kbis'                // Extrait KBIS (sociétés)
  | 'insee_attestation'   // Attestation INSEE / SIRET
  | 'identity'            // Pièce d'identité du gérant
  | 'rib'                 // RIB (optionnel)
  | 'urssaf'              // Attestation URSSAF (auto-entrepreneurs)
  | 'statuts'             // Statuts de la société
  | 'autre';

export interface ProDocument {
  type: DocumentType;
  filename: string;
  uploadedAt: string;    // ISO 8601
  status: 'pending' | 'accepted' | 'rejected';
  note?: string;
}

// ─── Annonce de prix pro ─────────────────────────────────────────────────────

export type AnnonceStatut = 'active' | 'expiree' | 'suspendue' | 'brouillon';

export interface ProPriceAnnonce {
  id: string;
  proId: string;
  produit: string;           // nom du produit ou service
  categorie: string;         // catégorie (alimentaire, service, etc.)
  prix: number;
  unite: string;             // Ex : "kg", "L", "pièce", "heure", "forfait"
  prixPromo?: number;        // prix promotionnel optionnel
  dateDebutPromo?: string;
  dateFinPromo?: string;
  description?: string;
  disponibilite: string;     // Ex : "En stock", "Disponible", "Sur commande"
  territoire: string;
  adresseVente: string;      // adresse ou "En ligne"
  imageUrl?: string;
  statut: AnnonceStatut;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;         // date d'expiration de l'annonce
  vues: number;              // compteur de vues
}

// ─── Profil professionnel ────────────────────────────────────────────────────

export interface ProProfile {
  id: string;

  // Informations légales
  raisonSociale: string;
  siret: string;              // 14 chiffres
  siren: string;              // 9 premiers chiffres du SIRET
  codeApe?: string;           // Code APE/NAF (ex: "4711D")
  formeJuridique: FormeJuridique;
  secteurActivite: SecteurActivite;

  // Contact
  nomResponsable: string;
  email: string;
  telephone: string;
  siteWeb?: string;

  // Adresse professionnelle
  adresse: string;
  codePostal: string;
  ville: string;
  territoire: string;

  // Présentation
  descriptionActivite: string;
  logoUrl?: string;
  slogan?: string;

  // Plan & Quota
  plan: ProPlan;
  annoncesActives: number;
  annoncesTotal: number;      // total créées depuis l'ouverture du compte

  // Statut
  verificationStatus: VerificationStatus;
  documents: ProDocument[];

  // Métadonnées
  createdAt: string;
  updatedAt: string;
}

// ─── Formulaire d'inscription ────────────────────────────────────────────────

export interface ProRegistrationForm {
  // Étape 1 — Informations légales
  raisonSociale: string;
  siret: string;
  formeJuridique: FormeJuridique;
  secteurActivite: SecteurActivite;
  codeApe?: string;

  // Étape 2 — Contact & coordonnées
  nomResponsable: string;
  email: string;
  password: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  territoire: string;
  siteWeb?: string;

  // Étape 3 — Présentation
  descriptionActivite: string;
  slogan?: string;

  // Étape 4 — Plan & Engagement
  plan: ProPlan;
  acceptesCGU: boolean;
  acceptesConfidentialite: boolean;
}
