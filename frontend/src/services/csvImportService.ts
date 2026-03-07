 
/**
 * CSV Import/Export Service
 * 
 * Phase 7: Provides CSV import and export functionality for stores and products
 * Supports validation, error handling, and batch operations
 */

import { parseCsv, stringifyCsv } from '../utils/csv';
import { geocodeAddress, geocodeBatch, type GeocodingResult } from './geocodingService';

export interface StoreCSVRecord {
  name: string;
  chain?: string;
  address: string;
  city?: string;
  territory: string;
  phone?: string;
  lat?: string;
  lon?: string;
  type?: string;
  services?: string;
}

export interface ProductCSVRecord {
  ean: string;
  name: string;
  brand?: string;
  category?: string;
  unit?: string;
  price?: string;
  store?: string;
  territory?: string;
  date?: string;
}

export interface ImportResult<T> {
  success: boolean;
  imported: T[];
  errors: ImportError[];
  total: number;
  successful: number;
  failed: number;
}

export interface ImportError {
  row: number;
  field?: string;
  value?: string;
  message: string;
  data?: any;
}

/**
 * Validate store CSV record
 */
function validateStoreRecord(record: StoreCSVRecord, row: number): ImportError[] {
  const errors: ImportError[] = [];

  // Required fields
  if (!record.name || record.name.trim() === '') {
    errors.push({
      row,
      field: 'name',
      value: record.name,
      message: 'Le nom du magasin est requis',
    });
  }

  if (!record.address || record.address.trim() === '') {
    errors.push({
      row,
      field: 'address',
      value: record.address,
      message: "L'adresse est requise",
    });
  }

  if (!record.territory || record.territory.trim() === '') {
    errors.push({
      row,
      field: 'territory',
      value: record.territory,
      message: 'Le territoire est requis',
    });
  }

  // Validate territory code
  const validTerritories = ['GP', 'MQ', 'GF', 'RE', 'YT', 'PM', 'BL', 'MF', 'WF', 'PF', 'NC'];
  if (record.territory && !validTerritories.includes(record.territory.toUpperCase())) {
    errors.push({
      row,
      field: 'territory',
      value: record.territory,
      message: `Code territoire invalide. Valeurs acceptées: ${validTerritories.join(', ')}`,
    });
  }

  // Validate coordinates if provided
  if (record.lat) {
    const lat = parseFloat(record.lat);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push({
        row,
        field: 'lat',
        value: record.lat,
        message: 'Latitude invalide (doit être entre -90 et 90)',
      });
    }
  }

  if (record.lon) {
    const lon = parseFloat(record.lon);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      errors.push({
        row,
        field: 'lon',
        value: record.lon,
        message: 'Longitude invalide (doit être entre -180 et 180)',
      });
    }
  }

  return errors;
}

/**
 * Validate product CSV record
 */
function validateProductRecord(record: ProductCSVRecord, row: number): ImportError[] {
  const errors: ImportError[] = [];

  // Required fields
  if (!record.ean || record.ean.trim() === '') {
    errors.push({
      row,
      field: 'ean',
      value: record.ean,
      message: 'Le code EAN est requis',
    });
  } else {
    // Validate EAN format (8 or 13 digits)
    const ean = record.ean.trim();
    if (!/^\d{8}$|^\d{13}$/.test(ean)) {
      errors.push({
        row,
        field: 'ean',
        value: record.ean,
        message: 'Le code EAN doit contenir 8 ou 13 chiffres',
      });
    }
  }

  if (!record.name || record.name.trim() === '') {
    errors.push({
      row,
      field: 'name',
      value: record.name,
      message: 'Le nom du produit est requis',
    });
  }

  // Validate price if provided
  if (record.price) {
    const price = parseFloat(record.price);
    if (isNaN(price) || price < 0) {
      errors.push({
        row,
        field: 'price',
        value: record.price,
        message: 'Prix invalide (doit être un nombre positif)',
      });
    }
  }

  return errors;
}

/**
 * Import stores from CSV content
 * 
 * @param csvContent - CSV file content as string
 * @param geocode - Whether to geocode addresses without coordinates
 * @param onProgress - Optional progress callback
 * @returns ImportResult with imported stores and errors
 */
