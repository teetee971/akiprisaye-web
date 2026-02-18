import {
  createImportJob,
  ensureProductExists,
  insertImportRow,
  insertObservationCentsAndRefreshAggregate,
  updateImportJobProgress,
} from './db';
import type { Env, Territory } from './types';
import { TERRITORIES } from './types';
import { validateRetailer } from './validators';

const REQUIRED_HEADERS = ['ean', 'territory', 'retailer', 'storeLabel', 'price_cents', 'currency', 'observedAt'] as const;
const ALLOWED_TERRITORIES = new Set<Territory>(TERRITORIES);
const EAN_REGEX = /^\d{8,14}$/;

interface UploadPayload {
  filename: string;
  stream: ReadableStream;
  territory: Territory;
  contentType: string;
}

export interface ImportJobResult {
  jobId: string;
  filename: string;
  r2Key: string;
}

interface CsvRow {
  ean: string;
  territory: Territory;
  retailer: string;
  storeLabel: string;
  priceCents: number;
  currency: 'EUR';
  observedAt: string;
  unit?: string;
  quantity?: string;
  promoLabel?: string;
  sourceRef?: string;
  confidence?: number;
}

export async function queueCsvImport(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<ImportJobResult> {
  const upload = await extractUploadPayload(request);
  const jobId = crypto.randomUUID();
  const safeFilename = sanitizeFilename(upload.filename);
  const r2Key = `imports/${jobId}/${safeFilename}`;

  await env.PRICE_IMPORTS.put(r2Key, upload.stream, {
    httpMetadata: {
      contentType: upload.contentType,
    },
  });

  await createImportJob(env.PRICE_DB, {
    id: jobId,
    filename: safeFilename,
    r2Key,
    territory: upload.territory,
    status: 'queued',
  });

  ctx.waitUntil(processCsvImportJob(env, jobId, r2Key));

  return {
    jobId,
    filename: safeFilename,
    r2Key,
  };
}

export async function processCsvImportJob(env: Env, jobId: string, r2Key: string): Promise<void> {
  let totalRows = 0;
  let successRows = 0;
  let errorRows = 0;

  await updateImportJobProgress(env.PRICE_DB, {
    id: jobId,
    status: 'running',
    totalRows,
    successRows,
    errorRows,
    finished: false,
  });

  try {
    const obj = await env.PRICE_IMPORTS.get(r2Key);
    if (!obj?.body) {
      throw new Error('csv_not_found_in_r2');
    }

    const parsed = parseCsvRows(obj.body);
    const first = await parsed.next();
    if (first.done || !first.value.headers) {
      throw new Error('missing_csv_header');
    }

    const headers = first.value.headers;
    for (const header of REQUIRED_HEADERS) {
      if (!headers.includes(header)) {
        throw new Error(`missing_required_column:${header}`);
      }
    }

    for await (const item of parsed) {
      if (!item.row) {
        continue;
      }

      totalRows += 1;
      const rowNumber = item.rowNumber;
      try {
        const validatedRow = validateCsvRow(item.row);

        await ensureProductExists(env.PRICE_DB, {
          ean: validatedRow.ean,
          quantity: validatedRow.quantity,
        });

        await insertObservationCentsAndRefreshAggregate(env.PRICE_DB, {
          ean: validatedRow.ean,
          territory: validatedRow.territory,
          retailer: validatedRow.retailer,
          priceCents: validatedRow.priceCents,
          currency: validatedRow.currency,
          observedAt: validatedRow.observedAt,
          unit: validatedRow.unit,
          storeName: validatedRow.storeLabel,
          source: 'partner',
          confidence: validatedRow.confidence ?? 1,
          metadata: {
            promoLabel: validatedRow.promoLabel,
            sourceRef: validatedRow.sourceRef,
          },
        });

        await insertImportRow(env.PRICE_DB, {
          jobId,
          rowNumber,
          ean: validatedRow.ean,
          retailer: validatedRow.retailer,
          territory: validatedRow.territory,
          priceCents: validatedRow.priceCents,
          status: 'ok',
        });

        successRows += 1;
      } catch (error) {
        errorRows += 1;
        const message = error instanceof Error ? error.message : 'unexpected_row_error';
        await insertImportRow(env.PRICE_DB, {
          jobId,
          rowNumber,
          ean: item.row.ean ?? null,
          retailer: item.row.retailer ?? null,
          territory: item.row.territory ?? null,
          priceCents: item.row.price_cents ? Number(item.row.price_cents) : null,
          status: message.startsWith('invalid_') ? 'invalid' : 'error',
          errorMessage: message,
        });
      }
    }

    const status = errorRows > 0 ? (successRows > 0 ? 'partial' : 'failed') : 'success';
    await updateImportJobProgress(env.PRICE_DB, {
      id: jobId,
      status,
      totalRows,
      successRows,
      errorRows,
      finished: true,
    });
  } catch {
    await updateImportJobProgress(env.PRICE_DB, {
      id: jobId,
      status: 'failed',
      totalRows,
      successRows,
      errorRows: Math.max(errorRows, 1),
      finished: true,
    });
  }
}

async function extractUploadPayload(request: Request): Promise<UploadPayload> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('file') ?? form.get('csv');
    if (!file || typeof file !== 'object' || !('stream' in file) || !('name' in file)) {
      throw new Error('invalid_multipart_payload');
    }
    const csvFile = file as { name: string; stream: () => ReadableStream; type?: string };

    const territoryValue = String(form.get('territory') ?? '').trim().toLowerCase();
    if (!ALLOWED_TERRITORIES.has(territoryValue as Territory)) {
      throw new Error('invalid_territory');
    }

    return {
      filename: String(csvFile.name || 'import.csv'),
      stream: csvFile.stream(),
      territory: territoryValue as Territory,
      contentType: String(csvFile.type || 'text/csv'),
    };
  }

  if (!contentType.includes('text/csv') && !contentType.includes('application/csv')) {
    throw new Error('unsupported_content_type');
  }

  if (!request.body) {
    throw new Error('empty_csv_payload');
  }

  const territoryValue = new URL(request.url).searchParams.get('territory')?.trim().toLowerCase();
  if (!territoryValue || !ALLOWED_TERRITORIES.has(territoryValue as Territory)) {
    throw new Error('invalid_territory');
  }

  const filename = request.headers.get('x-filename') ?? 'import.csv';
  return {
    filename,
    stream: request.body,
    territory: territoryValue as Territory,
    contentType: 'text/csv',
  };
}

