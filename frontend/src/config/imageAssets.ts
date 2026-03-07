/**
 * Centralized Unsplash image assets.
 * All photos are free to use under the Unsplash License.
 * Format: https://images.unsplash.com/photo-{ID}?auto=format&fit=crop&w={W}&q=80
 */

export const TERRITORY_IMAGES: Record<string, { url: string; alt: string; credit: string }> = {
  gp: {
    url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
    alt: 'Guadeloupe — marché tropical, fruits et légumes locaux',
    credit: 'Unsplash',
  },
  mq: {
    url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fit=crop&w=800&q=80',
    alt: 'Martinique — littoral et végétation tropicale',
    credit: 'Unsplash',
  },
  gf: {
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    alt: 'Guyane — forêt amazonienne luxuriante',
    credit: 'Unsplash',
  },
  re: {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
    alt: 'La Réunion — paysage volcanique, piton de la Fournaise',
    credit: 'Unsplash',
  },
  yt: {
    url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
    alt: 'Mayotte — lagon turquoise et mangrove',
    credit: 'Unsplash',
  },
  nc: {
    url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    alt: 'Nouvelle-Calédonie — lagon et récif corallien classé UNESCO',
    credit: 'Unsplash',
  },
  pf: {
    url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
    alt: 'Polynésie française — bungalows sur l\u2019eau de Bora Bora',
    credit: 'Unsplash',
  },
  wf: {
    url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80',
    alt: 'Wallis-et-Futuna — île volcanique du Pacifique',
    credit: 'Unsplash',
  },
  pm: {
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
    alt: 'Saint-Pierre-et-Miquelon — côte rocheuse atlantique',
    credit: 'Unsplash',
  },
  bl: {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    alt: 'Saint-Barthélemy — plage de sable blanc des Caraïbes',
    credit: 'Unsplash',
  },
  mf: {
    url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80',
    alt: 'Saint-Martin — côte caribéenne aux eaux cristallines',
    credit: 'Unsplash',
  },
  tf: {
    url: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=800&q=80',
    alt: 'TAAF — terres australes et antarctiques françaises',
    credit: 'Unsplash',
  },
  fr: {
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    alt: 'France métropolitaine — Paris, Tour Eiffel',
    credit: 'Unsplash',
  },
};

export const TERRITORY_GRADIENTS: Record<string, string> = {
  gp: 'from-emerald-700 to-teal-900',
  mq: 'from-orange-700 to-red-900',
  gf: 'from-green-800 to-emerald-950',
  re: 'from-orange-800 to-red-950',
  yt: 'from-cyan-700 to-blue-900',
  fr: 'from-blue-800 to-indigo-950',
  default: 'from-slate-700 to-slate-900',
};

export const CATEGORY_IMAGES: Record<string, { url: string; alt: string; gradient: string }> = {
  'Épicerie': {
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    alt: 'Épicerie — produits alimentaires',
    gradient: 'from-amber-500 to-orange-600',
  },
  'Produits laitiers': {
    url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    alt: 'Produits laitiers',
    gradient: 'from-blue-400 to-sky-600',
  },
  'Fruits et légumes': {
    url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
    alt: 'Fruits et légumes frais',
    gradient: 'from-green-500 to-emerald-700',
  },
  'Boucherie / Charcuterie': {
    url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80',
    alt: 'Boucherie',
    gradient: 'from-red-600 to-rose-800',
  },
  'Hygiène': {
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    alt: 'Produits hygiène',
    gradient: 'from-purple-500 to-violet-700',
  },
  'Entretien / Nettoyage': {
    url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=400&q=80',
    alt: 'Produits ménagers',
    gradient: 'from-cyan-500 to-teal-700',
  },
  'Lessive': {
    url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=400&q=80',
    alt: 'Lessive',
    gradient: 'from-indigo-500 to-blue-700',
  },
  'Cosmétiques': {
    url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80',
    alt: 'Cosmétiques',
    gradient: 'from-pink-500 to-rose-700',
  },
  'Pharmacie': {
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    alt: 'Pharmacie',
    gradient: 'from-emerald-500 to-green-700',
  },
  'Boissons': {
    url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80',
    alt: 'Boissons',
    gradient: 'from-blue-500 to-cyan-700',
  },
  'Surgelés': {
    url: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?auto=format&fit=crop&w=400&q=80',
    alt: 'Surgelés',
    gradient: 'from-sky-500 to-blue-800',
  },
};

export function getCategoryAsset(category: string) {
  return CATEGORY_IMAGES[category] ?? {
    url: 'https://images.unsplash.com/photo-1542838132-2b1a08e4b1a0?auto=format&fit=crop&w=400&q=80',
    alt: 'Produit',
    gradient: 'from-slate-500 to-slate-700',
  };
}

export function getTerritoryAsset(code: string) {
  return TERRITORY_IMAGES[code.toLowerCase()] ?? {
    url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80',
    alt: 'Territoire',
    credit: 'Unsplash',
  };
}

