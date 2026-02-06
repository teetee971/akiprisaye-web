/**
 * Tests for CSV Import Service
 * Phase 7: Test CSV import/export for stores and products
 */

import { describe, it, expect } from 'vitest';
import {
  importStoresFromCSV,
  importProductsFromCSV,
  exportStoresToCSV,
  exportProductsToCSV,
  generateStoreCSVTemplate,
  generateProductCSVTemplate,
} from '../csvImportService';

describe('CSV Import Service', () => {
  describe('importStoresFromCSV', () => {
    it('should import valid store data', async () => {
      const csv = `name,chain,address,city,territory,phone,lat,lon,type,services
Carrefour Jarry,Carrefour,Zone Industrielle de Jarry,Baie-Mahault,GP,0590 83 00 00,16.235,-61.54,hypermarket,parking;bakery`;

      const result = await importStoresFromCSV(csv, false); // Skip geocoding

      expect(result.success).toBe(true);
      expect(result.imported).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.imported[0].name).toBe('Carrefour Jarry');
      expect(result.imported[0].coordinates).toEqual({ lat: 16.235, lon: -61.54 });
    });

    it('should validate required fields', async () => {
      const csv = `name,chain,address,city,territory,phone,lat,lon,type,services
,Carrefour,Zone Industrielle de Jarry,Baie-Mahault,GP,0590 83 00 00,16.235,-61.54,hypermarket,parking`;

      const result = await importStoresFromCSV(csv, false);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('name');
    });

    it('should validate territory codes', async () => {
      const csv = `name,chain,address,city,territory,phone,lat,lon,type,services
Test Store,Test,Test Address,Test City,INVALID,0590 00 00 00,16.235,-61.54,supermarket,parking`;

      const result = await importStoresFromCSV(csv, false);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('territory');
    });

    it('should validate coordinates', async () => {
      const csv = `name,chain,address,city,territory,phone,lat,lon,type,services
Test Store,Test,Test Address,Test City,GP,0590 00 00 00,91.0,-61.54,supermarket,parking`;

      const result = await importStoresFromCSV(csv, false);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('lat');
    });

    it('should handle empty CSV', async () => {
      const csv = `name,chain,address,city,territory,phone,lat,lon,type,services`;

      const result = await importStoresFromCSV(csv, false);

      expect(result.total).toBe(0);
      expect(result.imported).toHaveLength(0);
    });
  });

  describe('importProductsFromCSV', () => {
    it('should import valid product data', async () => {
      const csv = `ean,name,brand,category,unit,price,store,territory,date
3017620422003,Nutella 400g,Ferrero,Épicerie sucrée,pot,4.99,carrefour-jarry,GP,2026-01-13`;

      const result = await importProductsFromCSV(csv);

      expect(result.success).toBe(true);
      expect(result.imported).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.imported[0].ean).toBe('3017620422003');
      expect(result.imported[0].name).toBe('Nutella 400g');
    });

    it('should validate EAN format', async () => {
      const csv = `ean,name,brand,category,unit,price,store,territory,date
123,Invalid Product,Brand,Category,unit,4.99,store,GP,2026-01-13`;

      const result = await importProductsFromCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('ean');
    });

    it('should validate required fields', async () => {
      const csv = `ean,name,brand,category,unit,price,store,territory,date
3017620422003,,Brand,Category,unit,4.99,store,GP,2026-01-13`;

      const result = await importProductsFromCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('name');
    });

    it('should validate price format', async () => {
      const csv = `ean,name,brand,category,unit,price,store,territory,date
3017620422003,Product Name,Brand,Category,unit,invalid,store,GP,2026-01-13`;

      const result = await importProductsFromCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('price');
    });
  });

  describe('exportStoresToCSV', () => {
    it('should export stores to CSV format', () => {
      const stores = [
        {
          name: 'Carrefour Jarry',
          chain: 'Carrefour',
          address: 'Zone Industrielle de Jarry',
          city: 'Baie-Mahault',
          territory: 'GP',
          phone: '0590 83 00 00',
          coordinates: { lat: 16.235, lon: -61.54 },
          type: 'hypermarket',
          services: ['parking', 'bakery'],
        },
      ];

      const csv = exportStoresToCSV(stores);

      expect(csv).toContain('name,chain,address');
      expect(csv).toContain('Carrefour Jarry');
      expect(csv).toContain('16.235');
      expect(csv).toContain('-61.54');
    });
  });

  describe('exportProductsToCSV', () => {
    it('should export products to CSV format', () => {
      const products = [
        {
          ean: '3017620422003',
          name: 'Nutella 400g',
          brand: 'Ferrero',
          category: 'Épicerie sucrée',
          unit: 'pot',
          prices: [
            {
              price: 4.99,
              store: 'carrefour-jarry',
              territory: 'GP',
              date: '2026-01-13',
            },
          ],
        },
      ];

      const csv = exportProductsToCSV(products);

      expect(csv).toContain('ean,name,brand');
      expect(csv).toContain('3017620422003');
      expect(csv).toContain('Nutella 400g');
      expect(csv).toContain('4.99');
    });

    it('should handle products without prices', () => {
      const products = [
        {
          ean: '3017620422003',
          name: 'Product Without Price',
          brand: 'Brand',
          category: 'Category',
          unit: 'unit',
        },
      ];

      const csv = exportProductsToCSV(products);

      expect(csv).toContain('3017620422003');
      expect(csv).toContain('Product Without Price');
    });
  });

  describe('templates', () => {
    it('should generate store CSV template', () => {
      const template = generateStoreCSVTemplate();

      expect(template).toContain('name,chain,address');
      expect(template).toContain('Exemple Carrefour');
    });

    it('should generate product CSV template', () => {
      const template = generateProductCSVTemplate();

      expect(template).toContain('ean,name,brand');
      expect(template).toContain('3017620422003');
    });
  });
});
