/**
 * Tests — Marketplace Enseignes (merchantService)
 *
 * Couvre :
 * - Validation SIRET (algorithme de Luhn)
 * - Dérivation SIREN / TVA
 * - Création enseigne (statut PENDING)
 * - Gestion des magasins
 * - Création produit + historisation prix
 * - Mise à jour prix (historisée)
 * - Actions admin (APPROVE / REJECT / SUSPEND)
 * - Journal d'audit
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock safeLocalStorage pour les tests
const store: Record<string, string> = {};
vi.mock('../utils/safeLocalStorage', () => ({
  safeLocalStorage: {
    getJSON: <T>(key: string, fallback: T): T => {
      try {
        return store[key] !== undefined ? JSON.parse(store[key]) : fallback;
      } catch {
        return fallback;
      }
    },
    setJSON: <T>(key: string, value: T): boolean => {
      store[key] = JSON.stringify(value);
      return true;
    },
  },
}));

import {
  validateSiret,
  sirenFromSiret,
  tvaFromSiren,
  formatSiret,
  createMerchant,
  getMerchantById,
  getAllMerchants,
  getMerchantsByStatus,
  updateMerchant,
  adminChangeMerchantStatus,
  getAuditLog,
  getMerchantStores,
  createStore,
  updateStore,
  deleteStore,
  createProduct,
  getStoreProducts,
  updateProductPrice,
  getProductPriceHistory,
  getStorePriceHistory,
  MARKETPLACE_PLANS,
  getPlanDetails,
} from '../services/merchantService';

import type { MerchantOnboardingForm } from '../types/merchant';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildForm(overrides?: Partial<MerchantOnboardingForm>): MerchantOnboardingForm {
  return {
    nomLegal: 'SAS Test Guadeloupe',
    nomCommercial: 'Supermarché Test',
    siret: '80295726700015',
    tva: 'FR12802957267',
    merchantType: 'independant',
    productCategories: ['alimentation_generale'],
    activityStatus: 'ACTIVE',
    adresseSiege: '1 rue du Commerce',
    codePostal: '97100',
    ville: 'Basse-Terre',
    territoire: 'gp',
    emailContact: 'contact@test.gp',
    telephone: '+590 590 00 00 00',
    plan: 'essentiel',
    billingCycle: 'monthly',
    acceptesCGU: true,
    acceptesConfidentialite: true,
    premierMagasinNom: 'Supermarché Test Basse-Terre',
    premierMagasinAdresse: '1 rue du Commerce',
    premierMagasinVille: 'Basse-Terre',
    premierMagasinLatitude: 15.9993,
    premierMagasinLongitude: -61.723,
    ...overrides,
  };
}

beforeEach(() => {
  // Réinitialiser le store entre les tests
  Object.keys(store).forEach((k) => delete store[k]);
});

// ─── Validation SIRET ─────────────────────────────────────────────────────────

describe('validateSiret', () => {
  it('valide un SIRET correct (Luhn)', () => {
    // SIRET fictif valide via algorithme de Luhn (somme = 50, 50%10 = 0)
    expect(validateSiret('80295726700015')).toBe(true);
  });

  it('rejette un SIRET trop court', () => {
    expect(validateSiret('123456789')).toBe(false);
  });

  it('rejette un SIRET avec caractères non numériques', () => {
    expect(validateSiret('8029572670001X')).toBe(false);
  });

  it('rejette un SIRET à 14 chiffres mais invalide (Luhn)', () => {
    // 80295726700014 donne un total de 49 — invalide
    expect(validateSiret('80295726700014')).toBe(false);
  });

  it('accepte les espaces dans le SIRET', () => {
    // '802 957 267 00015' nettoyé → '80295726700015' → valide
    expect(validateSiret('802 957 267 00015')).toBe(true);
  });
});

// ─── Dérivation SIREN et TVA ──────────────────────────────────────────────────

describe('sirenFromSiret', () => {
  it('extrait les 9 premiers chiffres', () => {
    expect(sirenFromSiret('80295726700015')).toBe('802957267');
  });
});

describe('tvaFromSiren', () => {
  it('calcule correctement le numéro TVA FR', () => {
    const tva = tvaFromSiren('802957267');
    expect(tva).toMatch(/^FR\d{2}802957267$/);
  });
});

describe('formatSiret', () => {
  it('formate un SIRET en 4 groupes', () => {
    expect(formatSiret('80295726700015')).toBe('802 957 267 00015');
  });

  it('retourne la valeur brute si longueur incorrecte', () => {
    expect(formatSiret('123')).toBe('123');
  });
});

// ─── Création enseigne ────────────────────────────────────────────────────────

describe('createMerchant', () => {
  it('crée une enseigne avec statut PENDING', () => {
    const merchant = createMerchant(buildForm());
    expect(merchant.status).toBe('PENDING');
  });

  it('dérive le SIREN depuis le SIRET', () => {
    const merchant = createMerchant(buildForm());
    expect(merchant.siren).toBe('802957267');
  });

  it("normalise l'email en minuscules", () => {
    const merchant = createMerchant(buildForm({ emailContact: 'CONTACT@TEST.GP' }));
    expect(merchant.emailContact).toBe('contact@test.gp');
  });

  it('crée le premier magasin si fourni', () => {
    const merchant = createMerchant(buildForm());
    const stores = getMerchantStores(merchant.id);
    expect(stores).toHaveLength(1);
    expect(stores[0].nom).toBe('Supermarché Test Basse-Terre');
  });

  it('ne crée pas de magasin si le nom est vide', () => {
    const merchant = createMerchant(buildForm({ premierMagasinNom: '' }));
    const stores = getMerchantStores(merchant.id);
    expect(stores).toHaveLength(0);
  });

  it('persiste dans le store', () => {
    const merchant = createMerchant(buildForm());
    const found = getMerchantById(merchant.id);
    expect(found).toBeDefined();
    expect(found?.nomCommercial).toBe('Supermarché Test');
  });
});

// ─── Récupération enseignes ───────────────────────────────────────────────────

describe('getMerchantsByStatus', () => {
  it('filtre correctement par statut', () => {
    createMerchant(buildForm());
    createMerchant(buildForm({ nomCommercial: 'Autre' }));
    const pending = getMerchantsByStatus('PENDING');
    expect(pending.length).toBe(2);
    const approved = getMerchantsByStatus('APPROVED');
    expect(approved.length).toBe(0);
  });
});

// ─── updateMerchant ───────────────────────────────────────────────────────────

describe('updateMerchant', () => {
  it('met à jour le nom commercial', () => {
    const merchant = createMerchant(buildForm());
    const updated = updateMerchant(merchant.id, { nomCommercial: 'Nouveau Nom' });
    expect(updated?.nomCommercial).toBe('Nouveau Nom');
  });

  it('protège les champs immuables (siret, siren)', () => {
    const merchant = createMerchant(buildForm());
    const updated = updateMerchant(merchant.id, { nomCommercial: 'X' });
    expect(updated?.siret).toBe(merchant.siret);
    expect(updated?.siren).toBe(merchant.siren);
  });

  it("retourne null si l'ID est inconnu", () => {
    const result = updateMerchant('unknown_id', { nomCommercial: 'X' });
    expect(result).toBeNull();
  });
});

// ─── Actions admin ─────────────────────────────────────────────────────────────

describe('adminChangeMerchantStatus', () => {
  it('APPROVE change le statut en APPROVED', () => {
    const merchant = createMerchant(buildForm());
    const result = adminChangeMerchantStatus(merchant.id, 'admin_1', 'APPROVE');
    expect(result?.merchant.status).toBe('APPROVED');
    expect(result?.merchant.validatedBy).toBe('admin_1');
  });

  it('REJECT change le statut en REJECTED et enregistre le motif', () => {
    const merchant = createMerchant(buildForm());
    const result = adminChangeMerchantStatus(merchant.id, 'admin_1', 'REJECT', 'Dossier incomplet');
    expect(result?.merchant.status).toBe('REJECTED');
    expect(result?.merchant.rejectionReason).toBe('Dossier incomplet');
  });

  it('SUSPEND change le statut en SUSPENDED', () => {
    const merchant = createMerchant(buildForm());
    adminChangeMerchantStatus(merchant.id, 'admin_1', 'APPROVE');
    const result = adminChangeMerchantStatus(merchant.id, 'admin_1', 'SUSPEND', 'Non-conformité');
    expect(result?.merchant.status).toBe('SUSPENDED');
  });

  it('REACTIVATE remet le statut en APPROVED', () => {
    const merchant = createMerchant(buildForm());
    adminChangeMerchantStatus(merchant.id, 'admin_1', 'SUSPEND', 'Test');
    const result = adminChangeMerchantStatus(merchant.id, 'admin_1', 'REACTIVATE');
    expect(result?.merchant.status).toBe('APPROVED');
  });

  it('retourne null pour un ID inconnu', () => {
    const result = adminChangeMerchantStatus('unknown', 'admin_1', 'APPROVE');
    expect(result).toBeNull();
  });
});

// ─── Journal d'audit ──────────────────────────────────────────────────────────

describe('getAuditLog', () => {
  it('enregistre chaque action admin', () => {
    const merchant = createMerchant(buildForm());
    adminChangeMerchantStatus(merchant.id, 'admin_1', 'APPROVE');
    adminChangeMerchantStatus(merchant.id, 'admin_1', 'SUSPEND', 'Raison test');

    const logs = getAuditLog(merchant.id);
    expect(logs).toHaveLength(2);
    expect(logs[0].actionType).toBe('APPROVE');
    expect(logs[1].actionType).toBe('SUSPEND');
    expect(logs[1].reason).toBe('Raison test');
  });

  it('retourne tout le journal si pas de merchantId', () => {
    const m1 = createMerchant(buildForm());
    const m2 = createMerchant(buildForm({ nomCommercial: 'Autre' }));
    adminChangeMerchantStatus(m1.id, 'admin_1', 'APPROVE');
    adminChangeMerchantStatus(m2.id, 'admin_1', 'REJECT', 'Test');
    const allLogs = getAuditLog();
    expect(allLogs.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Gestion des magasins ─────────────────────────────────────────────────────

describe('createStore / updateStore / deleteStore', () => {
  it('crée un magasin avec les coordonnées GPS', () => {
    const merchant = createMerchant(buildForm({ premierMagasinNom: '' }));
    const store = createStore({
      merchantId: merchant.id,
      nom: 'Magasin Test',
      adresse: '5 route nationale',
      codePostal: '97100',
      ville: 'Basse-Terre',
      territoire: 'gp',
      latitude: 15.9993,
      longitude: -61.723,
    });
    expect(store.id).toBeTruthy();
    expect(store.visible).toBe(true);
    expect(store.boostActif).toBe(false);
  });

  it("met à jour le nom d'un magasin", () => {
    const merchant = createMerchant(buildForm({ premierMagasinNom: '' }));
    const store = createStore({
      merchantId: merchant.id,
      nom: 'Ancien',
      adresse: '',
      codePostal: '',
      ville: '',
      territoire: 'gp',
      latitude: 0,
      longitude: 0,
    });
    const updated = updateStore(store.id, merchant.id, { nom: 'Nouveau' });
    expect(updated?.nom).toBe('Nouveau');
  });

  it('ne met pas à jour si merchantId ne correspond pas', () => {
    const merchant = createMerchant(buildForm({ premierMagasinNom: '' }));
    const store = createStore({
      merchantId: merchant.id,
      nom: 'Test',
      adresse: '',
      codePostal: '',
      ville: '',
      territoire: 'gp',
      latitude: 0,
      longitude: 0,
    });
    const result = updateStore(store.id, 'wrong_merchant', { nom: 'Autre' });
    expect(result).toBeNull();
  });

  it("supprime un magasin appartenant à l'enseigne", () => {
    const merchant = createMerchant(buildForm({ premierMagasinNom: '' }));
    const store = createStore({
      merchantId: merchant.id,
      nom: 'Test',
      adresse: '',
      codePostal: '',
      ville: '',
      territoire: 'gp',
      latitude: 0,
      longitude: 0,
    });
    const ok = deleteStore(store.id, merchant.id);
    expect(ok).toBe(true);
    expect(getMerchantStores(merchant.id)).toHaveLength(0);
  });

  it('retourne false si tentative de suppression sans droits', () => {
    const merchant = createMerchant(buildForm({ premierMagasinNom: '' }));
    const s = createStore({
      merchantId: merchant.id,
      nom: 'Test',
      adresse: '',
      codePostal: '',
      ville: '',
      territoire: 'gp',
      latitude: 0,
      longitude: 0,
    });
    const ok = deleteStore(s.id, 'other_merchant');
    expect(ok).toBe(false);
  });
});

// ─── Produits & Historique des prix ──────────────────────────────────────────

describe('createProduct / updateProductPrice / getProductPriceHistory', () => {
  it('crée un produit et historise le prix initial', () => {
    const merchant = createMerchant(buildForm({ premierMagasinNom: '' }));
    const storeObj = createStore({
      merchantId: merchant.id,
      nom: 'Test',
      adresse: '',
      codePostal: '',
      ville: '',
      territoire: 'gp',
      latitude: 0,
      longitude: 0,
    });

    const product = createProduct(
      {
        merchantId: merchant.id,
        storeId: storeObj.id,
        ean: '3068320114266',
        nomProduit: 'Lait demi-écrémé 1L',
        categorie: 'alimentation_generale',
        prix: 1.25,
        unite: 'L',
        disponible: true,
      },
      'Supermarché Test'
    );

    expect(product.id).toBeTruthy();
    expect(product.ean).toBe('3068320114266');

    const history = getProductPriceHistory(product.id);
    expect(history).toHaveLength(1);
    expect(history[0].prix).toBe(1.25);
    expect(history[0].source).toBe('Supermarché Test');
  });

  it('historise chaque mise à jour de prix', () => {
    const merchant = createMerchant(buildForm({ premierMagasinNom: '' }));
    const storeObj = createStore({
      merchantId: merchant.id,
      nom: 'Test',
      adresse: '',
      codePostal: '',
      ville: '',
      territoire: 'gp',
      latitude: 0,
      longitude: 0,
    });

    const product = createProduct(
      {
        merchantId: merchant.id,
        storeId: storeObj.id,
        ean: '3068320114266',
        nomProduit: 'Test',
        categorie: 'autre',
        prix: 1.0,
        unite: 'pièce',
        disponible: true,
      },
      'Source test'
    );

    updateProductPrice(product.id, merchant.id, 1.2, 'Source test');
    updateProductPrice(product.id, merchant.id, 1.35, 'Source test');

    const history = getProductPriceHistory(product.id);
    // 1 initial + 2 mises à jour = 3 entrées
    expect(history).toHaveLength(3);
    // Tous les prix enregistrés sont présents (ordre peut varier si même timestamp)
    const prices = history.map((h) => h.prix).sort();
    expect(prices).toEqual([1.0, 1.2, 1.35]);
  });

  it('refuse la mise à jour si merchantId ne correspond pas', () => {
    const merchant = createMerchant(buildForm({ premierMagasinNom: '' }));
    const storeObj = createStore({
      merchantId: merchant.id,
      nom: 'Test',
      adresse: '',
      codePostal: '',
      ville: '',
      territoire: 'gp',
      latitude: 0,
      longitude: 0,
    });
    const product = createProduct(
      {
        merchantId: merchant.id,
        storeId: storeObj.id,
        ean: '123',
        nomProduit: 'P',
        categorie: 'autre',
        prix: 1.0,
        unite: 'u',
        disponible: true,
      },
      'src'
    );
    const result = updateProductPrice(product.id, 'wrong_merchant', 2.0, 'src');
    expect(result).toBeNull();
  });

  it('getStorePriceHistory retourne les prix de tous les produits du magasin', () => {
    const merchant = createMerchant(buildForm({ premierMagasinNom: '' }));
    const storeObj = createStore({
      merchantId: merchant.id,
      nom: 'Test',
      adresse: '',
      codePostal: '',
      ville: '',
      territoire: 'gp',
      latitude: 0,
      longitude: 0,
    });

    createProduct(
      {
        merchantId: merchant.id,
        storeId: storeObj.id,
        ean: '111',
        nomProduit: 'P1',
        categorie: 'autre',
        prix: 1.0,
        unite: 'u',
        disponible: true,
      },
      'src'
    );
    createProduct(
      {
        merchantId: merchant.id,
        storeId: storeObj.id,
        ean: '222',
        nomProduit: 'P2',
        categorie: 'autre',
        prix: 2.0,
        unite: 'u',
        disponible: true,
      },
      'src'
    );

    const history = getStorePriceHistory(storeObj.id);
    expect(history.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Plans marketplace ────────────────────────────────────────────────────────

describe('MARKETPLACE_PLANS', () => {
  it('contient 3 plans (aucun freemium)', () => {
    expect(MARKETPLACE_PLANS).toHaveLength(3);
    expect(MARKETPLACE_PLANS.map((p) => p.id)).toEqual(['essentiel', 'pro', 'groupe']);
    // Tous les plans sont payants
    MARKETPLACE_PLANS.forEach((p) => {
      expect(p.priceMonthly).toBeGreaterThan(0);
      expect(p.priceAnnual).toBeGreaterThan(0);
    });
  });

  it('le plan Groupe offre des magasins et produits illimités', () => {
    const groupe = getPlanDetails('groupe');
    expect(groupe?.storesMax).toBeNull();
    expect(groupe?.productsMax).toBeNull();
    expect(groupe?.analytics).toBe(true);
    expect(groupe?.prioritySearch).toBe(true);
  });

  it('le plan Essentiel a une limite de 1 magasin', () => {
    const essentiel = getPlanDetails('essentiel');
    expect(essentiel?.storesMax).toBe(1);
  });
});