export async function importStoresFromCSV(
  csvContent: string,
  geocode = true,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult<any>> {
  const records = parseCsv(csvContent);
  const imported: any[] = [];
  const errors: ImportError[] = [];

  // Validate all records first
  const validRecords: Array<{ record: StoreCSVRecord; row: number }> = [];
  
  records.forEach((record, index) => {
    // Calculate row number accounting for 0-based index and header row
    const row = index + 2; // +2 because index is 0-based and row 1 is headers
    const storeRecord = record as unknown as StoreCSVRecord;
    const validationErrors = validateStoreRecord(storeRecord, row);
    
    if (validationErrors.length > 0) {
      errors.push(...validationErrors);
    } else {
      validRecords.push({ record: storeRecord, row });
    }
  });

  // Process valid records
  for (let i = 0; i < validRecords.length; i++) {
    const { record, row } = validRecords[i];
    
    if (onProgress) {
      onProgress(i + 1, validRecords.length);
    }

    let lat = record.lat ? parseFloat(record.lat) : undefined;
    let lon = record.lon ? parseFloat(record.lon) : undefined;

    // Geocode if coordinates are missing and geocoding is enabled
    if (geocode && (!lat || !lon)) {
      try {
        const fullAddress = `${record.address}, ${record.city || ''}, ${record.territory}`.trim();
        const result = await geocodeAddress(fullAddress);
        
        if (result.success && result.coordinates) {
          lat = result.coordinates.lat;
          lon = result.coordinates.lon;
        } else {
          errors.push({
            row,
            message: `Géocodage échoué: ${result.error || 'Adresse introuvable'}`,
            data: record,
          });
        }
      } catch (error) {
        errors.push({
          row,
          message: `Erreur de géocodage: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          data: record,
        });
      }
    }

    // Create store object
    const store = {
      id: `${record.territory.toLowerCase()}-${record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: record.name.trim(),
      chain: record.chain?.trim() || record.name.trim(),
      address: record.address.trim(),
      city: record.city?.trim() || '',
      territory: record.territory.toUpperCase(),
      phone: record.phone?.trim() || '',
      type: record.type?.trim() || 'supermarket',
      coordinates: lat && lon ? { lat, lon } : undefined,
      services: record.services ? record.services.split(',').map(s => s.trim()) : [],
    };

    imported.push(store);
  }

  return {
    success: errors.length === 0,
    imported,
    errors,
    total: records.length,
    successful: imported.length,
    failed: errors.length,
  };
}

/**
 * Import products from CSV content
 * 
 * @param csvContent - CSV file content as string
 * @param onProgress - Optional progress callback
 * @returns ImportResult with imported products and errors
 */
export async function importProductsFromCSV(
  csvContent: string,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult<any>> {
  const records = parseCsv(csvContent);
  const imported: any[] = [];
  const errors: ImportError[] = [];

  records.forEach((record, index) => {
    const row = index + 2;
    const productRecord = record as unknown as ProductCSVRecord;
    
    if (onProgress) {
      onProgress(index + 1, records.length);
    }

    const validationErrors = validateProductRecord(productRecord, row);
    
    if (validationErrors.length > 0) {
      errors.push(...validationErrors);
      return;
    }

    // Create product object
    const product = {
      ean: productRecord.ean.trim(),
      name: productRecord.name.trim(),
      brand: productRecord.brand?.trim() || '',
      category: productRecord.category?.trim() || 'Non classé',
      unit: productRecord.unit?.trim() || 'unité',
      prices: productRecord.price ? [{
        price: parseFloat(productRecord.price),
        store: productRecord.store?.trim() || 'unknown',
        territory: productRecord.territory?.toUpperCase() || 'GP',
        date: productRecord.date || new Date().toISOString().split('T')[0],
      }] : [],
    };

    imported.push(product);
  });

  return {
    success: errors.length === 0,
    imported,
    errors,
    total: records.length,
    successful: imported.length,
    failed: errors.length,
  };
}

/**
 * Export stores to CSV format
 * 
 * @param stores - Array of store objects
 * @returns CSV string
 */
export function exportStoresToCSV(stores: any[]): string {
  const records = stores.map(store => ({
    name: store.name || '',
    chain: store.chain || '',
    address: store.address || '',
    city: store.city || '',
    territory: store.territory || '',
    phone: store.phone || '',
    lat: store.coordinates?.lat?.toString() || '',
    lon: store.coordinates?.lon?.toString() || '',
    type: store.type || '',
    services: Array.isArray(store.services) ? store.services.join(',') : '',
  }));

  return stringifyCsv(records);
}

/**
 * Export products to CSV format
 * 
 * @param products - Array of product objects
 * @returns CSV string
 */
export function exportProductsToCSV(products: any[]): string {
  const records: any[] = [];

  products.forEach(product => {
    if (product.prices && Array.isArray(product.prices)) {
      // Create one row per price observation
      product.prices.forEach((price: any) => {
        records.push({
          ean: product.ean || '',
          name: product.name || '',
          brand: product.brand || '',
          category: product.category || '',
          unit: product.unit || '',
          price: price.price?.toString() || '',
          store: price.store || '',
          territory: price.territory || '',
          date: price.date || '',
        });
      });
    } else {
      // Product without prices
      records.push({
        ean: product.ean || '',
        name: product.name || '',
        brand: product.brand || '',
        category: product.category || '',
        unit: product.unit || '',
        price: '',
        store: '',
        territory: '',
        date: '',
      });
    }
  });

  return stringifyCsv(records);
}

/**
 * Generate CSV template for stores
 */
export function generateStoreCSVTemplate(): string {
  const template = [
    {
      name: 'Exemple Carrefour',
      chain: 'Carrefour',
      address: '123 Rue de la République',
      city: 'Pointe-à-Pitre',
      territory: 'GP',
      phone: '0590 00 00 00',
      lat: '16.2415',
      lon: '-61.5331',
      type: 'supermarket',
      services: 'parking,bakery',
    },
  ];

  return stringifyCsv(template);
}

/**
 * Generate CSV template for products
 */
export function generateProductCSVTemplate(): string {
  const template = [
    {
      ean: '3017620422003',
      name: 'Nutella 400g',
      brand: 'Ferrero',
      category: 'Épicerie sucrée',
      unit: 'pot',
      price: '4.99',
      store: 'carrefour-jarry',
      territory: 'GP',
      date: new Date().toISOString().split('T')[0],
    },
  ];

  return stringifyCsv(template);
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
