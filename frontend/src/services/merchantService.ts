/**
 * Service — Marketplace Enseignes v1.0.0
 *
 * Gestion du cycle de vie complet des enseignes :
 * - Onboarding (SIRET / SIREN / TVA)
 * - Profil enseigne
 * - Gestion multi-magasins
 * - Produits & historique des prix
 * - Statuts PENDING / APPROVED / SUSPENDED
 *
 * Stockage : localStorage (préproduction) / Firestore (production)
 * Règles métier :
 *   ❌ Pas de données fictives
 *   ✅ Toute modification de prix est historisée
 *   ✅ Une enseigne ne peut modifier QUE ses données
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';
import type {
  MerchantProfile,
  MerchantStore,
  MerchantProduct,
  PriceHistoryEntry,
  MerchantOnboardingForm,
  MerchantStatus,
  AdminAuditLog,
  AdminActionType,
  MarketplacePlan,
} from '../types/merchant';

// ─── Clés localStorage ───────────────────────────────────────────────────────

const KEY_MERCHANTS = 'akiprisaye_marketplace_merchants';
const KEY_STORES = 'akiprisaye_marketplace_stores';
const KEY_PRODUCTS = 'akiprisaye_marketplace_products';
const KEY_PRICES = 'akiprisaye_marketplace_price_history';
const KEY_AUDIT = 'akiprisaye_marketplace_audit_log';

// ─── Validation SIRET (algorithme de Luhn) ───────────────────────────────────

/**
 * Valide un numéro SIRET (14 chiffres) via l'algorithme de Luhn.
 */
export function validateSiret(siret: string): boolean {
  const cleaned = siret.replace(/\s/g, '');
  if (!/^\d{14}$/.test(cleaned)) return false;

  let total = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleaned[i], 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    total += digit;
  }
  return total % 10 === 0;
}

/**
 * Dérive le SIREN depuis le SIRET (9 premiers chiffres).
 */
export function sirenFromSiret(siret: string): string {
  return siret.replace(/\s/g, '').substring(0, 9);
}

/**
 * Dérive le numéro TVA intracommunautaire FR depuis le SIREN.
 * Formule officielle : clé TVA = (12 + 3 × (SIREN % 97)) % 97
 */
export function tvaFromSiren(siren: string): string {
  const n = parseInt(siren, 10);
  if (isNaN(n)) return '';
  const key = (12 + 3 * (n % 97)) % 97;
  return `FR${String(key).padStart(2, '0')}${siren}`;
}

/**
 * Formate un SIRET en blocs lisibles : XXX XXX XXX XXXXX
 */
export function formatSiret(siret: string): string {
  const s = siret.replace(/\s/g, '');
  if (s.length !== 14) return siret;
  return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 9)} ${s.slice(9)}`;
}

// ─── CRUD Enseignes ───────────────────────────────────────────────────────────

function loadMerchants(): MerchantProfile[] {
  return safeLocalStorage.getJSON<MerchantProfile[]>(KEY_MERCHANTS, []);
}

function saveMerchants(list: MerchantProfile[]): void {
  safeLocalStorage.setJSON(KEY_MERCHANTS, list);
}

/** Récupère toutes les enseignes (admin uniquement). */
export function getAllMerchants(): MerchantProfile[] {
  return loadMerchants();
}

/** Récupère les enseignes par statut. */
export function getMerchantsByStatus(status: MerchantStatus): MerchantProfile[] {
  return loadMerchants().filter((m) => m.status === status);
}

/** Récupère une enseigne par ID. */
export function getMerchantById(id: string): MerchantProfile | undefined {
  return loadMerchants().find((m) => m.id === id);
}

/**
 * Crée un nouveau compte enseigne depuis le formulaire d'onboarding.
 * Statut initial : PENDING (validation admin requise).
 */
export function createMerchant(form: MerchantOnboardingForm): MerchantProfile {
  const siren = sirenFromSiret(form.siret);
  const now = new Date().toISOString();

  const merchant: MerchantProfile = {
    id: `merchant_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    nomLegal: form.nomLegal.trim(),
    nomCommercial: form.nomCommercial.trim(),
    siret: form.siret.replace(/\s/g, ''),
    siren,
    tva: form.tva.trim() || tvaFromSiren(siren),
    activityStatus: form.activityStatus,
    merchantType: form.merchantType,
    productCategories: form.productCategories,
    adresseSiege: form.adresseSiege.trim(),
    codePostal: form.codePostal.trim(),
    ville: form.ville.trim(),
    territoire: form.territoire,
    emailContact: form.emailContact.trim().toLowerCase(),
    telephone: form.telephone.trim(),
    siteWeb: form.siteWeb?.trim(),
    plan: form.plan,
    planStartDate: now,
    billingCycle: form.billingCycle,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  const list = loadMerchants();
  list.push(merchant);
  saveMerchants(list);

  // Créer le premier magasin si fourni
  if (form.premierMagasinNom) {
    createStore({
      merchantId: merchant.id,
      nom: form.premierMagasinNom.trim(),
      adresse: form.premierMagasinAdresse.trim(),
      codePostal: form.codePostal.trim(),
      ville: form.premierMagasinVille.trim(),
      territoire: form.territoire,
      latitude: form.premierMagasinLatitude,
      longitude: form.premierMagasinLongitude,
    });
  }

  return merchant;
}

