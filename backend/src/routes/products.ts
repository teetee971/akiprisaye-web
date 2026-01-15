/**
 * Products API Routes
 * 
 * Phase 7: REST API endpoints for product and price management
 * Supports CRUD operations, search, and CSV import/export
 */

import { Router, Request, Response } from 'express';

const router = Router();

// In-memory store for demonstration (replace with database in production)
let products: any[] = [];

/**
 * Get all products
 * GET /api/products
 * 
 * Query params:
 * - search: Search by name or brand
 * - category: Filter by category
 * - territory: Filter by territory (shows only products with prices in that territory)
 * - ean: Search by EAN code
 */
router.get('/', (req: Request, res: Response) => {
  try {
    let filtered = [...products];
    const { search, category, territory, ean } = req.query;

    // Filter by EAN
    if (ean) {
      filtered = filtered.filter(p => p.ean === String(ean));
    }

    // Search by name or brand
    if (search) {
      const searchLower = String(search).toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name?.toLowerCase().includes(searchLower) ||
          p.brand?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter(
        p => p.category?.toLowerCase() === String(category).toLowerCase()
      );
    }

    // Filter by territory
    if (territory) {
      filtered = filtered.filter(p =>
        p.prices?.some(
          (price: any) =>
            price.territory?.toUpperCase() === String(territory).toUpperCase()
        )
      );
    }

    return res.json({
      success: true,
      data: filtered,
      meta: {
        total: filtered.length,
        filters: { search, category, territory, ean },
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Get product by EAN
 * GET /api/products/:ean
 */
router.get('/:ean', (req: Request, res: Response) => {
  try {
    const { ean } = req.params;
    const product = products.find(p => p.ean === ean);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Create new product
 * POST /api/products
 * 
 * Body:
 * {
 *   "ean": "3017620422003",
 *   "name": "Nutella 400g",
 *   "brand": "Ferrero",
 *   "category": "Épicerie sucrée",
 *   "unit": "pot",
 *   "prices": [
 *     {
 *       "price": 4.99,
 *       "store": "carrefour-jarry",
 *       "territory": "GP",
 *       "date": "2026-01-13"
 *     }
 *   ]
 * }
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { ean, name, brand, category, unit, prices } = req.body;

    // Validation
    if (!ean || !name) {
      return res.status(400).json({
        success: false,
        error: 'EAN and name are required',
      });
    }

    // Validate EAN format
    if (!/^\d{8}$|^\d{13}$/.test(ean)) {
      return res.status(400).json({
        success: false,
        error: 'EAN must be 8 or 13 digits',
      });
    }

    // Check if product already exists
    if (products.find(p => p.ean === ean)) {
      return res.status(409).json({
        success: false,
        error: 'Product with this EAN already exists',
      });
    }

    const newProduct = {
      ean,
      name,
      brand: brand || '',
      category: category || 'Non classé',
      unit: unit || 'unité',
      prices: prices || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.push(newProduct);

    return res.status(201).json({
      success: true,
      data: newProduct,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Update product
 * PUT /api/products/:ean
 */
router.put('/:ean', (req: Request, res: Response) => {
  try {
    const { ean } = req.params;
    const index = products.findIndex(p => p.ean === ean);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    const updatedProduct = {
      ...products[index],
      ...req.body,
      ean, // Preserve EAN
      updatedAt: new Date().toISOString(),
    };

    products[index] = updatedProduct;

    return res.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Add price observation to product
 * POST /api/products/:ean/prices
 * 
 * Body:
 * {
 *   "price": 4.99,
 *   "store": "carrefour-jarry",
 *   "territory": "GP",
 *   "date": "2026-01-13"
 * }
 */
router.post('/:ean/prices', (req: Request, res: Response) => {
  try {
    const { ean } = req.params;
    const { price, store, territory, date } = req.body;

    const product = products.find(p => p.ean === ean);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    // Validation
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid price is required',
      });
    }

    if (!store || !territory) {
      return res.status(400).json({
        success: false,
        error: 'Store and territory are required',
      });
    }

    const newPrice = {
      price,
      store,
      territory: territory.toUpperCase(),
      date: date || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
    };

    if (!Array.isArray(product.prices)) {
      product.prices = [];
    }

    product.prices.push(newPrice);
    product.updatedAt = new Date().toISOString();

    return res.status(201).json({
      success: true,
      data: newPrice,
    });
  } catch (error) {
    console.error('Error adding price:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Delete product
 * DELETE /api/products/:ean
 */
router.delete('/:ean', (req: Request, res: Response) => {
  try {
    const { ean } = req.params;
    const index = products.findIndex(p => p.ean === ean);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    const deletedProduct = products.splice(index, 1)[0];

    return res.json({
      success: true,
      data: deletedProduct,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Import products from CSV
 * POST /api/products/import/csv
 * 
 * Body: CSV file content
 */
router.post('/import/csv', async (req: Request, res: Response) => {
  try {
    const csvContent = req.body;

    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'CSV content is required',
      });
    }

    const lines = csvContent.split('\n').filter(Boolean);
    if (lines.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'CSV must contain at least a header and one data row',
      });
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const imported = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',');
        const record: any = {};
        
        headers.forEach((header, index) => {
          record[header] = values[index]?.trim() || '';
        });

        // Validate EAN
        if (!record.ean || !/^\d{8}$|^\d{13}$/.test(record.ean)) {
          errors.push({
            row: i + 1,
            message: 'Invalid EAN format',
            data: record,
          });
          continue;
        }

        // Find or create product
        let product = products.find(p => p.ean === record.ean);
        
        if (!product) {
          product = {
            ean: record.ean,
            name: record.name || 'Produit sans nom',
            brand: record.brand || '',
            category: record.category || 'Non classé',
            unit: record.unit || 'unité',
            prices: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          products.push(product);
        }

        // Add price if provided
        if (record.price && !isNaN(parseFloat(record.price))) {
          product.prices.push({
            price: parseFloat(record.price),
            store: record.store || 'unknown',
            territory: record.territory?.toUpperCase() || 'GP',
            date: record.date || new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
          });
        }

        imported.push(product);
      } catch (error) {
        errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : 'Parse error',
        });
      }
    }

    return res.json({
      success: errors.length === 0,
      imported: imported.length,
      errors: errors.length,
      data: imported,
      errorDetails: errors,
    });
  } catch (error) {
    console.error('Error importing products:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Export products to CSV
 * GET /api/products/export/csv
 */
router.get('/export/csv', (req: Request, res: Response) => {
  try {
    const csv = exportProductsToCSV(products);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting products:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Export products to CSV format
 */
function exportProductsToCSV(products: any[]): string {
  const headers = ['ean', 'name', 'brand', 'category', 'unit', 'price', 'store', 'territory', 'date'];
  const lines = [headers.join(',')];

  products.forEach(product => {
    if (product.prices && Array.isArray(product.prices)) {
      product.prices.forEach((price: any) => {
        const row = [
          product.ean || '',
          product.name || '',
          product.brand || '',
          product.category || '',
          product.unit || '',
          price.price || '',
          price.store || '',
          price.territory || '',
          price.date || '',
        ];
        lines.push(row.join(','));
      });
    } else {
      const row = [
        product.ean || '',
        product.name || '',
        product.brand || '',
        product.category || '',
        product.unit || '',
        '',
        '',
        '',
        '',
      ];
      lines.push(row.join(','));
    }
  });

  return lines.join('\n');
}

/**
 * Initialize with data if available
 */
export function initializeProducts(initialProducts: any[]): void {
  products = initialProducts || [];
}

export default router;
