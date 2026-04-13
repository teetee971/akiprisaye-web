/**
 * Export Service
 * Generates inflation reports in various formats (CSV, JSON, XLSX)
 */

import * as XLSX from '@e965/xlsx';
import { Territory } from '../../config/inflationConfig.js';
import { prisma } from '../../app.js';

/**
 * Export format types
 */
export type ExportFormat = 'csv' | 'json' | 'xlsx';

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  territory?: Territory;
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
  includeCategories?: boolean;
  includeMetroComparison?: boolean;
}

/**
 * Inflation data for export
 */
export interface InflationExportData {
  territory: Territory;
  year: number;
  month: number;
  indexValue: number;
  inflationRate: number;
  monthlyChange: number;
  categories?: Array<{
    category: string;
    indexValue: number;
    weight: number;
    contribution: number;
  }>;
  metroComparison?: {
    metroIndex: number;
    priceGapPercent: number;
  };
}

/**
 * Export inflation data to CSV
 */
export async function exportToCSV(data: InflationExportData[]): Promise<string> {
  try {
    const headers = [
      'Territory',
      'Year',
      'Month',
      'Price Index',
      'Inflation Rate (%)',
      'Monthly Change (%)',
    ];

    const rows = data.map(row => [
      row.territory,
      row.year.toString(),
      row.month.toString(),
      row.indexValue.toFixed(2),
      row.inflationRate.toFixed(2),
      row.monthlyChange.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    return csvContent;
  } catch (error) {
    console.error('[Export] Error exporting to CSV:', error);
    throw error;
  }
}

/**
 * Export inflation data to JSON
 */
export async function exportToJSON(data: InflationExportData[]): Promise<string> {
  try {
    const exportData = {
      generatedAt: new Date().toISOString(),
      dataPoints: data.length,
      data,
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('[Export] Error exporting to JSON:', error);
    throw error;
  }
}

/**
 * Export inflation data to XLSX
 */
export async function exportToXLSX(data: InflationExportData[]): Promise<Buffer> {
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Main sheet: Overall indices
    const mainData = data.map(row => ({
      Territory: row.territory,
      Year: row.year,
      Month: row.month,
      'Price Index': row.indexValue,
      'Inflation Rate (%)': row.inflationRate,
      'Monthly Change (%)': row.monthlyChange,
    }));

    const mainSheet = XLSX.utils.json_to_sheet(mainData);
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'Overview');

    // Category sheet (if data includes categories)
    const categoryData: Array<{
      Territory: string;
      Year: number;
      Month: number;
      Category: string;
      Index: number;
      Weight: number;
      Contribution: number;
    }> = [];

    data.forEach(row => {
      if (row.categories) {
        row.categories.forEach(cat => {
          categoryData.push({
            Territory: row.territory,
            Year: row.year,
            Month: row.month,
            Category: cat.category,
            Index: cat.indexValue,
            Weight: cat.weight,
            Contribution: cat.contribution,
          });
        });
      }
    });

    if (categoryData.length > 0) {
      const categorySheet = XLSX.utils.json_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categories');
    }

    // Metro comparison sheet (if data includes comparison)
    const metroData: Array<{
      Territory: string;
      Year: number;
      Month: number;
      'DOM-TOM Index': number;
      'Metro Index': number;
      'Gap (%)': number;
    }> = [];

    data.forEach(row => {
      if (row.metroComparison) {
        metroData.push({
          Territory: row.territory,
          Year: row.year,
          Month: row.month,
          'DOM-TOM Index': row.indexValue,
          'Metro Index': row.metroComparison.metroIndex,
          'Gap (%)': row.metroComparison.priceGapPercent,
        });
      }
    });

    if (metroData.length > 0) {
      const metroSheet = XLSX.utils.json_to_sheet(metroData);
      XLSX.utils.book_append_sheet(workbook, metroSheet, 'Metro Comparison');
    }

    // Write to buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  } catch (error) {
    console.error('[Export] Error exporting to XLSX:', error);
    throw error;
  }
}

/**
 * Get inflation data for export based on options
 */
export async function getExportData(options: ExportOptions): Promise<InflationExportData[]> {
  try {
    const where: {
      territory?: Territory;
      year?: { gte?: number; lte?: number };
      month?: { gte?: number; lte?: number };
    } = {};

    if (options.territory) {
      where.territory = options.territory;
    }

    if (options.startYear || options.endYear) {
      where.year = {};
      if (options.startYear) where.year.gte = options.startYear;
      if (options.endYear) where.year.lte = options.endYear;
    }

    const priceIndices = await prisma.priceIndex.findMany({
      where,
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    const exportData: InflationExportData[] = [];

    for (const index of priceIndices) {
      const data: InflationExportData = {
        territory: index.territory as Territory,
        year: index.year,
        month: index.month,
        indexValue: index.indexValue,
        inflationRate: index.inflationRate,
        monthlyChange: index.monthlyChange,
      };

      // Include category data if requested
      if (options.includeCategories) {
        const categories = await prisma.categoryIndex.findMany({
          where: {
            territory: index.territory,
            year: index.year,
            month: index.month,
          },
        });

        data.categories = categories.map(cat => ({
          category: cat.category,
          indexValue: cat.indexValue,
          weight: cat.weight,
          contribution: cat.contribution,
        }));
      }

      // Include metro comparison if requested
      if (options.includeMetroComparison) {
        // Compute average metro reference price for the territory's basket in
        // this period, then derive the gap against the DOM-TOM index value.
        const metroRefs = await prisma.metroReferencePrice.findMany({
          where: { year: index.year, month: index.month },
        });

        if (metroRefs.length > 0) {
          const avgMetroPrice =
            metroRefs.reduce((sum, r) => sum + r.averagePrice, 0) / metroRefs.length;
          // Express metro average as an index relative to base 100.
          // We use the same base value as the territory index.
          const metroIndex = (avgMetroPrice / index.baseValue) * 100;
          const priceGapPercent =
            metroIndex > 0
              ? ((index.indexValue - metroIndex) / metroIndex) * 100
              : 0;
          data.metroComparison = {
            metroIndex: parseFloat(metroIndex.toFixed(2)),
            priceGapPercent: parseFloat(priceGapPercent.toFixed(2)),
          };
        } else {
          // No metro reference data available for this period.
          data.metroComparison = { metroIndex: 100, priceGapPercent: 0 };
        }
      }

      exportData.push(data);
    }

    return exportData;
  } catch (error) {
    console.error('[Export] Error getting export data:', error);
    throw error;
  }
}

/**
 * Generate export file based on format
 */
export async function generateExport(options: ExportOptions): Promise<string | Buffer> {
  try {
    const data = await getExportData(options);

    switch (options.format) {
      case 'csv':
        return await exportToCSV(data);
      case 'json':
        return await exportToJSON(data);
      case 'xlsx':
        return await exportToXLSX(data);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  } catch (error) {
    console.error('[Export] Error generating export:', error);
    throw error;
  }
}