/** Met à jour le profil d'une enseigne (ne peut modifier QUE ses propres données). */
export function updateMerchant(
  id: string,
  updates: Partial<
    Omit<
      MerchantProfile,
      'id' | 'siret' | 'siren' | 'createdAt' | 'status' | 'validatedAt' | 'validatedBy'
    >
  >
): MerchantProfile | null {
  const list = loadMerchants();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return null;

  list[idx] = {
    ...list[idx],
    ...updates,
    // Champs immuables protégés
    id: list[idx].id,
    siret: list[idx].siret,
    siren: list[idx].siren,
    createdAt: list[idx].createdAt,
    status: list[idx].status,
    updatedAt: new Date().toISOString(),
  };
  saveMerchants(list);
  return list[idx];
}

// ─── Actions admin (validation / suspension) ─────────────────────────────────

/** Change le statut d'une enseigne (admin uniquement). Crée un log d'audit. */
export function adminChangeMerchantStatus(
  merchantId: string,
  adminId: string,
  actionType: AdminActionType,
  reason?: string
): { merchant: MerchantProfile; log: AdminAuditLog } | null {
  const list = loadMerchants();
  const idx = list.findIndex((m) => m.id === merchantId);
  if (idx === -1) return null;

  const statusMap: Record<AdminActionType, MerchantStatus> = {
    APPROVE: 'APPROVED',
    REJECT: 'REJECTED',
    SUSPEND: 'SUSPENDED',
    REACTIVATE: 'APPROVED',
    PRICE_FLAG: list[idx].status, // Pas de changement de statut
    DATA_CORRECTION: list[idx].status, // Pas de changement de statut
  };

  const previousStatus = list[idx].status;
  const newStatus = statusMap[actionType];
  const now = new Date().toISOString();

  list[idx] = {
    ...list[idx],
    status: newStatus,
    rejectionReason: actionType === 'REJECT' ? reason : list[idx].rejectionReason,
    validatedAt: actionType === 'APPROVE' ? now : list[idx].validatedAt,
    validatedBy: actionType === 'APPROVE' ? adminId : list[idx].validatedBy,
    updatedAt: now,
  };
  saveMerchants(list);

  // Log d'audit immuable
  const log: AdminAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    adminId,
    merchantId,
    actionType,
    reason,
    previousStatus,
    newStatus,
    createdAt: now,
  };
  const auditList = safeLocalStorage.getJSON<AdminAuditLog[]>(KEY_AUDIT, []);
  auditList.push(log);
  safeLocalStorage.setJSON(KEY_AUDIT, auditList);

  return { merchant: list[idx], log };
}

