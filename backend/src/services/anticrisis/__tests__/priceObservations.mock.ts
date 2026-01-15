/**
 * Jeu de données de test réaliste pour le Panier Anti-Crise
 * Version: 1.0.0
 * 
 * Données factuelles, traçables, non promotionnelles
 * Conçu pour valider rigoureusement la Feature C sans biaiser les features A ou B
 * 
 * Format des observations:
 * - productId: Identifiant unique du produit
 * - productName: Nom descriptif du produit
 * - category: Catégorie (Épicerie, Boissons, Frais, etc.)
 * - storeId: Identifiant de l'enseigne
 * - storeName: Nom de l'enseigne
 * - territory: Code territoire (971 = Guadeloupe)
 * - price: Prix TTC observé en €
 * - observedAt: Date d'observation ISO 8601
 */

import { PriceObservation } from '../antiCrisisBasketService.js';

export const priceObservations: PriceObservation[] = [
  // ─────────────────────────────────────────────
  // ✅ PRODUIT 1 — DOIT ÊTRE INCLUS (ANTI-CRISE)
  // Riz long grain 1kg
  // Stable, souvent le moins cher, écart significatif
  // SuperMarché A: 1.29-1.30€ (le moins cher 100% du temps)
  // SuperMarché B: 1.45-1.48€
  // ─────────────────────────────────────────────
  {
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 1.29,
    date: new Date('2025-12-08'),
    source: 'observation_directe',
  },
  {
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 1.45,
    date: new Date('2025-12-08'),
    source: 'observation_directe',
  },
  {
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 1.29,
    date: new Date('2025-12-15'),
    source: 'observation_directe',
  },
  {
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 1.45,
    date: new Date('2025-12-15'),
    source: 'observation_directe',
  },
  {
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 1.30,
    date: new Date('2025-12-22'),
    source: 'observation_directe',
  },
  {
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 1.48,
    date: new Date('2025-12-22'),
    source: 'observation_directe',
  },
  {
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 1.29,
    date: new Date('2025-12-29'),
    source: 'observation_directe',
  },
  {
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 1.46,
    date: new Date('2025-12-29'),
    source: 'observation_directe',
  },
  {
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 1.29,
    date: new Date('2026-01-05'),
    source: 'observation_directe',
  },
  {
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 1.47,
    date: new Date('2026-01-05'),
    source: 'observation_directe',
  },
  {
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 1.30,
    date: new Date('2026-01-10'),
    source: 'observation_directe',
  },
  {
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 1.48,
    date: new Date('2026-01-10'),
    source: 'observation_directe',
  },

  // ─────────────────────────────────────────────
  // ❌ PRODUIT 2 — EXCLU (PROMO PONCTUELLE)
  // Soda cola 1L
  // Prix très bas une fois seulement (0.99€), sinon 1.75-1.79€
  // Variance trop élevée à cause de la promo ponctuelle
  // ─────────────────────────────────────────────
  {
    productId: 'p_soda_1l',
    productName: 'Soda cola 1L',
    category: 'Boissons',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 1.79,
    date: new Date('2025-12-08'),
    source: 'observation_directe',
  },
  {
    productId: 'p_soda_1l',
    productName: 'Soda cola 1L',
    category: 'Boissons',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 1.75,
    date: new Date('2025-12-08'),
    source: 'observation_directe',
  },
  {
    productId: 'p_soda_1l',
    productName: 'Soda cola 1L',
    category: 'Boissons',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 0.99, // ⚠️ Promo ponctuelle isolée
    date: new Date('2025-12-15'),
    source: 'observation_directe',
  },
  {
    productId: 'p_soda_1l',
    productName: 'Soda cola 1L',
    category: 'Boissons',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 1.75,
    date: new Date('2025-12-15'),
    source: 'observation_directe',
  },
  {
    productId: 'p_soda_1l',
    productName: 'Soda cola 1L',
    category: 'Boissons',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 1.79,
    date: new Date('2025-12-22'),
    source: 'observation_directe',
  },
  {
    productId: 'p_soda_1l',
    productName: 'Soda cola 1L',
    category: 'Boissons',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 1.75,
    date: new Date('2025-12-22'),
    source: 'observation_directe',
  },
  {
    productId: 'p_soda_1l',
    productName: 'Soda cola 1L',
    category: 'Boissons',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 1.79,
    date: new Date('2025-12-29'),
    source: 'observation_directe',
  },
  {
    productId: 'p_soda_1l',
    productName: 'Soda cola 1L',
    category: 'Boissons',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 1.76,
    date: new Date('2025-12-29'),
    source: 'observation_directe',
  },
  {
    productId: 'p_soda_1l',
    productName: 'Soda cola 1L',
    category: 'Boissons',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 1.79,
    date: new Date('2026-01-05'),
    source: 'observation_directe',
  },
  {
    productId: 'p_soda_1l',
    productName: 'Soda cola 1L',
    category: 'Boissons',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 1.75,
    date: new Date('2026-01-05'),
    source: 'observation_directe',
  },

  // ─────────────────────────────────────────────
  // ❌ PRODUIT 3 — EXCLU (DONNÉES INSUFFISANTES)
  // Lait demi-écrémé 1L
  // Seulement 4 observations (< 5 minimum requis)
  // ─────────────────────────────────────────────
  {
    productId: 'p_milk_1l',
    productName: 'Lait demi-écrémé 1L',
    category: 'Frais',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 1.05,
    date: new Date('2025-12-15'),
    source: 'observation_directe',
  },
  {
    productId: 'p_milk_1l',
    productName: 'Lait demi-écrémé 1L',
    category: 'Frais',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 1.09,
    date: new Date('2025-12-15'),
    source: 'observation_directe',
  },
  {
    productId: 'p_milk_1l',
    productName: 'Lait demi-écrémé 1L',
    category: 'Frais',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 1.06,
    date: new Date('2025-12-22'),
    source: 'observation_directe',
  },
  {
    productId: 'p_milk_1l',
    productName: 'Lait demi-écrémé 1L',
    category: 'Frais',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 1.10,
    date: new Date('2025-12-22'),
    source: 'observation_directe',
  },

  // ─────────────────────────────────────────────
  // ❌ PRODUIT 4 — EXCLU (PRIX INSTABLE)
  // Huile végétale 1L
  // Variance trop élevée (2.10 → 2.90 → 2.40 → 2.15 → 2.85)
  // Coefficient de variation > 15%
  // ─────────────────────────────────────────────
  {
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 2.1,
    date: new Date('2025-12-08'),
    source: 'observation_directe',
  },
  {
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 2.5,
    date: new Date('2025-12-08'),
    source: 'observation_directe',
  },
  {
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 2.9,
    date: new Date('2025-12-15'),
    source: 'observation_directe',
  },
  {
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 2.6,
    date: new Date('2025-12-15'),
    source: 'observation_directe',
  },
  {
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 2.4,
    date: new Date('2025-12-22'),
    source: 'observation_directe',
  },
  {
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 2.55,
    date: new Date('2025-12-22'),
    source: 'observation_directe',
  },
  {
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 2.15,
    date: new Date('2025-12-29'),
    source: 'observation_directe',
  },
  {
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 2.48,
    date: new Date('2025-12-29'),
    source: 'observation_directe',
  },
  {
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'store_A',
    storeName: 'SuperMarché A',
    price: 2.85,
    date: new Date('2026-01-05'),
    source: 'observation_directe',
  },
  {
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'store_B',
    storeName: 'SuperMarché B',
    price: 2.62,
    date: new Date('2026-01-05'),
    source: 'observation_directe',
  },
];

/**
 * ✅ RÉSULTATS ATTENDUS
 * 
 * Produit                    | Résultat | Raison
 * ---------------------------|----------|------------------------------------------
 * Riz long grain 1kg         | ✅ INCLUS| Stable, moins cher 100%, écart significatif
 * Soda cola 1L               | ❌ Exclu | Promo ponctuelle (variance élevée)
 * Lait demi-écrémé 1L        | ❌ Exclu | Données insuffisantes (4 obs < 5)
 * Huile végétale 1L          | ❌ Exclu | Prix instable (coefficient variation > 15%)
 */
