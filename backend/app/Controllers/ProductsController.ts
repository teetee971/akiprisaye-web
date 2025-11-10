// ProductsController.ts - Controller for product search API
// Searches products using Open Food Facts API

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
   * Get trending/popular products by territory
   */
  async trending({ request, response }) {
    try {
      const territory = request.qs().territory || 'Guadeloupe';

      // Mock trending products data (cached popular products)
      // In production, this would read from Redis: trending:{territory}
      const trendingProducts = this.getMockTrendingProducts(territory);

      return response.ok(trendingProducts);
    } catch (error) {
      console.error('Erreur API produits trending :', error);
      return response.internalServerError({
        error: 'Error fetching trending products',
        message: error.message
      });
    }
  }

  /**
   * Mock trending products based on territory
   * In production, this data would come from Redis cache
   */
  private getMockTrendingProducts(territory: string): Product[] {
    // Popular products across French overseas territories
    const baseProducts = [
      {
        name: 'Riz Basmati',
        brand: 'Taureau Ailé',
        ean: '3017620422003',
        image: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.4.400.jpg'
      },
      {
        name: 'Lait demi-écrémé UHT',
        brand: 'Lactel',
        ean: '3250390359968',
        image: 'https://images.openfoodfacts.org/images/products/325/039/035/9968/front_fr.4.400.jpg'
      },
      {
        name: 'Huile de Tournesol',
        brand: 'Lesieur',
        ean: '3250390324058',
        image: 'https://images.openfoodfacts.org/images/products/325/039/032/4058/front_fr.4.400.jpg'
      },
      {
        name: 'Pâtes Spaghetti',
        brand: 'Panzani',
        ean: '3168930009863',
        image: 'https://images.openfoodfacts.org/images/products/316/893/000/9863/front_fr.4.400.jpg'
      },
      {
        name: 'Farine de blé',
        brand: 'Francine',
        ean: '3270190016564',
        image: 'https://images.openfoodfacts.org/images/products/327/019/001/6564/front_fr.4.400.jpg'
      },
      {
        name: 'Sucre blanc',
        brand: 'Daddy',
        ean: '3502110010179',
        image: 'https://images.openfoodfacts.org/images/products/350/211/001/0179/front_fr.4.400.jpg'
      }
    ];

    // Return 5-6 popular products
    return baseProducts.slice(0, 5 + Math.floor(Math.random() * 2));
  }
}

export default ProductsController;
