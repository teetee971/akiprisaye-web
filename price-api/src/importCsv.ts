import { insertObservationAndRefreshAggregate, upsertProduct } from './db';
import type { Env, Territory } from './types';

export const CSV_IMPORT_HEADERS = [
  'ean',
  'product_name',
  'brand',
  'territory',
  'retailer',
  'store_name',
  'price_eur',
  'observed_at',
  'currency',
] as const;

const EAN_REGEX = /^[0-9]{8,14}$/;
const UTC_ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const PRICE_REGEX = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

export interface CsvImportRowError {
  line: number;
  reason: string;
}

export interface CsvImportResult {
  status: 'success' | 'partial' | 'failed';
  processedRows: number;
  insertedRows: number;
  errors: CsvImportRowError[];
}

interface ParsedCsvRow {
  ean: string;
  productName: string;
  brand: string;
  territory: Territory;
  retailer: string;
  storeName: string;
  price: number;
  observedAt: string;
  currency: 'EUR';
}

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeRetailer(value: string): string {
  const collapsed = collapseWhitespace(value);
  const normalized = collapsed.toLowerCase();

  if (normalized === 'carrefour') return 'carrefour';
  if (normalized === 'e.leclerc' || normalized === 'e leclerc' || normalized === 'leclerc') return 'leclerc';
  if (normalized === 'super u' || normalized === 'super-u' || normalized === 'superu') return 'superu';
  if (normalized === 'intermarche' || normalized === 'intermarché') return 'intermarché';

  return normalized;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (inQuotes) {
    throw new Error('unclosed quoted field');
  }

  cells.push(current);
  return cells;
}

function parseHeader(line: string): void {
  const headers = parseCsvLine(line).map((header) => header.trim());

  if (headers.length !== CSV_IMPORT_HEADERS.length) {
    throw new Error('invalid CSV header: missing or extra column');
  }

  for (let i = 0; i < CSV_IMPORT_HEADERS.length; i += 1) {
    if (headers[i] !== CSV_IMPORT_HEADERS[i]) {
      throw new Error(`invalid CSV header order at column ${i + 1}: expected ${CSV_IMPORT_HEADERS[i]}`);
    }
  }
}

function parseTerritory(rawValue: string): Territory | null {
  if (rawValue === 'fr' || rawValue === 'gp' || rawValue === 'mq') {
    return rawValue;
  }

  return null;
}

function parsePrice(rawValue: string): number | null {
  if (!PRICE_REGEX.test(rawValue)) {
    return null;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseObservedAt(rawValue: string): string | null {
  if (!UTC_ISO_REGEX.test(rawValue)) {
    return null;
  }

  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function parseDataRow(line: string, lineNumber: number): { row?: ParsedCsvRow; error?: CsvImportRowError } {
  let cells: string[];

  try {
    cells = parseCsvLine(line);
  } catch (error) {
    return {
      error: {
        line: lineNumber,
        reason: error instanceof Error ? error.message : 'invalid csv row',
      },
    };
  }

  if (cells.length !== CSV_IMPORT_HEADERS.length) {
    return {
      error: {
        line: lineNumber,
        reason: `invalid column count: expected ${CSV_IMPORT_HEADERS.length}, got ${cells.length}`,
      },
    };
  }

  const [eanRaw, productNameRaw, brandRaw, territoryRaw, retailerRaw, storeNameRaw, priceRaw, observedAtRaw, currencyRaw] =
    cells.map((cell) => cell.trim());

  if (!EAN_REGEX.test(eanRaw)) {
    return { error: { line: lineNumber, reason: 'ean must match ^[0-9]{8,14}$' } };
  }

  const productName = collapseWhitespace(productNameRaw);
  if (!productName) {
    return { error: { line: lineNumber, reason: 'product_name is required' } };
  }

  const brand = collapseWhitespace(brandRaw);
  if (!brand) {
    return { error: { line: lineNumber, reason: 'brand is required' } };
  }

  const territory = parseTerritory(territoryRaw);
  if (!territory) {
    return { error: { line: lineNumber, reason: "territory must be one of 'fr', 'gp', 'mq'" } };
  }

  const retailerCollapsed = collapseWhitespace(retailerRaw);
  if (!retailerCollapsed) {
    return { error: { line: lineNumber, reason: 'retailer is required' } };
  }

  const storeName = collapseWhitespace(storeNameRaw);
  if (!storeName) {
    return { error: { line: lineNumber, reason: 'store_name is required' } };
  }

  const price = parsePrice(priceRaw);
  if (price === null) {
    return { error: { line: lineNumber, reason: 'price_eur must be a decimal > 0 with up to 2 decimals' } };
  }

  const observedAt = parseObservedAt(observedAtRaw);
  if (!observedAt) {
    return { error: { line: lineNumber, reason: 'observed_at must be a strict ISO 8601 UTC datetime' } };
  }

  if (currencyRaw !== 'EUR') {
    return { error: { line: lineNumber, reason: 'currency must be EUR' } };
  }

  return {
    row: {
      ean: eanRaw,
      productName,
      brand,
      territory,
      retailer: normalizeRetailer(retailerCollapsed),
      storeName,
      price,
      observedAt,
      currency: 'EUR',
    },
  };
}

export async function importCsvContent(csvContent: string, env: Env): Promise<CsvImportResult> {
  const lines = csvContent
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error('empty CSV payload');
  }

  parseHeader(lines[0]);

  const errors: CsvImportRowError[] = [];
  let insertedRows = 0;
  let processedRows = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    const parsed = parseDataRow(lines[i], lineNumber);
    processedRows += 1;

    if (!parsed.row) {
      errors.push(parsed.error ?? { line: lineNumber, reason: 'invalid row' });
      continue;
    }

    await upsertProduct(env.PRICE_DB, {
      ean: parsed.row.ean,
      productName: parsed.row.productName,
      brand: parsed.row.brand,
    });

    await insertObservationAndRefreshAggregate(env.PRICE_DB, {
      ean: parsed.row.ean,
      territory: parsed.row.territory,
      retailer: parsed.row.retailer,
      price: parsed.row.price,
      currency: parsed.row.currency,
      observedAt: parsed.row.observedAt,
      storeName: parsed.row.storeName,
      source: 'admin',
      confidence: 1,
      metadata: {
        import: 'csv_v1',
      },
    });

    insertedRows += 1;
  }

  let status: CsvImportResult['status'] = 'success';
  if (insertedRows === 0) {
    status = 'failed';
  } else if (errors.length > 0) {
    status = 'partial';
  }

  return {
    status,
    processedRows,
    insertedRows,
    errors,
  };
}

export const PRICE_IMPORT_TEMPLATE_V1 = `${CSV_IMPORT_HEADERS.join(',')}\n3560070894222,Sirop Cerise 75cl,Carrefour,gp,Carrefour,Carrefour Jarry,4.10,2026-02-17T18:35:00Z,EUR\n`;
