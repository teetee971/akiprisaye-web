/**
 * Export Service
 * 
 * Exports inflation data in various formats (CSV, JSON, XLSX).
 */

import { PrismaClient } from '@prisma/client';
import Papa from 'papaparse';
import * as XLSX from '@e965/xlsx';
import { INFLATION_CONFIG } from '../../config/inflationConfig.js';
import { getInflationHistory } from './historyService.js';
import { getMetroComparison } from './metroComparisonService.js';
import { getAllCategoriesInflation } from './categoryAnalysisService.js';
import { getTopMovers } from './topMoversService.js';

const prisma = new PrismaClient();

export type ExportFormat = 'csv' | 'json' | 'xlsx';
export type ExportType = 'indices' | 'categories' | 'metro-comparison' | 'top-movers' | 'full-report';

export interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  territory?: string;
  startPeriod?: string;
  endPeriod?: string;
  period?: string;
}

export interface ExportResult {
  format: ExportFormat;
  data: string | Buffer;
  filename: string;
  mimeType: string;
}

/**
 * Export inflation data based on options
 */
export async function exportInflationData(options: ExportOptions): Promise<ExportResult> {
  try {
    const { format, type } = options;

    // Get the data based on type
    let data: any;
    let filename: string;

    switch (type) {
      case 'indices':
        data = await exportIndices(options);
        filename = `inflation-indices-${options.territory || 'all'}-${options.period || 'history'}`;
        break;

      case 'categories':
        data = await exportCategories(options);
        filename = `inflation-categories-${options.territory || 'all'}-${options.period}`;
        break;

      case 'metro-comparison':
        data = await exportMetroComparison(options);
        filename = `metro-comparison-${options.territory || 'all'}-${options.period}`;
        break;

      case 'top-movers':
        data = await exportTopMovers(options);
        filename = `top-movers-${options.territory || 'all'}-${options.period}`;
        break;

      case 'full-report':
        data = await exportFullReport(options);
        filename = `inflation-report-${options.territory || 'all'}-${options.period}`;
        break;

      default:
        throw new Error(`Unknown export type: ${type}`);
    }

    // Convert to requested format
    return convertToFormat(data, format, filename);
  } catch (error) {
    console.error('Error exporting inflation data:', error);
    throw error;
  }
}

/**
 * Export price indices
 */
async function exportIndices(options: ExportOptions): Promise<any[]> {
  const { territory, startPeriod, endPeriod, period } = options;

  if (startPeriod && endPeriod && territory) {
    // Export historical data for one territory
    const history = await getInflationHistory(territory, startPeriod, endPeriod);
    return history.dataPoints.map(point => ({
      territory,
      territoryName: INFLATION_CONFIG.territoryNames[territory as keyof typeof INFLATION_CONFIG.territoryNames],
      period: point.period,
      indexValue: point.indexValue,
      monthlyChange: point.monthlyChange,
      yearlyChange: point.yearlyChange,
      basketPrice: point.basketPrice,
    }));
  }

  // Export single period for all territories
  const targetPeriod = period || new Date().toISOString().slice(0, 7);
  const indices = await prisma.priceIndex.findMany({
    where: {
      period: targetPeriod,
      ...(territory && { territory }),
    },
    orderBy: { territory: 'asc' },
  });

  return indices.map(index => ({
    territory: index.territory,
    territoryName: INFLATION_CONFIG.territoryNames[index.territory as keyof typeof INFLATION_CONFIG.territoryNames] || index.territory,
    period: index.period,
    indexValue: index.indexValue,
    monthlyChange: index.monthlyChange,
    yearlyChange: index.yearlyChange,
    basketPrice: index.basketPrice,
    productCount: index.productCount,
    confidence: index.confidence,
  }));
}

/**
 * Export category analysis
 */
async function exportCategories(options: ExportOptions): Promise<any[]> {
  const { territory, period } = options;

  if (!territory || !period) {
    throw new Error('Territory and period are required for category export');
  }

  const categories = await getAllCategoriesInflation(territory, period);

  const rows: any[] = [];
  for (const cat of categories) {
    rows.push({
      territory,
      territoryName: INFLATION_CONFIG.territoryNames[territory as keyof typeof INFLATION_CONFIG.territoryNames],
      period,
      category: cat.category,
      categoryName: cat.categoryName,
      indexValue: cat.indexValue,
      monthlyChange: cat.monthlyChange,
      yearlyChange: cat.yearlyChange,
      averagePrice: cat.averagePrice,
      productCount: cat.productCount,
    });
  }

  return rows;
}