/** Récupère le journal d'audit (admin uniquement). */
export function getAuditLog(merchantId?: string): AdminAuditLog[] {
  const logs = safeLocalStorage.getJSON<AdminAuditLog[]>(KEY_AUDIT, []);
  return merchantId ? logs.filter((l) => l.merchantId === merchantId) : logs;
}

// ─── CRUD Magasins ─────────────────────────────────────────────────────────────

function loadStores(): MerchantStore[] {
  return safeLocalStorage.getJSON<MerchantStore[]>(KEY_STORES, []);
}

function saveStores(list: MerchantStore[]): void {
  safeLocalStorage.setJSON(KEY_STORES, list);
}

/** Récupère les magasins d'une enseigne. */
export function getMerchantStores(merchantId: string): MerchantStore[] {
  return loadStores().filter((s) => s.merchantId === merchantId);
}

/** Crée un nouveau magasin. */
export function createStore(
  data: Omit<
    MerchantStore,
    'id' | 'visible' | 'boostActif' | 'horaires' | 'createdAt' | 'updatedAt'
  >
): MerchantStore {
  const now = new Date().toISOString();
  const store: MerchantStore = {
    id: `store_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    ...data,
    visible: true,
    boostActif: false,
    horaires: {},
    createdAt: now,
    updatedAt: now,
  };
  const list = loadStores();
  list.push(store);
  saveStores(list);
  return store;
}

/** Met à jour un magasin (vérifie l'appartenance à l'enseigne). */
export function updateStore(
  storeId: string,
  merchantId: string,
  updates: Partial<Omit<MerchantStore, 'id' | 'merchantId' | 'createdAt'>>
): MerchantStore | null {
  const list = loadStores();
  const idx = list.findIndex((s) => s.id === storeId && s.merchantId === merchantId);
  if (idx === -1) return null;

  list[idx] = {
    ...list[idx],
    ...updates,
    id: list[idx].id,
    merchantId,
    updatedAt: new Date().toISOString(),
  };
  saveStores(list);
  return list[idx];
}

/** Supprime un magasin (vérifie l'appartenance à l'enseigne). */
export function deleteStore(storeId: string, merchantId: string): boolean {
  const list = loadStores();
  const before = list.length;
  const filtered = list.filter((s) => !(s.id === storeId && s.merchantId === merchantId));
  if (filtered.length === before) return false;
  saveStores(filtered);
  return true;
}

// ─── CRUD Produits & Prix ─────────────────────────────────────────────────────

function loadProducts(): MerchantProduct[] {
  return safeLocalStorage.getJSON<MerchantProduct[]>(KEY_PRODUCTS, []);
}

function saveProducts(list: MerchantProduct[]): void {
  safeLocalStorage.setJSON(KEY_PRODUCTS, list);
}

/** Récupère les produits d'un magasin. */
export function getStoreProducts(storeId: string): MerchantProduct[] {
  return loadProducts().filter((p) => p.storeId === storeId);
}

/** Ajoute un produit avec son prix initial (historisé automatiquement). */
export function createProduct(
  data: Omit<MerchantProduct, 'id' | 'createdAt' | 'updatedAt'>,
  source: string
): MerchantProduct {
  const now = new Date().toISOString();
  const product: MerchantProduct = {
    id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const list = loadProducts();
  list.push(product);
  saveProducts(list);

  // Historiser le prix initial
  _recordPriceHistory(product, source, data.merchantId);
  return product;
}

/** Met à jour le prix d'un produit — historise automatiquement le changement. */
export function updateProductPrice(
  productId: string,
  merchantId: string,
  prix: number,
  source: string,
  prixPromo?: number,
  promoDateDebut?: string,
  promoDateFin?: string
): MerchantProduct | null {
  const list = loadProducts();
  const idx = list.findIndex((p) => p.id === productId && p.merchantId === merchantId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  list[idx] = {
    ...list[idx],
    prix,
    prixPromo,
    promoDateDebut,
    promoDateFin,
    updatedAt: now,
  };
  saveProducts(list);

  // Historiser obligatoirement
  _recordPriceHistory(list[idx], source, merchantId);
  return list[idx];
}

/** Enregistre une entrée dans l'historique des prix. */
function _recordPriceHistory(product: MerchantProduct, source: string, modifiedBy: string): void {
  const store = loadStores().find((s) => s.id === product.storeId);
  const entry: PriceHistoryEntry = {
    id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    merchantId: product.merchantId,
    storeId: product.storeId,
    productId: product.id,
    ean: product.ean,
    nomProduit: product.nomProduit,
    prix: product.prix,
    prixPromo: product.prixPromo,
    source,
    territoire: store?.territoire ?? 'gp',
    date: new Date().toISOString(),
    modifiedBy,
    createdAt: new Date().toISOString(),
  };
  const history = safeLocalStorage.getJSON<PriceHistoryEntry[]>(KEY_PRICES, []);
  history.push(entry);
  safeLocalStorage.setJSON(KEY_PRICES, history);
}

/** Récupère l'historique des prix d'un produit. */
export function getProductPriceHistory(productId: string): PriceHistoryEntry[] {
  const history = safeLocalStorage.getJSON<PriceHistoryEntry[]>(KEY_PRICES, []);
  return history
    .filter((h) => h.productId === productId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Récupère l'historique des prix d'un magasin (tous produits). */
export function getStorePriceHistory(storeId: string): PriceHistoryEntry[] {
  const history = safeLocalStorage.getJSON<PriceHistoryEntry[]>(KEY_PRICES, []);
  return history
    .filter((h) => h.storeId === storeId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ─── Plans marketplace ────────────────────────────────────────────────────────

import type { MarketplacePlanDetails } from '../types/merchant';

export const MARKETPLACE_PLANS: MarketplacePlanDetails[] = [
  {
    id: 'essentiel',
    label: 'Essentiel',
    priceMonthly: 29.99,
    priceAnnual: 299.99, // ~2 mois offerts
    storesMax: 1,
    productsMax: 100,
    analytics: false,
    exportCsv: false,
    boostVisibility: false,
    partnerBadge: true,
    prioritySearch: false,
    description: 'Pour les commerces indépendants avec un seul point de vente.',
    features: [
      '1 magasin référencé',
      '100 produits avec prix',
      'Badge "Enseigne Partenaire"',
      'Fiche magasin sur la carte',
      'Mise à jour prix illimitée',
      'Facturation mensuelle ou annuelle',
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    priceMonthly: 79.99,
    priceAnnual: 799.99, // ~2 mois offerts
    storesMax: 5,
    productsMax: 1000,
    analytics: true,
    exportCsv: true,
    boostVisibility: true,
    partnerBadge: true,
    prioritySearch: false,
    description: 'Pour les commerces avec plusieurs points de vente ou une gamme étendue.',
    features: [
      "Jusqu'à 5 magasins référencés",
      '1 000 produits avec prix',
      'Statistiques avancées (vues, clics, comparaisons)',
      'Export CSV / PDF',
      'Options de mise en avant locales',
      'Badge "Enseigne Partenaire"',
      'Support prioritaire',
    ],
  },
  {
    id: 'groupe',
    label: 'Groupe / Franchise',
    priceMonthly: 199.99,
    priceAnnual: 1999.99, // ~2 mois offerts
    storesMax: null, // Illimité
    productsMax: null, // Illimité
    analytics: true,
    exportCsv: true,
    boostVisibility: true,
    partnerBadge: true,
    prioritySearch: true,
    description: 'Pour les grandes enseignes, franchises et groupes multi-sites.',
    features: [
      'Magasins illimités',
      'Produits illimités',
      'Statistiques avancées multi-sites',
      'Export CSV / PDF',
      'Priorité dans les résultats de recherche',
      'Boost carte pour tous les sites',
      'Badge "Enseigne Partenaire" premium',
      'Manager dédié',
      "API d'intégration disponible",
    ],
  },
];

export function getPlanDetails(plan: MarketplacePlan): MarketplacePlanDetails | undefined {
  return MARKETPLACE_PLANS.find((p) => p.id === plan);
}
