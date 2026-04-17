/**
 * Types — Marketplace Payante des Enseignes v1.0.0
 *
 * Module Marketplace pour les enseignes, franchises et commerces
 * des territoires ultramarins français (DOM, ROM, COM).
 *
 * Règles métier :
 * - Pas de données fictives
 * - Toute modification de prix est historisée
 * - Une enseigne ne peut modifier QUE ses propres données
 */

import type { TerritoryCode } from '../constants/territories';

// ─── Statut d'approbation enseigne ───────────────────────────────────────────

export type MerchantStatus =
  | 'PENDING' // En attente de validation admin
  | 'APPROVED' // Compte approuvé et actif
  | 'SUSPENDED' // Compte suspendu par la plateforme
  | 'REJECTED'; // Dossier rejeté (à recompléter)

// ─── Statut d'activité légale ────────────────────────────────────────────────

export type ActivityStatus = 'ACTIVE' | 'CEASED';

// ─── Type d'enseigne ─────────────────────────────────────────────────────────

export type MerchantType =
  | 'grande_enseigne' // Grande enseigne nationale
  | 'franchise' // Franchise
  | 'independant' // Commerce indépendant
  | 'marche_local' // Marché local
  | 'producteur_local'; // Producteur local

// ─── Catégories de produits ──────────────────────────────────────────────────

export type ProductCategory =
  | 'alimentation_generale'
  | 'fruits_legumes'
  | 'boucherie_charcuterie'
  | 'poissonnerie'
  | 'boulangerie_patisserie'
  | 'epicerie_fine'
  | 'boissons'
  | 'hygiene_beaute'
  | 'entretien_maison'
  | 'bricolage_jardinage'
  | 'electronique'
  | 'habillement'
  | 'pharmacie'
  | 'carburant'
  | 'autre';

// ─── Plans d'abonnement (pas de freemium) ────────────────────────────────────

export type MarketplacePlan =
  | 'essentiel' // Plan de base payant
  | 'pro' // Plan professionnel
  | 'groupe'; // Plan franchise / groupe multi-sites

export interface MarketplacePlanDetails {
  id: MarketplacePlan;
  label: string;
  priceMonthly: number; // Prix mensuel en €
  priceAnnual: number; // Prix annuel en € (remise incluse)
  storesMax: number | null; // Nb de magasins (null = illimité)
  productsMax: number | null; // Nb de produits (null = illimité)
  analytics: boolean; // Accès aux statistiques avancées
  exportCsv: boolean; // Export CSV/PDF
  boostVisibility: boolean; // Options de mise en avant
  partnerBadge: boolean; // Badge "Enseigne Partenaire"
  prioritySearch: boolean; // Priorité dans les résultats
  description: string;
  features: string[];
}

// ─── Profil enseigne (MerchantProfile) ───────────────────────────────────────

export interface MerchantProfile {
  id: string;

  // Données légales obligatoires
  nomLegal: string; // Raison sociale légale
  nomCommercial: string; // Nom commercial affiché
  siret: string; // 14 chiffres — obligatoire
  siren: string; // 9 premiers chiffres du SIRET
  tva: string; // Numéro TVA intracommunautaire
  activityStatus: ActivityStatus;

  // Type et catégories
  merchantType: MerchantType;
  productCategories: ProductCategory[];

  // Coordonnées siège social
  adresseSiege: string;
  codePostal: string;
  ville: string;
  territoire: TerritoryCode;

  // Contact
  emailContact: string;
  telephone: string;
  siteWeb?: string;
  logoUrl?: string;

  // Abonnement marketplace
  plan: MarketplacePlan;
  planStartDate: string; // ISO date
  planEndDate?: string; // ISO date (null = actif)
  billingCycle: 'monthly' | 'annual';

  // Statut validation
  status: MerchantStatus;
  rejectionReason?: string;
  validatedAt?: string; // ISO date
  validatedBy?: string; // admin UID

  // Métadonnées
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

// ─── Magasin (StoreManager) ───────────────────────────────────────────────────

export interface MerchantStore {
  id: string;
  merchantId: string;

  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  territoire: TerritoryCode;

  // Coordonnées GPS précises
  latitude: number;
  longitude: number;

  // Horaires
  horaires: StoreHours;

  // Visibilité
  visible: boolean;
  boostActif: boolean;

  // Métadonnées
  createdAt: string;
  updatedAt: string;
}

export interface StoreHours {
  lundi?: DayHours;
  mardi?: DayHours;
  mercredi?: DayHours;
  jeudi?: DayHours;
  vendredi?: DayHours;
  samedi?: DayHours;
  dimanche?: DayHours;
}

export interface DayHours {
  ouvert: boolean;
  ouverture?: string; // ex: "08:00"
  fermeture?: string; // ex: "20:00"
  pauseDebut?: string; // ex: "12:00"
  pauseFin?: string; // ex: "14:00"
}

// ─── Produit (Product & Price Manager) ───────────────────────────────────────

export interface MerchantProduct {
  id: string;
  merchantId: string;
  storeId: string;