/**
 * Export metro comparison
 */
async function exportMetroComparison(options: ExportOptions): Promise<any[]> {
  const { territory, period } = options;

  if (!territory || !period) {
    throw new Error('Territory and period are required for metro comparison export');
  }

  const comparison = await getMetroComparison(territory, period);

  const rows: any[] = [];

  // Add overall comparison
  rows.push({
    type: 'overall',
    territory,
    territoryName: comparison.territoryName,
    period,
    category: 'ALL',
    categoryName: 'Tous les produits',
    domValue: comparison.domIndex,
    metroValue: comparison.metroIndex,
    gap: comparison.overallGap,
    gapAmount: comparison.basketPriceGap,
  });

  // Add category comparisons
  for (const cat of comparison.categoryComparison) {
    rows.push({
      type: 'category',
      territory,
      territoryName: comparison.territoryName,
      period,
      category: cat.category,
      categoryName: cat.categoryName,
      domValue: cat.domPrice,
      metroValue: cat.metroPrice,
      gap: cat.gap,
      gapAmount: cat.gapAmount,
    });
  }

  return rows;
}

/**
 * Export top movers
 */
async function exportTopMovers(options: ExportOptions): Promise<any[]> {
  const { territory, period } = options;

  if (!territory || !period) {
    throw new Error('Territory and period are required for top movers export');
  }

  const movers = await getTopMovers(territory, period, 20);

  const rows: any[] = [];

  // Export increases
  for (const mover of movers.topIncreases) {
    rows.push({
      territory,
      period,
      type: 'increase',
      productName: mover.productName,
      category: mover.category,
      categoryName: mover.categoryName,
      oldPrice: mover.oldPrice,
      newPrice: mover.newPrice,
      change: mover.change,
      changeAmount: mover.changeAmount,
    });
  }

  // Export decreases
  for (const mover of movers.topDecreases) {
    rows.push({
      territory,
      period,
      type: 'decrease',
      productName: mover.productName,
      category: mover.category,
      categoryName: mover.categoryName,
      oldPrice: mover.oldPrice,
      newPrice: mover.newPrice,
      change: mover.change,
      changeAmount: mover.changeAmount,
    });
  }

  return rows;
}

/**
 * Export full report with all data
 */
async function exportFullReport(options: ExportOptions): Promise<Record<string, any[]>> {
  const { territory, period } = options;

  if (!territory || !period) {
    throw new Error('Territory and period are required for full report export');
  }

  return {
    indices: await exportIndices({ ...options, type: 'indices' }),
    categories: await exportCategories(options),
    metroComparison: await exportMetroComparison(options),
    topMovers: await exportTopMovers(options),
  };
}

/**
 * Convert data to requested format
 */
function convertToFormat(
  data: any,
  format: ExportFormat,
  filename: string
): ExportResult {
  switch (format) {
    case 'json':
      return {
        format: 'json',
        data: JSON.stringify(data, null, 2),
        filename: `${filename}.json`,
        mimeType: 'application/json',
      };

    case 'csv':
      // If data is an object with multiple sheets, export first sheet
      const csvData = Array.isArray(data) ? data : Object.values(data)[0];
      const csv = Papa.unparse(csvData);
      return {
        format: 'csv',
        data: csv,
        filename: `${filename}.csv`,
        mimeType: 'text/csv',
      };

    case 'xlsx':
      return convertToXLSX(data, filename);

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Convert data to XLSX format
 */
function convertToXLSX(data: any, filename: string): ExportResult {
  const workbook = XLSX.utils.book_new();

  if (Array.isArray(data)) {
    // Single sheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  } else {
    // Multiple sheets
    for (const [sheetName, sheetData] of Object.entries(data)) {
      if (Array.isArray(sheetData)) {
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    }
  }

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return {
    format: 'xlsx',
    data: buffer,
    filename: `${filename}.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

/**
 * Generate export for API endpoint
 */
export async function generateExportForAPI(
  options: ExportOptions
): Promise<ExportResult> {
  return exportInflationData(options);
}