function sanitizeFilename(filename: string): string {
  const safe = filename.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
  return safe.length > 0 ? safe : 'import.csv';
}

function validateCsvRow(row: Record<string, string>): CsvRow {
  const ean = (row.ean ?? '').trim();
  if (!EAN_REGEX.test(ean)) {
    throw new Error('invalid_ean');
  }

  const territoryValue = (row.territory ?? '').trim().toLowerCase() as Territory;
  if (!ALLOWED_TERRITORIES.has(territoryValue)) {
    throw new Error('invalid_territory');
  }

  const retailer = validateRetailer((row.retailer ?? '').trim().toLowerCase());
  if (!retailer || !['carrefour','leclerc','intermarche','superu','auchan','match','autre'].includes(retailer)) {
    throw new Error('invalid_retailer');
  }

  const priceCents = Number((row.price_cents ?? '').trim());
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    throw new Error('invalid_price_cents');
  }

  const currency = (row.currency ?? '').trim();
  if (currency !== 'EUR') {
    throw new Error('invalid_currency');
  }

  const observedAt = (row.observedAt ?? '').trim();
  if (!Number.isFinite(Date.parse(observedAt))) {
    throw new Error('invalid_observedAt');
  }

  const storeLabel = (row.storeLabel ?? '').trim();
  if (!storeLabel) {
    throw new Error('invalid_storeLabel');
  }

  const confidenceRaw = (row.confidence ?? '').trim();
  let confidence: number | undefined;
  if (confidenceRaw) {
    confidence = Number(confidenceRaw);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new Error('invalid_confidence');
    }
  }

  return {
    ean,
    territory: territoryValue,
    retailer,
    storeLabel,
    priceCents,
    currency: 'EUR',
    observedAt: new Date(observedAt).toISOString(),
    unit: (row.unit ?? '').trim() || undefined,
    quantity: (row.quantity ?? '').trim() || undefined,
    promoLabel: (row.promoLabel ?? '').trim() || undefined,
    sourceRef: (row.sourceRef ?? '').trim() || undefined,
    confidence,
  };
}

async function* parseCsvRows(
  stream: ReadableStream,
): AsyncGenerator<{ headers?: string[]; rowNumber: number; row?: Record<string, string> }> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let inQuotes = false;
  let field = '';
  let row: string[] = [];
  let headers: string[] | null = null;
  let rowNumber = 0;

  const emitRow = async () => {
    if (row.length === 1 && row[0] === '' && field === '') {
      row = [];
      return null;
    }

    row.push(field);
    field = '';

    if (!headers) {
      headers = row.map((col) => col.trim());
      row = [];
      return { headers, rowNumber: 0 };
    }

    rowNumber += 1;
    const mapped: Record<string, string> = {};
    headers.forEach((header, idx) => {
      mapped[header] = (row[idx] ?? '').trim();
    });
    row = [];
    return { rowNumber, row: mapped };
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += typeof value === 'string' ? value : decoder.decode(value, { stream: true });

    let i = 0;
    while (i < buffer.length) {
      const char = buffer[i];

      if (char === '"') {
        const next = buffer[i + 1];
        if (inQuotes && next === '"') {
          field += '"';
          i += 2;
          continue;
        }

        inQuotes = !inQuotes;
        i += 1;
        continue;
      }

      if (!inQuotes && char === ',') {
        row.push(field);
        field = '';
        i += 1;
        continue;
      }

      if (!inQuotes && (char === '\n' || char === '\r')) {
        if (char === '\r' && buffer[i + 1] === '\n') {
          i += 1;
        }

        const emitted = await emitRow();
        if (emitted) {
          yield emitted;
        }
        i += 1;
        continue;
      }

      field += char;
      i += 1;
    }

    buffer = '';
  }

  buffer += decoder.decode();

  if (field.length > 0 || row.length > 0) {
    const emitted = await emitRow();
    if (emitted) {
      yield emitted;
    }
  }
}
