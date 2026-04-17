// src/services/storeComparisonService.ts
// Service de comparaison entre enseignes basé sur le catalogue local

export type PriceObservation = {
  date: string;
  price: number;
  isPromo?: boolean;
  promoLabel?: string;
};

export type CatalogueItem = {
  id?: string;
  name?: string;
  store?: string;
  observations?: PriceObservation[];
  [key: string]: any;
};

export type StoreComparison = {
  store: string;
  currentPrice: number;
  observations: PriceObservation[];
  trend30d: number; // pourcentage de variation sur 30 jours
  differenceFromBest: {
    amount: number; // en euros
    percentage: number; // en pourcentage
  };
  isBestPrice: boolean;
};

export type ComparisonResult = {
  productName: string;
  bestPrice: number;
  bestStore: string;
  comparisons: StoreComparison[];
};

/**
 * Calcule le prix moyen sur les 30 derniers jours
 */
function calculateAverage30d(observations: PriceObservation[]): number {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const recent = observations.filter((obs) => {
    const obsTime = new Date(obs.date).getTime();
    return obsTime >= thirtyDaysAgo;
  });

  if (recent.length === 0) return 0;

  const sum = recent.reduce((acc, obs) => acc + obs.price, 0);
  return sum / recent.length;
}

/**
 * Calcule la tendance sur 30 jours (pourcentage de variation)
 */
function calculateTrend30d(observations: PriceObservation[]): number {
  if (observations.length === 0) return 0;

  const sorted = [...observations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const recent = sorted.filter((obs) => {
    const obsTime = new Date(obs.date).getTime();
    return obsTime >= thirtyDaysAgo;
  });

  if (recent.length < 2) return 0;

  const first = recent[0].price;
  const last = recent[recent.length - 1].price;

  return ((last - first) / first) * 100;
}

/**
 * Compare les enseignes pour un produit donné du catalogue
 */
export function compareStoresForProduct(
  productName: string,
  catalogueData: CatalogueItem[]
): ComparisonResult | null {
  // Filtrer les produits qui correspondent au nom
  const matchingProducts = catalogueData.filter((item) => item.name === productName);

  if (matchingProducts.length === 0) return null;

  // Grouper par enseigne
  const storeMap = new Map<string, PriceObservation[]>();

  matchingProducts.forEach((product) => {
    const store = product.store || 'Inconnu';
    const observations: PriceObservation[] = product.observations || [];

    if (!storeMap.has(store)) {
      storeMap.set(store, []);
    }
    storeMap.get(store)!.push(...observations);
  });

  // Calculer les comparaisons pour chaque enseigne
  const comparisons: StoreComparison[] = [];

  storeMap.forEach((observations, store) => {
    if (observations.length === 0) return;

    // Trier par date et prendre le plus récent
    const sorted = [...observations].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const currentPrice = sorted[0].price;
    const trend30d = calculateTrend30d(observations);

    comparisons.push({
      store,
      currentPrice,
      observations,
      trend30d,
      differenceFromBest: { amount: 0, percentage: 0 }, // sera calculé après
      isBestPrice: false, // sera mis à jour après
    });
  });

  if (comparisons.length === 0) return null;

  // Trier par prix croissant
  comparisons.sort((a, b) => a.currentPrice - b.currentPrice);

  // Identifier le meilleur prix
  const bestPrice = comparisons[0].currentPrice;
  const bestStore = comparisons[0].store;

  // Calculer les différences
  comparisons.forEach((comp) => {
    comp.isBestPrice = comp.currentPrice === bestPrice;
    comp.differenceFromBest = {
      amount: comp.currentPrice - bestPrice,
      percentage: bestPrice > 0 ? ((comp.currentPrice - bestPrice) / bestPrice) * 100 : 0,
    };
  });

  return {
    productName,
    bestPrice,
    bestStore,
    comparisons,
  };
}

/**
 * Récupère les données du catalogue depuis le fichier local
 */
export async function loadCatalogueData(): Promise<CatalogueItem[]> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/catalogue.json`);
    if (!response.ok) {
      console.error('Erreur lors du chargement du catalogue');
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erreur lors du chargement du catalogue:', error);
    return [];
  }
}

/**
 * Liste tous les produits uniques du catalogue
 */
export function getUniqueProducts(catalogueData: CatalogueItem[]): string[] {
  const names = new Set<string>();
  catalogueData.forEach((item) => {
    if (item.name) {
      names.add(item.name);
    }
  });
  return Array.from(names).sort();
}

export default {
  compareStoresForProduct,
  loadCatalogueData,
  getUniqueProducts,
};
