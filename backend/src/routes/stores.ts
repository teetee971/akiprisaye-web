/**
 * Stores API Routes
 * 
 * Phase 7: REST API endpoints for store management
 * Supports CRUD operations, search, and CSV import/export
 */

import { Router, Request, Response } from 'express';

const router = Router();

// In-memory store for demonstration (replace with database in production)
let stores: any[] = [];

/**
 * Get all stores
 * GET /api/stores
 * 
 * Query params:
 * - territory: Filter by territory code (GP, MQ, etc.)
 * - chain: Filter by chain name
 * - type: Filter by store type
 * - lat, lon, radius: Filter by distance (radius in km)
 */
router.get('/', (req: Request, res: Response) => {
  try {
    let filtered = [...stores];
    const { territory, chain, type, lat, lon, radius } = req.query;

    // Filter by territory
    if (territory) {
      filtered = filtered.filter(
        s => s.territory?.toUpperCase() === String(territory).toUpperCase()
      );
    }

    // Filter by chain
    if (chain) {
      filtered = filtered.filter(
        s => s.chain?.toLowerCase().includes(String(chain).toLowerCase())
      );
    }

    // Filter by type
    if (type) {
      filtered = filtered.filter(
        s => s.type?.toLowerCase() === String(type).toLowerCase()
      );
    }

    // Filter by distance
    if (lat && lon && radius) {
      const userLat = parseFloat(String(lat));
      const userLon = parseFloat(String(lon));
      const maxRadius = parseFloat(String(radius));

      if (!isNaN(userLat) && !isNaN(userLon) && !isNaN(maxRadius)) {
        filtered = filtered.filter(store => {
          if (!store.coordinates) return false;

          const distance = calculateDistance(
            userLat,
            userLon,
            store.coordinates.lat,
            store.coordinates.lon
          );

          return distance <= maxRadius;
        });
      }
    }

    return res.json({
      success: true,
      data: filtered,
      meta: {
        total: filtered.length,
        filters: { territory, chain, type },
      },
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Get store by ID
 * GET /api/stores/:id
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const store = stores.find(s => s.id === id);

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
      });
    }

    return res.json({
      success: true,
      data: store,
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Create new store
 * POST /api/stores
 * 
 * Body:
 * {
 *   "name": "Store Name",
 *   "chain": "Chain Name",
 *   "address": "Full Address",
 *   "city": "City",
 *   "territory": "GP",
 *   "coordinates": { "lat": 16.2415, "lon": -61.5331 },
 *   "phone": "0590 00 00 00",
 *   "type": "supermarket",
 *   "services": ["parking", "bakery"]
 * }
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const {
      name,
      chain,
      address,
      city,
      territory,
      coordinates,
      phone,
      type,
      services,
    } = req.body;

    // Validation
    if (!name || !address || !territory) {
      return res.status(400).json({
        success: false,
        error: 'Name, address, and territory are required',
      });
    }

    // Generate ID
    const id = `${territory.toLowerCase()}-${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`;

    // Check if store already exists
    if (stores.find(s => s.id === id)) {
      return res.status(409).json({
        success: false,
        error: 'Store with this ID already exists',
      });
    }

    const newStore = {
      id,
      name,
      chain: chain || name,
      address,
      city: city || '',
      territory: territory.toUpperCase(),
      coordinates: coordinates || null,
      phone: phone || '',
      type: type || 'supermarket',
      services: services || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    stores.push(newStore);

    return res.status(201).json({
      success: true,
      data: newStore,
    });
  } catch (error) {
    console.error('Error creating store:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Update store
 * PUT /api/stores/:id
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = stores.findIndex(s => s.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
      });
    }

    const updatedStore = {
      ...stores[index],
      ...req.body,
      id, // Preserve ID
      updatedAt: new Date().toISOString(),
    };

    stores[index] = updatedStore;

    return res.json({
      success: true,
      data: updatedStore,
    });
  } catch (error) {
    console.error('Error updating store:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Delete store
 * DELETE /api/stores/:id
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = stores.findIndex(s => s.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
      });
    }

    const deletedStore = stores.splice(index, 1)[0];

    return res.json({
      success: true,
      data: deletedStore,
      message: 'Store deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Import stores from CSV
 * POST /api/stores/import/csv
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

    // Parse CSV (simple implementation)
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

        // Generate ID
        const id = `${record.territory?.toLowerCase()}-${record.name
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')}`;

        // Skip if already exists
        if (stores.find(s => s.id === id)) {
          errors.push({
            row: i + 1,
            message: 'Store already exists',
            data: record,
          });
          continue;
        }

        const newStore = {
          id,
          name: record.name,
          chain: record.chain || record.name,
          address: record.address,
          city: record.city || '',
          territory: record.territory?.toUpperCase() || 'GP',
          coordinates:
            record.lat && record.lon
              ? { lat: parseFloat(record.lat), lon: parseFloat(record.lon) }
              : null,
          phone: record.phone || '',
          type: record.type || 'supermarket',
          services: record.services ? record.services.split(';') : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        stores.push(newStore);
        imported.push(newStore);
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
    console.error('Error importing stores:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Export stores to CSV
 * GET /api/stores/export/csv
 */
router.get('/export/csv', (_req: Request, res: Response) => {
  try {
    const csv = exportStoresToCSV(stores);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=stores.csv');
    
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting stores:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Export stores to CSV format
 */
function exportStoresToCSV(stores: any[]): string {
  const headers = ['name', 'chain', 'address', 'city', 'territory', 'phone', 'lat', 'lon', 'type', 'services'];
  const lines = [headers.join(',')];

  stores.forEach(store => {
    const row = [
      store.name || '',
      store.chain || '',
      store.address || '',
      store.city || '',
      store.territory || '',
      store.phone || '',
      store.coordinates?.lat || '',
      store.coordinates?.lon || '',
      store.type || '',
      Array.isArray(store.services) ? store.services.join(';') : '',
    ];
    lines.push(row.join(','));
  });

  return lines.join('\n');
}

/**
 * Initialize with data from public/data/stores-database.json if available
 */
export function initializeStores(initialStores: any[]): void {
  stores = initialStores || [];
}

export default router;
