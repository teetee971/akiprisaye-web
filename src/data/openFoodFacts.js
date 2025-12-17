/**
 * OpenFoodFacts Integration
 * 
 * Fetches product information from OpenFoodFacts API
 * Enriches local product database with detailed information
 */

/**
 * Fetch product data from OpenFoodFacts API
 * @param {string} ean - Product EAN/barcode
 * @returns {Promise<Object>} Product data or null if not found
 */
export async function fetchProductFromOpenFoodFacts(ean) {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${ean}.json`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.status !== 1 || !data.product) {
      return null;
    }
    
    const product = data.product;
    
    // Extract relevant information
    return {
      ean: ean,
      name: product.product_name || product.product_name_fr || 'Produit inconnu',
      brand: product.brands || null,
      category: product.categories_tags?.[0]?.replace('en:', '') || null,
      quantity: product.quantity || null,
      imageUrl: product.image_url || product.image_front_url || null,
      imageSmallUrl: product.image_small_url || product.image_front_small_url || null,
      ingredients: product.ingredients_text || product.ingredients_text_fr || null,
      nutriScore: product.nutriscore_grade || null,
      ecoScore: product.ecoscore_grade || null,
      labels: product.labels_tags || [],
      allergens: product.allergens_tags || [],
      nutritionData: {
        energy: product.nutriments?.['energy-kcal_100g'] || null,
        fat: product.nutriments?.fat_100g || null,
        saturatedFat: product.nutriments?.['saturated-fat_100g'] || null,
        carbohydrates: product.nutriments?.carbohydrates_100g || null,
        sugars: product.nutriments?.sugars_100g || null,
        fiber: product.nutriments?.fiber_100g || null,
        proteins: product.nutriments?.proteins_100g || null,
        salt: product.nutriments?.salt_100g || null,
      },
      packaging: product.packaging || null,
      stores: product.stores || null,
      countries: product.countries_tags || [],
      manufacturingPlaces: product.manufacturing_places || null,
      source: 'openfoodfacts',
      lastModified: product.last_modified_t ? new Date(product.last_modified_t * 1000) : null,
    };
  } catch (error) {
    console.error('Error fetching from OpenFoodFacts:', error);
    return null;
  }
}

/**
 * Search products by name on OpenFoodFacts
 * @param {string} query - Search query
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Results per page (default: 20)
 * @returns {Promise<Object>} Search results
 */
export async function searchProductsOnOpenFoodFacts(query, page = 1, pageSize = 20) {
  try {
    const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
    url.searchParams.set('search_terms', query);
    url.searchParams.set('search_simple', '1');
    url.searchParams.set('action', 'process');
    url.searchParams.set('json', '1');
    url.searchParams.set('page', page.toString());
    url.searchParams.set('page_size', pageSize.toString());
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    return {
      count: data.count || 0,
      page: data.page || 1,
      pageSize: data.page_size || pageSize,
      products: (data.products || []).map(product => ({
        ean: product.code,
        name: product.product_name || product.product_name_fr || 'Produit inconnu',
        brand: product.brands || null,
        category: product.categories_tags?.[0]?.replace('en:', '') || null,
        imageUrl: product.image_url || product.image_front_url || null,
        imageSmallUrl: product.image_small_url || product.image_front_small_url || null,
        nutriScore: product.nutriscore_grade || null,
        ecoScore: product.ecoscore_grade || null,
      })),
    };
  } catch (error) {
    console.error('Error searching on OpenFoodFacts:', error);
    return null;
  }
}

/**
 * Get product categories from OpenFoodFacts
 * @returns {Promise<Array>} List of categories
 */
export async function getCategories() {
  try {
    const response = await fetch('https://world.openfoodfacts.org/categories.json');
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    return (data.tags || []).map(tag => ({
      id: tag.id,
      name: tag.name,
      products: tag.products || 0,
      url: tag.url,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Memoization utility for caching function results
 * @param {Function} fn - Function to memoize
 * @param {Function} keyGenerator - Optional function to generate cache key
 * @returns {Function} Memoized function
 */
function memoize(fn, keyGenerator = JSON.stringify) {
  const cache = new Map();
  return function memoized(...args) {
    const key = keyGenerator(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Calculate sustainability score based on OpenFoodFacts data
 * @param {Object} product - Product data from OpenFoodFacts
 * @returns {Object} Sustainability score and breakdown
 */
function calculateSustainabilityScoreCore(product) {
  let score = 0;
  const maxScore = 100;
  const breakdown = {
    ecoScore: 0,
    packaging: 0,
    local: 0,
    organic: 0,
  };
  
  // Eco-score contribution (30 points)
  if (product.ecoScore) {
    const ecoScoreMap = { 'a': 30, 'b': 22, 'c': 15, 'd': 7, 'e': 0 };
    breakdown.ecoScore = ecoScoreMap[product.ecoScore.toLowerCase()] || 0;
    score += breakdown.ecoScore;
  }
  
  // Packaging contribution (20 points)
  if (product.packaging) {
    const packagingLower = product.packaging.toLowerCase();
    if (packagingLower.includes('recyclable') || packagingLower.includes('biodégradable')) {
      breakdown.packaging = 20;
      score += 20;
    } else if (packagingLower.includes('carton') || packagingLower.includes('verre')) {
      breakdown.packaging = 15;
      score += 15;
    } else if (packagingLower.includes('plastique')) {
      breakdown.packaging = 5;
      score += 5;
    }
  }
  
  // Local production (30 points)
  const domComCountries = ['gp', 'mq', 'gf', 're', 'yt', 'pm', 'bl', 'mf', 'wf', 'pf', 'nc', 'tf'];
  const isLocal = product.countries?.some(country => 
    domComCountries.includes(country.toLowerCase()),
  );
  const isFrance = product.countries?.some(country => 
    country.toLowerCase().includes('france'),
  );
  
  if (isLocal) {
    breakdown.local = 30;
    score += 30;
  } else if (isFrance) {
    breakdown.local = 20;
    score += 20;
  } else if (product.manufacturingPlaces?.toLowerCase().includes('france')) {
    breakdown.local = 15;
    score += 15;
  }
  
  // Organic/Bio labels (20 points)
  const bioLabels = ['bio', 'organic', 'ab-agriculture-biologique', 'eu-organic'];
  const hasBioLabel = product.labels?.some(label => 
    bioLabels.some(bio => label.toLowerCase().includes(bio)),
  );
  
  if (hasBioLabel) {
    breakdown.organic = 20;
    score += 20;
  }
  
  return {
    score: Math.min(score, maxScore),
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    breakdown,
    grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'E',
  };
}

// Export memoized version for better performance
export const calculateSustainabilityScore = memoize(
  calculateSustainabilityScoreCore,
  (args) => args[0]?.ean || JSON.stringify(args[0]),
);

/**
 * Format product data for display
 * @param {Object} product - Product data from OpenFoodFacts
 * @returns {Object} Formatted product data
 */
export function formatProductForDisplay(product) {
  if (!product) return null;
  
  const sustainability = calculateSustainabilityScore(product);
  
  return {
    ...product,
    sustainability,
    displayName: `${product.brand ? product.brand + ' - ' : ''}${product.name}`,
    hasNutritionInfo: product.nutritionData && Object.values(product.nutritionData).some(v => v !== null),
    hasAllergens: product.allergens && product.allergens.length > 0,
    isBio: product.labels?.some(label => label.toLowerCase().includes('bio')),
    isVegan: product.labels?.some(label => label.toLowerCase().includes('vegan')),
    isGlutenFree: product.labels?.some(label => label.toLowerCase().includes('gluten-free')),
  };
}
