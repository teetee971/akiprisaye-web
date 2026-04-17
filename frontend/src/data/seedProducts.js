/**
 * SEED_PRODUCTS - Jeu de données de démonstration pour le comparateur
 * Contient des produits courants des DOM-TOM avec des prix réalistes.
 * Couvre Guadeloupe, Martinique, Guyane, La Réunion, Mayotte.
 */

const _ts = (offsetDays = 0) => {
  const d = new Date('2026-02-15T10:00:00Z');
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString();
};

export const SEED_PRODUCTS = [
  // ── Coca-Cola 2L ─────────────────────────────────────────────────────────
  {
    ean: '5449000000996',
    name: 'Coca-Cola',
    brand: 'Coca-Cola',
    size: '2L',
    category: 'boissons',
    prices: [
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 3.6,
        currency: 'EUR',
        ts: _ts(5),
      },
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 3.75,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'leader_price_pp',
        storeName: 'Leader Price Pointe-à-Pitre',
        territory: 'Guadeloupe',
        city: 'Pointe-à-Pitre',
        price: 3.45,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 3.8,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 3.95,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'leclerc_riv_pilote',
        storeName: 'E.Leclerc Rivière-Pilote',
        territory: 'Martinique',
        city: 'Rivière-Pilote',
        price: 3.65,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 3.9,
        currency: 'EUR',
        ts: _ts(5),
      },
      {
        storeId: 'cora_saint_laurent',
        storeName: 'Cora Saint-Laurent',
        territory: 'Guyane',
        city: 'Saint-Laurent-du-Maroni',
        price: 4.1,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 3.55,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'leclerc_saint_pierre',
        storeName: 'E.Leclerc Saint-Pierre',
        territory: 'La Réunion',
        city: 'Saint-Pierre',
        price: 3.45,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 4.2,
        currency: 'EUR',
        ts: _ts(6),
      },
      {
        storeId: 'sodifram_mamoudzou',
        storeName: 'Sodifram Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 4.35,
        currency: 'EUR',
        ts: _ts(3),
      },
    ],
  },

  // ── Coca-Cola 33cL canette (EAN le plus scanné) ───────────────────────────
  {
    ean: '5449000054227',
    name: 'Coca-Cola',
    brand: 'Coca-Cola',
    size: '33cL canette',
    category: 'boissons',
    prices: [
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 1.05,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 1.1,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'leader_price_pp',
        storeName: 'Leader Price Pointe-à-Pitre',
        territory: 'Guadeloupe',
        city: 'Pointe-à-Pitre',
        price: 0.99,
        currency: 'EUR',
        ts: _ts(1),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 1.15,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 1.2,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'leclerc_riv_pilote',
        storeName: 'E.Leclerc Rivière-Pilote',
        territory: 'Martinique',
        city: 'Rivière-Pilote',
        price: 1.05,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 1.25,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'cora_saint_laurent',
        storeName: 'Cora Saint-Laurent',
        territory: 'Guyane',
        city: 'Saint-Laurent-du-Maroni',
        price: 1.35,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 1.05,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'leclerc_saint_pierre',
        storeName: 'E.Leclerc Saint-Pierre',
        territory: 'La Réunion',
        city: 'Saint-Pierre',
        price: 0.99,
        currency: 'EUR',
        ts: _ts(1),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 1.4,
        currency: 'EUR',
        ts: _ts(5),
      },
      {
        storeId: 'sodifram_mamoudzou',
        storeName: 'Sodifram Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 1.5,
        currency: 'EUR',
        ts: _ts(2),
      },
    ],
  },

  // ── Coca-Cola 1,5L bouteille ──────────────────────────────────────────────
  {
    ean: '5449000131805',
    name: 'Coca-Cola',
    brand: 'Coca-Cola',
    size: '1,5L',
    category: 'boissons',
    prices: [
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 2.35,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 2.45,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 2.5,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 2.6,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'leclerc_riv_pilote',
        storeName: 'E.Leclerc Rivière-Pilote',
        territory: 'Martinique',
        city: 'Rivière-Pilote',
        price: 2.4,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 2.65,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 2.3,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 2.8,
        currency: 'EUR',
        ts: _ts(4),
      },
    ],
  },

  // ── Coca-Cola Zero 50cL ───────────────────────────────────────────────────
  {
    ean: '5449000214911',
    name: 'Coca-Cola Zero',
    brand: 'Coca-Cola',
    size: '50cL',
    category: 'boissons',
    prices: [
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 1.45,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 1.55,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'leclerc_riv_pilote',
        storeName: 'E.Leclerc Rivière-Pilote',
        territory: 'Martinique',
        city: 'Rivière-Pilote',
        price: 1.45,
        currency: 'EUR',
        ts: _ts(1),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 1.65,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 1.4,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 1.75,
        currency: 'EUR',
        ts: _ts(3),
      },
    ],
  },

  // ── Pâtes Panzani 500g ────────────────────────────────────────────────────
  {
    ean: '3228857000074',
    name: 'Pâtes Panzani',
    brand: 'Panzani',
    size: '500g',
    category: 'épicerie',
    prices: [
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 1.89,
        currency: 'EUR',
        ts: _ts(5),
      },
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 1.95,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 2.05,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 2.1,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 2.2,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 2.1,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 2.45,
        currency: 'EUR',
        ts: _ts(5),
      },
    ],
  },

  // ── Lait Candia Demi-Écrémé 1L ────────────────────────────────────────────
  {
    ean: '3250391805211',
    name: 'Lait Candia Demi-Écrémé',
    brand: 'Candia',
    size: '1L',
    category: 'laitages',
    prices: [
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 1.65,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 1.6,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 1.7,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 1.75,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 1.8,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 1.55,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 1.95,
        currency: 'EUR',
        ts: _ts(5),
      },
    ],
  },

  // ── Chips Lay's Nature 150g ───────────────────────────────────────────────
  {
    ean: '3017760496254',
    name: "Chips Lay's Nature",
    brand: "Lay's",
    size: '150g',
    category: 'apéritif',
    prices: [
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 2.49,
        currency: 'EUR',
        ts: _ts(5),
      },
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 2.55,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'leader_price_pp',
        storeName: 'Leader Price Pointe-à-Pitre',
        territory: 'Guadeloupe',
        city: 'Pointe-à-Pitre',
        price: 2.39,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 2.65,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 2.7,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 2.8,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 2.5,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 3.1,
        currency: 'EUR',
        ts: _ts(5),
      },
    ],
  },

  // ── Riz Uncle Ben's 1kg ───────────────────────────────────────────────────
  {
    ean: '3256220000000',
    name: "Riz Uncle Ben's",
    brand: "Uncle Ben's",
    size: '1kg',
    category: 'épicerie',
    prices: [
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 3.2,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 3.1,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 3.35,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 3.4,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 3.5,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 3.15,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 3.8,
        currency: 'EUR',
        ts: _ts(5),
      },
    ],
  },

  // ── Eau Cristaline 6×1,5L ─────────────────────────────────────────────────
  {
    ean: '3023290632406',
    name: 'Eau Cristaline',
    brand: 'Cristaline',
    size: '6×1,5L',
    category: 'boissons',
    prices: [
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 2.99,
        currency: 'EUR',
        ts: _ts(5),
      },
      {
        storeId: 'leader_price_pp',
        storeName: 'Leader Price Pointe-à-Pitre',
        territory: 'Guadeloupe',
        city: 'Pointe-à-Pitre',
        price: 2.79,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 3.15,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 3.25,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 3.3,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 3.2,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 3.8,
        currency: 'EUR',
        ts: _ts(5),
      },
    ],
  },

  // ── Emmental Président 200g ───────────────────────────────────────────────
  {
    ean: '3266980284824',
    name: 'Emmental Président',
    brand: 'Président',
    size: '200g',
    category: 'laitages',
    prices: [
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 3.45,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 3.4,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 3.55,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 3.65,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 3.8,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 3.35,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 4.2,
        currency: 'EUR',
        ts: _ts(5),
      },
    ],
  },

  // ── Nutella 750g ──────────────────────────────────────────────────────────
  {
    ean: '8712566334001',
    name: 'Nutella',
    brand: 'Ferrero',
    size: '750g',
    category: 'petit-déjeuner',
    prices: [
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 6.99,
        currency: 'EUR',
        ts: _ts(5),
      },
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 7.2,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 7.35,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 7.5,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 7.75,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 7.5,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 8.5,
        currency: 'EUR',
        ts: _ts(5),
      },
    ],
  },

  // ── Huile Lesieur 1L ──────────────────────────────────────────────────────
  {
    ean: '3083680085205',
    name: 'Huile Lesieur',
    brand: 'Lesieur',
    size: '1L',
    category: 'épicerie',
    prices: [
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 4.25,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'leader_price_pp',
        storeName: 'Leader Price Pointe-à-Pitre',
        territory: 'Guadeloupe',
        city: 'Pointe-à-Pitre',
        price: 4.1,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 4.45,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 4.55,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 4.7,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 4.2,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 5.1,
        currency: 'EUR',
        ts: _ts(5),
      },
    ],
  },

  // ── Café Grand Mère 250g ──────────────────────────────────────────────────
  {
    ean: '3033710074426',
    name: 'Café Grand Mère',
    brand: 'Grand Mère',
    size: '250g',
    category: 'petit-déjeuner',
    prices: [
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 5.49,
        currency: 'EUR',
        ts: _ts(5),
      },
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 5.65,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 5.75,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 5.8,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 5.9,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 5.55,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 6.5,
        currency: 'EUR',
        ts: _ts(5),
      },
    ],
  },

  // ── Sucre Béghin Say 1kg ──────────────────────────────────────────────────
  {
    ean: '3228857005888',
    name: 'Sucre en poudre Béghin Say',
    brand: 'Béghin Say',
    size: '1kg',
    category: 'épicerie',
    prices: [
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 1.45,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 1.55,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 1.6,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 1.65,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 1.7,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 1.5,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 1.9,
        currency: 'EUR',
        ts: _ts(5),
      },
    ],
  },

  // ── Farine Francine 1kg ───────────────────────────────────────────────────
  {
    ean: '3029330003533',
    name: 'Farine de blé Francine',
    brand: 'Francine',
    size: '1kg',
    category: 'épicerie',
    prices: [
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 1.25,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 1.3,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 1.4,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 1.45,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 1.5,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 1.3,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 1.65,
        currency: 'EUR',
        ts: _ts(5),
      },
    ],
  },

  // ── Beurre doux Président 250g ────────────────────────────────────────────
  {
    ean: '3228021090014',
    name: 'Beurre doux Président',
    brand: 'Président',
    size: '250g',
    category: 'laitages',
    prices: [
      {
        storeId: 'superu_petit_canal',
        storeName: 'Super U Petit-Canal',
        territory: 'Guadeloupe',
        city: 'Le Gosier',
        price: 3.65,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_baie_mahault',
        storeName: 'Carrefour Baie-Mahault',
        territory: 'Guadeloupe',
        city: 'Baie-Mahault',
        price: 3.79,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'leader_price_pp',
        storeName: 'Leader Price Pointe-à-Pitre',
        territory: 'Guadeloupe',
        city: 'Pointe-à-Pitre',
        price: 3.55,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'super_score_fdf',
        storeName: 'Super Score Fort-de-France',
        territory: 'Martinique',
        city: 'Fort-de-France',
        price: 3.85,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'carrefour_lamentin',
        storeName: 'Carrefour Le Lamentin',
        territory: 'Martinique',
        city: 'Le Lamentin',
        price: 3.9,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'leclerc_riv_pilote',
        storeName: 'E.Leclerc Rivière-Pilote',
        territory: 'Martinique',
        city: 'Rivière-Pilote',
        price: 3.7,
        currency: 'EUR',
        ts: _ts(1),
      },
      {
        storeId: 'hyper_u_cayenne',
        storeName: 'Hyper U Cayenne',
        territory: 'Guyane',
        city: 'Cayenne',
        price: 3.95,
        currency: 'EUR',
        ts: _ts(4),
      },
      {
        storeId: 'cora_saint_laurent',
        storeName: 'Cora Saint-Laurent',
        territory: 'Guyane',
        city: 'Saint-Laurent-du-Maroni',
        price: 4.1,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'hyper_u_saint_denis',
        storeName: 'Hyper U Saint-Denis',
        territory: 'La Réunion',
        city: 'Saint-Denis',
        price: 3.6,
        currency: 'EUR',
        ts: _ts(3),
      },
      {
        storeId: 'leclerc_saint_pierre',
        storeName: 'E.Leclerc Saint-Pierre',
        territory: 'La Réunion',
        city: 'Saint-Pierre',
        price: 3.5,
        currency: 'EUR',
        ts: _ts(2),
      },
      {
        storeId: 'jumbo_mamoudzou',
        storeName: 'Jumbo Score Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 4.3,
        currency: 'EUR',
        ts: _ts(5),
      },
      {
        storeId: 'sodifram_mamoudzou',
        storeName: 'Sodifram Mamoudzou',
        territory: 'Mayotte',
        city: 'Mamoudzou',
        price: 4.45,
        currency: 'EUR',
        ts: _ts(3),
      },
    ],
  },
];

