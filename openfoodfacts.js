/**
 * Open Food Facts API Integration
 * Fetches product information from Open Food Facts database
 */

const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2';

/**
 * Fetch product information from Open Food Facts
 * @param {string} ean - Product EAN/barcode
 * @returns {Promise<Object|null>} Product data or null if not found
 */
export async function fetchProductFromOFF(ean) {
  try {
    const response = await fetch(`${OFF_API_BASE}/product/${ean}.json`);
    
    if (!response.ok) {
      console.warn(`Open Food Facts: Product ${ean} not found`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status !== 1 || !data.product) {
      return null;
    }
    
    const product = data.product;
    
    // Extract relevant product information
    return {
      name: product.product_name || product.product_name_fr || 'Produit inconnu',
      brand: product.brands || '',
      category: product.categories_tags?.[0]?.replace('en:', '') || '',
      image: product.image_url || product.image_front_url || '',
      quantity: product.quantity || '',
      nutriscore: product.nutriscore_grade || '',
      ecoscore: product.ecoscore_grade || '',
      ingredients: product.ingredients_text || product.ingredients_text_fr || '',
      allergens: product.allergens || '',
      stores: product.stores || '',
      countries: product.countries || '',
      source: 'Open Food Facts'
    };
  } catch (error) {
    console.error('Error fetching from Open Food Facts:', error);
    return null;
  }
}

/**
 * Search products by name on Open Food Facts
 * @param {string} searchTerm - Search term
 * @param {number} page - Page number (default 1)
 * @returns {Promise<Array>} Array of products
 */
export async function searchProductsOnOFF(searchTerm, page = 1) {
  try {
    const params = new URLSearchParams({
      search_terms: searchTerm,
      page: page.toString(),
      page_size: '20',
      json: '1'
    });
    
    const response = await fetch(`${OFF_API_BASE}/search?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.products) {
      return [];
    }
    
    return data.products.map(product => ({
      ean: product.code || product._id,
      name: product.product_name || product.product_name_fr || 'Produit inconnu',
      brand: product.brands || '',
      category: product.categories_tags?.[0]?.replace('en:', '') || '',
      image: product.image_url || product.image_front_url || '',
      quantity: product.quantity || '',
      nutriscore: product.nutriscore_grade || '',
      source: 'Open Food Facts'
    }));
  } catch (error) {
    console.error('Error searching on Open Food Facts:', error);
    return [];
  }
}