  // Identifiant produit
  ean: string; // Code EAN/GTIN (obligatoire)
  nomProduit: string;
  marque?: string;
  categorie: ProductCategory;
  descriptionProduit?: string;
  imageUrl?: string;

  // Prix actuel
  prix: number;
  prixPromo?: number;
  promoDateDebut?: string; // ISO date
  promoDateFin?: string; // ISO date

  // Unité
  unite: string; // ex: "kg", "L", "pièce"

  // Disponibilité
  disponible: boolean;

  // Métadonnées
  createdAt: string;
  updatedAt: string;
}

// ─── Historique des prix (obligatoire pour prédiction) ───────────────────────

export interface PriceHistoryEntry {
  id: string;
  merchantId: string;
  storeId: string;
  productId: string;
  ean: string;
  nomProduit: string;

  prix: number;
  prixPromo?: number;

  // Source obligatoire pour transparence utilisateurs
  source: string; // ex: "Carrefour Gosier"
  territoire: TerritoryCode;
  date: string; // ISO date — quand le prix a été enregistré

  // Traçabilité
  modifiedBy: string; // UID merchant
  createdAt: string;
}

// ─── Promotions & Boost de visibilité ────────────────────────────────────────

export type BoostType =
  | 'mise_en_avant_locale' // Mise en avant locale
  | 'boost_carte' // Boost sur la carte
  | 'badge_partenaire' // Badge "Enseigne Partenaire"
  | 'priorite_resultats'; // Priorité dans les résultats

export interface VisibilityBoost {
  id: string;
  merchantId: string;
  storeId?: string; // Optionnel : boost pour un magasin spécifique
  type: BoostType;
  actif: boolean;
  dateDebut: string;
  dateFin: string;
  prix: number; // Prix de cette option
  createdAt: string;
}

// ─── Facturation ─────────────────────────────────────────────────────────────

export type InvoiceStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface MerchantInvoice {
  id: string;
  merchantId: string;
  numero: string; // Numéro de facture
  montantHT: number;
  tvaRate: number; // Ex: 8.5 pour DOM
  montantTTC: number;
  description: string;
  status: InvoiceStatus;
  dateEmission: string; // ISO date
  dateEcheance: string; // ISO date
  datePaiement?: string; // ISO date
  createdAt: string;
}

// ─── Analytics enseigne ───────────────────────────────────────────────────────

export interface MerchantAnalytics {
  merchantId: string;
  storeId?: string;
  period: 'day' | 'week' | 'month';
  periodStart: string; // ISO date
  periodEnd: string; // ISO date

  vuesMagasin: number; // Vues de la fiche magasin
  clics: number; // Clics vers le magasin
  comparaisonsGagnees: number; // Comparaisons où ce magasin est le moins cher
  comparaisonsPerdues: number; // Comparaisons où ce magasin est plus cher
  positionnementPrix: number; // Score de positionnement (0-100)
}

// ─── Formulaire d'onboarding enseigne ────────────────────────────────────────

export interface MerchantOnboardingForm {
  // Étape 1 — Identification légale
  nomLegal: string;
  nomCommercial: string;
  siret: string;
  tva: string;
  merchantType: MerchantType;
  productCategories: ProductCategory[];
  activityStatus: ActivityStatus;

  // Étape 2 — Adresse & contact
  adresseSiege: string;
  codePostal: string;
  ville: string;
  territoire: TerritoryCode;
  emailContact: string;
  telephone: string;
  siteWeb?: string;

  // Étape 3 — Premier magasin (obligatoire)
  premierMagasinNom: string;
  premierMagasinAdresse: string;
  premierMagasinVille: string;
  premierMagasinLatitude: number;
  premierMagasinLongitude: number;

  // Étape 4 — Abonnement
  plan: MarketplacePlan;
  billingCycle: 'monthly' | 'annual';
  acceptesCGU: boolean;
  acceptesConfidentialite: boolean;
}

// ─── Validation admin (Admin Marketplace Panel) ───────────────────────────────

export type AdminActionType =
  | 'APPROVE'
  | 'REJECT'
  | 'SUSPEND'
  | 'REACTIVATE'
  | 'PRICE_FLAG'
  | 'DATA_CORRECTION';

export interface AdminAuditLog {
  id: string;
  adminId: string;
  merchantId: string;
  actionType: AdminActionType;
  reason?: string;
  previousStatus: MerchantStatus;
  newStatus: MerchantStatus;
  createdAt: string; // ISO date — log immuable
}