/**
 * Recherche de produit par EAN.
 * @param {string} ean
 * @returns {Object|null}
 */
export function findProductByEan(ean) {
  return SEED_PRODUCTS.find((p) => p.ean === ean) || null;
}

/**
 * Recherche de produits par nom (fuzzy, insensible aux accents et à la casse).
 * Gère les variantes courantes : "coca cola", "coke", "coca zero", etc.
 * @param {string} query
 * @returns {Array}
 */
export function searchProductsByName(query) {
  if (!query || query.length < 2) return [];

  const normalize = (s) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();

  const nq = normalize(query);
  const terms = nq.split(/\s+/).filter(Boolean);

  // Alias courants → termes normalisés
  const ALIASES = {
    coca: 'coca cola',
    coke: 'coca cola',
    'coca zero': 'coca cola zero',
    lait: 'lait candia',
    milk: 'lait',
    riz: 'riz',
    rice: 'riz',
    huile: 'huile lesieur',
    sucre: 'sucre',
    farine: 'farine',
    cafe: 'cafe',
    coffee: 'cafe',
    eau: 'eau',
    water: 'eau',
    pates: 'pates',
    pasta: 'pates',
    beurre: 'beurre president',
    butter: 'beurre',
  };

  const expandedTerms = [...terms];
  for (const [alias, expanded] of Object.entries(ALIASES)) {
    const aliasTerms = normalize(alias).split(/\s+/);
    if (aliasTerms.every((t) => terms.includes(t))) {
      normalize(expanded)
        .split(/\s+/)
        .forEach((t) => {
          if (!expandedTerms.includes(t)) expandedTerms.push(t);
        });
    }
  }

  return SEED_PRODUCTS.filter((p) => {
    const haystack = normalize(`${p.name} ${p.brand} ${p.category} ${p.size}`);
    return expandedTerms.every((term) => haystack.includes(term));
  });
}

/**
 * Obtenir tous les territoires disponibles.
 * @returns {Array<string>}
 */
export function getAvailableTerritories() {
  const territories = new Set();
  SEED_PRODUCTS.forEach((product) => {
    product.prices.forEach((price) => {
      territories.add(price.territory);
    });
  });
  return Array.from(territories).sort();
}

/**
 * Filtrer les prix par territoire (recherche souple : accent-insensible).
 * @param {Object} product
 * @param {string} territory
 * @returns {Array}
 */
export function filterPricesByTerritory(product, territory) {
  if (!product || !product.prices) return [];
  if (!territory || territory === 'all') return product.prices;

  const norm = (s) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const nTerritory = norm(territory);
  return product.prices.filter((p) => {
    const pT = norm(p.territory);
    return pT.includes(nTerritory) || nTerritory.includes(pT);
  });
}