export function getTerritoryGradient(code: string): string {
  return TERRITORY_GRADIENTS[code.toLowerCase()] ?? TERRITORY_GRADIENTS.default;
}

// Hero images for specific pages
export const PAGE_HERO_IMAGES = {
  // ── Pages already enriched ───────────────────────────────────────────────
  priceHistory: 'https://images.unsplash.com/photo-1607082348351-cef5cd02c7b0?auto=format&fit=crop&w=1600&q=80',
  crossTerritory: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=80',
  inflation: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80',
  coverage: 'https://images.unsplash.com/photo-1526628953301-3cd8e16b67b1?auto=format&fit=crop&w=1600&q=80',
  alerts: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1600&q=80',
  // ── New page heroes ──────────────────────────────────────────────────────
  /** Recherche de prix — fresh market/search */
  search: 'https://images.unsplash.com/photo-1506617564039-2f3b650b7010?auto=format&fit=crop&w=1600&q=80',
  /** Scanner EAN — barcode scan at checkout */
  scanner: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&w=1600&q=80',
  /** Liste de courses intelligente — shopping cart */
  shoppingList: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1600&q=80',
  /** Lutte contre la vie chère — community solidarity */
  lutteVieChere: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=1600&q=80',
  /** Contribuer — open data / teamwork */
  contribuer: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80',
  /** Solidarité — helping hands */
  solidarite: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=80',
  /** À Propos — French overseas territory sunset */
  aPropos: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1600&q=80',
  /** Pricing — premium subscription */
  pricing: 'https://images.unsplash.com/photo-1620714223084-8fcacc2523dc?auto=format&fit=crop&w=1600&q=80',
  /** FAQ — question marks / knowledge */
  faq: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
  /** Contact — friendly communication */
  contact: 'https://images.unsplash.com/photo-1521791055366-0d553872952f?auto=format&fit=crop&w=1600&q=80',
  /** Gamification profile — trophy/achievement */
  gamification: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=1600&q=80',
  /** Comparaison enseignes — supermarket aisle */
  comparaisonEnseignes: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1600&q=80',
  /** App demo — person scanning barcode in tropical supermarket */
  appDemo: 'https://images.unsplash.com/photo-1607082348351-cef5cd02c7b0?auto=format&fit=crop&w=1600&q=80',
  /** Vie chère poster — supermarket shelves with price tags */
  videoPoster: 'https://images.unsplash.com/photo-1542838132-2b1a08e4b1a0?auto=format&fit=crop&w=1200&q=80',
};

/**
 * Product images for the 14 observatoire tracked products.
 * All photos are free to use under the Unsplash License.
 */
export const PRODUCT_IMAGES: Record<string, { url: string; alt: string }> = {
  'Lait demi-écrémé UHT 1L': {
    url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80',
    alt: 'Lait demi-écrémé UHT 1 litre',
  },
  'Riz long blanc 1kg': {
    url: 'https://images.unsplash.com/photo-1516684669134-de2d4a1c0e8a?auto=format&fit=crop&w=300&q=80',
    alt: 'Riz long blanc 1 kilogramme',
  },
  'Eau minérale 1.5L': {
    url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=300&q=80',
    alt: 'Bouteille d\'eau minérale 1,5 litre',
  },
  'Pâtes spaghetti 500g': {
    url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=300&q=80',
    alt: 'Pâtes spaghetti 500 grammes',
  },
  'Sucre blanc 1kg': {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80',
    alt: 'Sucre blanc en poudre 1 kilogramme',
  },
  'Huile de tournesol 1L': {
    url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80',
    alt: 'Huile de tournesol 1 litre',
  },
  'Tomates rondes 1kg': {
    url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80',
    alt: 'Tomates rondes fraîches 1 kilogramme',
  },
  'Poulet entier 1kg': {
    url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=300&q=80',
    alt: 'Poulet entier 1 kilogramme',
  },
  'Yaourt nature 4x125g': {
    url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=300&q=80',
    alt: 'Yaourt nature 4×125 g',
  },
  'Lessive liquide 1.5L': {
    url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=300&q=80',
    alt: 'Lessive liquide 1,5 litre',
  },
  'Liquide vaisselle 500ml': {
    url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=300&q=80',
    alt: 'Liquide vaisselle 500 ml',
  },
  'Gel douche 250ml': {
    url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=300&q=80',
    alt: 'Gel douche 250 ml',
  },
  'Crème hydratante visage 50ml': {
    url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=300&q=80',
    alt: 'Crème hydratante visage 50 ml',
  },
  'Paracétamol 500mg x16': {
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80',
    alt: 'Paracétamol 500 mg boîte de 16 comprimés',
  },
  'Café moulu 250g': {
    url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=300&q=80',
    alt: 'Café moulu 250 grammes',
  },
};

export function getProductImage(productName: string): { url: string; alt: string } {
  return (
    PRODUCT_IMAGES[productName] ?? {
      url: 'https://images.unsplash.com/photo-1542838132-2b1a08e4b1a0?auto=format&fit=crop&w=300&q=80',
      alt: productName,
    }
  );
}
