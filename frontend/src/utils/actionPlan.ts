 
/**
 * Utilitaires pour calculer le plan d'action optimal
 */

export interface Product {
  name: string;
  bestStore: string;
  bestPrice: number;
  currentPrice?: number;
}

export interface StoreOption {
  stores: string[];
  totalSavings: number;
  productsCount: number;
  averageSavingsPerProduct: number;
}

/**
 * Calcule le meilleur magasin unique
 * O(n) où n = nombre de produits
 */
export function calculateBestSingleStore(products: Product[]): StoreOption {
  const storeSavings = new Map<string, { savings: number; count: number }>();

  // Agréger par magasin
  products.forEach(product => {
    const savings = product.currentPrice 
      ? Math.max(0, product.currentPrice - product.bestPrice)
      : 0;

    const existing = storeSavings.get(product.bestStore) || { savings: 0, count: 0 };
    storeSavings.set(product.bestStore, {
      savings: existing.savings + savings,
      count: existing.count + 1
    });
  });

  // Trouver le meilleur
  let bestStore = "";
  let maxSavings = 0;
  let productCount = 0;

  storeSavings.forEach((data, store) => {
    if (data.savings > maxSavings) {
      bestStore = store;
      maxSavings = data.savings;
      productCount = data.count;
    }
  });

  return {
    stores: [bestStore],
    totalSavings: maxSavings,
    productsCount: productCount,
    averageSavingsPerProduct: productCount > 0 ? maxSavings / productCount : 0
  };
}

/**
 * Calcule le meilleur plan avec 2 magasins maximum
 * O(n log n) pour le tri
 */
export function calculateBestTwoStores(products: Product[]): StoreOption {
  // Grouper par magasin avec économies
  const storeGroups = new Map<string, { products: Product[]; savings: number }>();

  products.forEach(product => {
    const savings = product.currentPrice
      ? Math.max(0, product.currentPrice - product.bestPrice)
      : 0;

    const existing = storeGroups.get(product.bestStore) || { products: [], savings: 0 };
    existing.products.push(product);
    existing.savings += savings;
    storeGroups.set(product.bestStore, existing);
  });

  // Trier par économies décroissantes
  const sortedStores = Array.from(storeGroups.entries())
    .sort((a, b) => b[1].savings - a[1].savings);

  // Prendre les 2 meilleurs
  const topTwo = sortedStores.slice(0, 2);

  return {
    stores: topTwo.map(s => s[0]),
    totalSavings: topTwo.reduce((sum, s) => sum + s[1].savings, 0),
    productsCount: topTwo.reduce((sum, s) => sum + s[1].products.length, 0),
    averageSavingsPerProduct: topTwo.length > 0
      ? topTwo.reduce((sum, s) => sum + s[1].savings, 0) / 
        topTwo.reduce((sum, s) => sum + s[1].products.length, 0)
      : 0
  };
}

/**
 * Compare et retourne les meilleures options A et B
 */
export function getBestOptions(products: Product[]): {
  optionA: StoreOption;
  optionB: StoreOption;
  recommendation: "A" | "B" | "equivalent";
} {
  const optionA = calculateBestSingleStore(products);
  const optionB = calculateBestTwoStores(products);

  // Recommandation basée sur le rapport économies/convenience
  let recommendation: "A" | "B" | "equivalent" = "equivalent";

  const savingsDiff = optionB.totalSavings - optionA.totalSavings;
  
  if (savingsDiff > 2) { // Plus de 2€ de différence
    recommendation = "B";
  } else if (savingsDiff < 0.5) { // Moins de 50 centimes de différence
    recommendation = "A";
  }

  return { optionA, optionB, recommendation };
}

/**
 * Génère un texte formaté pour le presse-papier
 */
export function generateShoppingListText(
  products: Product[],
  option: StoreOption
): string {
  let text = "📝 MA LISTE DE COURSES ÉCONOMIQUE\n";
  text += "═".repeat(40) + "\n\n";

  option.stores.forEach((store, idx) => {
    text += `🏪 ${store.toUpperCase()}\n`;
    text += "─".repeat(40) + "\n";

    const storeProducts = products.filter(p => p.bestStore === store);
    storeProducts.forEach(product => {
      text += `  • ${product.name}`;
      text += " ".repeat(Math.max(2, 35 - product.name.length));
      text += `${product.bestPrice.toFixed(2)} €\n`;
    });

    text += "\n";
  });

  text += "═".repeat(40) + "\n";
  text += `💰 ÉCONOMIES TOTALES : ${option.totalSavings.toFixed(2)} €\n`;
  text += `📦 ${option.productsCount} produit${option.productsCount > 1 ? 's' : ''}\n`;
  text += "═".repeat(40) + "\n\n";
  text += `Généré par A KI PRI SA YÉ\n`;
  text += `Observatoire citoyen des prix\n`;
  text += `${new Date().toLocaleDateString('fr-FR')}`;

  return text;
}
