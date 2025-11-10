// ProductsController.ts - Controller for product search and trending API
// Searches products using Open Food Facts API
// Tracks product selections for trending analytics

interface Product {
  name: string;
  brand: string;
  ean: string;
  image: string | null;
}

interface SelectionData {
  ean: string;
  territory?: string;
  name?: string;
  brand?: string;
  image?: string | null;
}

class ProductsController {
  /**
   * GET /api/products/search
   * Search products by name/keyword
   */
  async search({ request, response }) {
    try {
      const q = (request.qs().q || '').trim();
      
      if (q.length < 3) {
        return response.ok([]);
      }

      const territory = request.qs().territory || 'Guadeloupe';

      // Search Open Food Facts
      const results = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=15`
      ).then((r) => r.json());

      const items = (results.products || [])
        .map((p: any) => ({
          name: p.product_name || p.generic_name || 'Produit inconnu',
          brand: p.brands || '—',
          ean: p.code,
          image: p.image_small_url || p.image_url || null,
        }))
        .filter((p: any) => p.ean)
        .slice(0, 15);

      return response.ok(items);
    } catch (error) {
      console.error('Erreur API produits :', error);
      return response.internalServerError({
        error: 'Error searching products',
        message: error.message
      });
    }
  }

  /**
   * POST /api/products/select
   * Track a product selection for trending analytics
   * 
   * Note: This is a placeholder for the TypeScript route definition.
   * The actual implementation is in functions/api/products/select.js
   * which handles the Redis operations.
   */
  async select({ request, response }) {
    try {
      const body = request.body() || {};
      const { ean, territory = 'Guadeloupe', name, brand, image } = body as SelectionData;

      if (!ean) {
        return response.badRequest({
          error: 'Missing EAN',
          message: 'EAN code is required'
        });
      }

      // Validate EAN format
      const cleaned = ean.replace(/\D/g, '');
      if (cleaned.length < 8 || cleaned.length > 14) {
        return response.badRequest({
          error: 'Invalid EAN',
          message: 'EAN must be 8-14 digits'
        });
      }

      // Note: In production with AdonisJS, this would connect to Redis
      // For now, return a placeholder response
      return response.ok({
        success: true,
        ean,
        territory,
        message: 'Product selection tracked (placeholder)',
        tracked: false
      });
    } catch (error) {
      console.error('Erreur API product select:', error);
      return response.internalServerError({
        error: 'Error tracking product selection',
        message: error.message
      });
    }
  }

  /**
   * GET /api/products/trending
   * Get top trending products by territory
   * 
   * Note: This is a placeholder for the TypeScript route definition.
   * The actual implementation is in functions/api/products/trending.js
   */
  async trending({ request, response }) {
    try {
      const territory = request.qs().territory || 'Guadeloupe';
      const limit = Math.min(parseInt(request.qs().limit || '10', 10), 100);

      // Note: In production with AdonisJS, this would query Redis
      // For now, return empty array
      return response.ok({
        territory,
        limit,
        count: 0,
        products: [],
        message: 'Trending products endpoint (placeholder)'
      });
    } catch (error) {
      console.error('Erreur API trending:', error);
      return response.internalServerError({
        error: 'Error fetching trending products',
        message: error.message
      });
    }
  }
}

export default ProductsController;
