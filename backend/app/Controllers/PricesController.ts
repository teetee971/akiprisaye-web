// PricesController.ts - Mock controller for price API
// This is a simplified TypeScript-style controller for demonstration
// In production, connect to real database and pricing APIs

interface Price {
  id: number;
  ean: string;
  store: string;
  price: number;
  unit: string;
  location: string;
  lastUpdate: string;
  promotion: boolean;
}

class PricesController {
  /**
   * GET /api/prices
   * Fetch prices by EAN code and territory
   */
  async index({ request, response }) {
    try {
      const { ean, territory } = request.qs();

      if (!ean) {
        return response.badRequest({
          error: 'EAN code is required'
        });
      }

      // Mock data - Replace with real database query
      const prices = this.getMockPrices(ean, territory || 'GP');

      return response.ok({
        data: prices,
        meta: {
          total: prices.length,
          ean,
          territory: territory || 'GP'
        }
      });
    } catch (error) {
      return response.internalServerError({
        error: 'Error fetching prices',
        message: error.message
      });
    }
  }

  /**
   * POST /api/prices
   * Submit new price data (from user or automated scraper)
   */
  async store({ request, response }) {
    try {
      const data = request.body();

      // Validate required fields
      const required = ['ean', 'store', 'price', 'location'];
      for (const field of required) {
        if (!data[field]) {
          return response.badRequest({
            error: `Field ${field} is required`
          });
        }
      }

      // In production: Save to database
      const newPrice = {
        id: Date.now(),
        ean: data.ean,
        store: data.store,
        price: parseFloat(data.price),
        unit: data.unit || '€',
        location: data.location,
        lastUpdate: new Date().toISOString(),
        promotion: data.promotion || false
      };

      return response.created({
        data: newPrice,
        message: 'Price added successfully'
      });
    } catch (error) {
      return response.internalServerError({
        error: 'Error creating price',
        message: error.message
      });
    }
  }

  /**
   * GET /api/prices/compare
   * Compare prices across multiple stores
   */
  async compare({ request, response }) {
    try {
      const { eans, territory } = request.qs();

      if (!eans) {
        return response.badRequest({
          error: 'At least one EAN code is required'
        });
      }

      const eanList = eans.split(',');
      const comparison = {};

      for (const ean of eanList) {
        comparison[ean] = this.getMockPrices(ean, territory || 'GP');
      }

      return response.ok({
        data: comparison,
        meta: {
          products: eanList.length,
          territory: territory || 'GP'
        }
      });
    } catch (error) {
      return response.internalServerError({
        error: 'Error comparing prices',
        message: error.message
      });
    }
  }

  /**
   * Mock data generator
   * Replace with actual database queries in production
   */
  private getMockPrices(ean: string, territory: string): Price[] {
    const stores = [
      { name: 'Carrefour Market', multiplier: 1.0 },
      { name: 'Super U', multiplier: 0.95 },
      { name: 'Leader Price', multiplier: 0.88 },
      { name: 'Système U', multiplier: 0.93 },
      { name: 'Intermarché', multiplier: 0.90 }
    ];

    // Generate base price from EAN (for consistency)
    const basePrice = parseFloat((
      (parseInt(ean.substring(0, 4)) % 100 / 10) + 2
    ).toFixed(2));

    return stores.map((store, index) => ({
      id: index + 1,
      ean,
      store: store.name,
      price: parseFloat((basePrice * store.multiplier).toFixed(2)),
      unit: '€',
      location: territory,
      lastUpdate: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      promotion: Math.random() > 0.7
    }));
  }
}

export default PricesController;
