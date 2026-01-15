/**
 * Product Suggestions Utility
 * Provides intelligent product recommendations based on shopping list
 */

export interface ProductSuggestion {
  product: string;
  reason: string;
  category: string;
}

// Product associations based on common shopping patterns
const PRODUCT_ASSOCIATIONS: Record<string, string[]> = {
  'Pâtes': ['Huile', 'Sauce tomate (non listé)'],
  'Riz': ['Légumes', 'Viande', 'Huile'],
  'Pain': ['Beurre (non listé)', 'Confiture (non listé)'],
  'Lait': ['Céréales (non listé)', 'Café (non listé)'],
  'Farine': ['Sucre', 'Huile'],
  'Viande': ['Légumes', 'Riz', 'Pâtes'],
  'Poisson': ['Légumes', 'Riz'],
  'Légumes': ['Huile', 'Viande', 'Poisson'],
  'Fruits': ['Lait'],
  'Café (non listé)': ['Lait', 'Sucre'],
  'Eau': ['Autres boissons (non listé)'],
  'Essence': ['Diesel'],
  'Diesel': ['Essence'],
};

// Meal-based suggestions
const MEAL_PATTERNS: Record<string, string[]> = {
  'petit_dejeuner': ['Pain', 'Lait', 'Café (non listé)', 'Beurre (non listé)', 'Confiture (non listé)'],
  'dejeuner': ['Viande', 'Poisson', 'Légumes', 'Riz', 'Pâtes'],
  'diner': ['Viande', 'Poisson', 'Légumes', 'Pain'],
};

/**
 * Get product suggestions based on current shopping list
 * @param currentList Array of product names currently in the list
 * @returns Array of suggested products with reasons
 */
export function getSuggestedProducts(currentList: string[]): ProductSuggestion[] {
  const suggestions: ProductSuggestion[] = [];
  const alreadyInList = new Set(currentList);
  const suggestedProducts = new Set<string>();

  // Get complementary products
  for (const product of currentList) {
    const related = PRODUCT_ASSOCIATIONS[product];
    if (related) {
      related.forEach(relatedProduct => {
        // Remove "(non listé)" suffix for comparison
        const cleanProduct = relatedProduct.replace(' (non listé)', '');
        if (!alreadyInList.has(cleanProduct) && !suggestedProducts.has(cleanProduct)) {
          suggestedProducts.add(cleanProduct);
          suggestions.push({
            product: cleanProduct,
            reason: `Complète bien ${product}`,
            category: 'complementary'
          });
        }
      });
    }
  }

  // Detect meal patterns and suggest missing items
  for (const [mealType, products] of Object.entries(MEAL_PATTERNS)) {
    const matchCount = products.filter(p => alreadyInList.has(p)).length;
    
    // If user has some items from a meal pattern, suggest others
    if (matchCount >= 2 && matchCount < products.length) {
      products.forEach(product => {
        const cleanProduct = product.replace(' (non listé)', '');
        if (!alreadyInList.has(cleanProduct) && !suggestedProducts.has(cleanProduct)) {
          suggestedProducts.add(cleanProduct);
          suggestions.push({
            product: cleanProduct,
            reason: `Pour compléter votre ${mealType.replace('_', ' ')}`,
            category: 'meal_pattern'
          });
        }
      });
    }
  }

  // Limit to top 5 suggestions
  return suggestions.slice(0, 5);
}

/**
 * Get frequently forgotten items
 */
export function getFrequentlyForgottenItems(currentList: string[]): string[] {
  const essentials = ['Eau', 'Pain', 'Lait'];
  const alreadyInList = new Set(currentList);
  
  return essentials.filter(item => !alreadyInList.has(item));
}

/**
 * Analyze shopping list and provide insights
 */
export function analyzeShoppingList(currentList: string[]): {
  categories: Record<string, number>;
  totalItems: number;
  suggestions: string[];
} {
  const categories: Record<string, number> = {
    'alimentaire_base': 0,
    'frais': 0,
    'carburant': 0,
    'hygiene': 0,
    'bricolage': 0
  };

  // This would need to be connected to the actual product categories
  // For now, simplified version
  const suggestions: string[] = [];

  if (currentList.length === 0) {
    suggestions.push('Votre liste est vide. Commencez par ajouter des produits de base.');
  } else if (currentList.length < 3) {
    suggestions.push('Liste courte - pensez aux essentiels : Pain, Lait, Eau');
  } else if (currentList.length > 15) {
    suggestions.push('Grande liste - pensez à optimiser votre itinéraire pour gagner du temps');
  }

  return {
    categories,
    totalItems: currentList.length,
    suggestions
  };
}
