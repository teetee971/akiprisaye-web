/**
 * Centralized Unsplash image assets.
 * All photos are free to use under the Unsplash License.
 * Format: https://images.unsplash.com/photo-{ID}?auto=format&fit=crop&w={W}&q=80
 */

export const TERRITORY_IMAGES: Record<string, { url: string; alt: string; credit: string }> = {
  gp: {
    url: 'https://images.unsplash.com/photo-1564890369478-c89ca3d9cde4?auto=format&fit=crop&w=800&q=80',
    alt: 'Guadeloupe — îles et forêt tropicale',
    credit: 'Unsplash',
  },
  mq: {
    url: 'https://images.unsplash.com/photo-1598924700218-b7cbfbf39e91?auto=format&fit=crop&w=800&q=80',
    alt: 'Martinique — paysage tropical',
    credit: 'Unsplash',
  },
  gf: {
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    alt: 'Guyane — forêt amazonienne',
    credit: 'Unsplash',
  },
  re: {
    url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80',
    alt: 'La Réunion — paysage volcanique',
    credit: 'Unsplash',
  },
  yt: {
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80',
    alt: 'Mayotte — lagon turquoise',
    credit: 'Unsplash',
  },
  fr: {
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    alt: 'France métropolitaine — Paris',
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
};
