// ProductsController.ts - Controller for product search API
// Searches products using Open Food Facts API with circuit breaker and caching

import { offBreaker, CircuitBreakerError } from '../Services/Breaker';
import { getCachedSearch, setCachedSearch } from '../Services/SearchCache';

interface Product {
  name: string;
  brand: string;
  ean: string;
  image: string | null;
}

class ProductsController {
  /**
   * GET /api/products/search
   * Search products by name/keyword with circuit breaker and caching
   */
  async search({ request, response }) {
    try {
      // Normalize query and territory
      const q = (request.qs().q || '').trim();
      const territory = request.qs().territory || 'Guadeloupe';

      // Early return for short queries
      if (q.length < 3) {
        return response.ok([]);
      }

      // Try cache first
      const cached = await getCachedSearch(territory, q);
      if (cached) {
        response.header('X-Cache', 'HIT');
        return response.ok(cached);
      }

      // Fetch from Open Food Facts with circuit breaker protection
      let items: Product[];
      try {
        items = await offBreaker.exec(async () => {
          const results = await fetch(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=15`
          ).then((r) => {
            if (!r.ok) {
              throw new Error(`OFF API returned ${r.status}`);
            }
            return r.json();
          });

          return (results.products || [])
            .map((p: any) => ({
              name: p.product_name || p.generic_name || 'Produit inconnu',
              brand: p.brands || '—',
              ean: p.code,
              image: p.image_small_url || p.image_url || null,
            }))
            .filter((p: any) => p.ean)
            .slice(0, 15);
        });
      } catch (error) {
        if (error instanceof CircuitBreakerError) {
          return response.status(503).json({
            error: 'Service temporarily unavailable',
            message: 'Product search service is experiencing issues. Please try again later.',
          });
        }
        throw error;
      }

      // Store in cache for future requests
      await setCachedSearch(territory, q, items);
      response.header('X-Cache', 'MISS');

      return response.ok(items);
    } catch (error) {
      console.error('Erreur API produits :', error);
      return response.internalServerError({
        error: 'Error searching products',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/products/trending
   * Get trending products (mock implementation for now)
   */
  async trending({ request, response }) {
    try {
      const territory = request.qs().territory || 'Guadeloupe';
      const limit = parseInt(request.qs().limit || '10');

      // Mock trending products - in production, this would come from analytics
      const trendingProducts: Product[] = [
        {
          name: 'Coca-Cola 33cl',
          brand: 'Coca-Cola',
          ean: '5449000000996',
          image: null,
        },
        {
          name: 'Pain de mie',
          brand: 'Harry\'s',
          ean: '3228857000524',
          image: null,
        },
        {
          name: 'Lait demi-écrémé 1L',
          brand: 'Lactel',
          ean: '3250390690238',
          image: null,
        },
      ].slice(0, limit);

      return response.ok(trendingProducts);
    } catch (error) {
      console.error('Erreur trending produits :', error);
      return response.internalServerError({
        error: 'Error fetching trending products',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/products/select
   * Get selected/featured products (mock implementation for now)
   */
  async select({ request, response }) {
    try {
      const territory = request.qs().territory || 'Guadeloupe';
      const category = request.qs().category || 'all';
      const limit = parseInt(request.qs().limit || '10');

      // Mock selected products - in production, this would come from editorial selection
      const selectedProducts: Product[] = [
        {
          name: 'Bananes plantain',
          brand: 'Local',
          ean: '2000000000001',
          image: null,
        },
        {
          name: 'Rhum agricole',
          brand: 'Damoiseau',
          ean: '3467650001015',
          image: null,
        },
        {
          name: 'Igname',
          brand: 'Local',
          ean: '2000000000002',
          image: null,
        },
      ].slice(0, limit);

      return response.ok(selectedProducts);
    } catch (error) {
      console.error('Erreur select produits :', error);
      return response.internalServerError({
        error: 'Error fetching selected products',
        message: error.message,
      });
    }
  }
}

export default ProductsController;
