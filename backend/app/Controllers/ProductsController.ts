// ProductsController.ts - Controller for product search API
// Searches products using Open Food Facts API

interface Product {
  name: string;
  brand: string;
  ean: string;
  image: string | null;
}

// Simple in-memory cache for trending products
const trendingCache = new Map<string, { data: Product[]; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Static seed data for trending products by territory
const TRENDING_SEEDS: Record<string, Product[]> = {
  Guadeloupe: [
    { ean: '3017620422003', name: 'Nutella 400g', brand: 'Ferrero', image: null },
    { ean: '3560070557547', name: 'Huile Tournesol 1L', brand: 'Lesieur', image: null },
    { ean: '3270160648023', name: 'Riz Basmati 1kg', brand: 'Taureau Ailé', image: null },
    { ean: '3564700256602', name: 'Lait demi-écrémé 1L', brand: 'Lactel', image: null },
    { ean: '3560070557554', name: 'Pâtes Spaghetti 500g', brand: 'Panzani', image: null },
  ],
  Martinique: [
    { ean: '3017620422003', name: 'Nutella 400g', brand: 'Ferrero', image: null },
    { ean: '3560070557547', name: 'Huile Tournesol 1L', brand: 'Lesieur', image: null },
    { ean: '3270160648023', name: 'Riz Basmati 1kg', brand: 'Taureau Ailé', image: null },
    { ean: '3564700256602', name: 'Lait demi-écrémé 1L', brand: 'Lactel', image: null },
    { ean: '3560070557554', name: 'Pâtes Spaghetti 500g', brand: 'Panzani', image: null },
  ],
  Réunion: [
    { ean: '3017620422003', name: 'Nutella 400g', brand: 'Ferrero', image: null },
    { ean: '3560070557547', name: 'Huile Tournesol 1L', brand: 'Lesieur', image: null },
    { ean: '3270160648023', name: 'Riz Basmati 1kg', brand: 'Taureau Ailé', image: null },
    { ean: '3564700256602', name: 'Lait demi-écrémé 1L', brand: 'Lactel', image: null },
    { ean: '3560070557554', name: 'Pâtes Spaghetti 500g', brand: 'Panzani', image: null },
  ],
  Guyane: [
    { ean: '3017620422003', name: 'Nutella 400g', brand: 'Ferrero', image: null },
    { ean: '3560070557547', name: 'Huile Tournesol 1L', brand: 'Lesieur', image: null },
    { ean: '3270160648023', name: 'Riz Basmati 1kg', brand: 'Taureau Ailé', image: null },
    { ean: '3564700256602', name: 'Lait demi-écrémé 1L', brand: 'Lactel', image: null },
    { ean: '3560070557554', name: 'Pâtes Spaghetti 500g', brand: 'Panzani', image: null },
  ],
};

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
   * GET /api/products/trending
   * Get trending/popular products by territory with 24h cache
   */
  async trending({ request, response }) {
    try {
      const territory = request.qs().territory || 'Guadeloupe';
      const cacheKey = `trending:${territory}`;
      const now = Date.now();
      
      // Check cache
      if (trendingCache.has(cacheKey)) {
        const cached = trendingCache.get(cacheKey)!;
        if (now - cached.timestamp < CACHE_TTL) {
          return response.ok(cached.data);
        }
        // Cache expired, remove it
        trendingCache.delete(cacheKey);
      }
      
      // Get seed data or default to Guadeloupe
      const data = TRENDING_SEEDS[territory] || TRENDING_SEEDS.Guadeloupe;
      
      // Store in cache
      trendingCache.set(cacheKey, {
        data,
        timestamp: now,
      });
      
      return response.ok(data);
    } catch (error) {
      console.error('Erreur API trending :', error);
      return response.internalServerError({
        error: 'Error fetching trending products',
        message: error.message
      });
    }
  }
}

export default ProductsController;
