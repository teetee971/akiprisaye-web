// ProductsController.ts - Controller for product search API
// Searches products using Open Food Facts API

import {
  searchRequestsTotal,
  searchErrorsTotal,
  searchZeroResultsTotal,
  searchDurationMs
} from '../../start/metrics';
import { hashQuery, logStructured } from '../../start/logger';

interface Product {
  name: string;
  brand: string;
  ean: string;
  image: string | null;
}

class ProductsController {
  /**
   * GET /api/products/search
   * Search products by name/keyword
   */
  async search({ request, response }) {
    const q = (request.qs().q || '').trim();
    const territory = request.qs().territory || 'Guadeloupe';
    
    // Start timer for duration tracking
    const endTimer = searchDurationMs.startTimer({ territory });
    
    // Increment total request counter
    searchRequestsTotal.inc({ territory });
    
    try {
      if (q.length < 3) {
        endTimer();
        
        // Log zero results for short queries
        const qHash = hashQuery(q);
        logStructured('info', 'search', {
          q_hash: qHash,
          territory,
          results: 0,
          reason: 'query_too_short'
        });
        
        return response.ok([]);
      }

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

      // Check for zero results
      if (items.length === 0) {
        searchZeroResultsTotal.inc({ territory });
      }
      
      // Stop timer
      endTimer();
      
      // Log structured search event
      const qHash = hashQuery(q);
      logStructured('info', 'search', {
        q_hash: qHash,
        territory,
        results: items.length
      });

      return response.ok(items);
    } catch (error) {
      // Increment error counter
      searchErrorsTotal.inc({ type: 'exception' });
      
      // Stop timer
      endTimer();
      
      // Log error with structured logging
      const qHash = hashQuery(q);
      logStructured('error', 'search', {
        q_hash: qHash,
        territory,
        error: error.message,
        type: 'exception'
      });
      
      console.error('Erreur API produits :', error);
      return response.internalServerError({
        error: 'Error searching products',
        message: error.message
      });
    }
  }
}

export default ProductsController;
