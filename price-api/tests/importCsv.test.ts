import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/db', () => ({
  insertObservationAndRefreshAggregate: vi.fn(async () => undefined),
  upsertProduct: vi.fn(async () => undefined),
}));

import { insertObservationAndRefreshAggregate, upsertProduct } from '../src/db';
import { CSV_IMPORT_HEADERS, importCsvContent } from '../src/importCsv';
import type { Env } from '../src/types';

const baseRow = '3560070894222,Sirop Cerise 75cl,Carrefour,gp,Carrefour,Carrefour Jarry,4.10,2026-02-17T18:35:00Z,EUR';

function makeEnv(): Env {
  return {
    PRICE_DB: {} as D1Database,
    PRICE_ADMIN_TOKEN: 'token',
  };
}

describe('importCsvContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid header', async () => {
    const csv = `bad,header\n${baseRow}`;

    await expect(importCsvContent(csv, makeEnv())).rejects.toThrow(/invalid CSV header/);
  });

  it('rejects missing column in header', async () => {
    const invalidHeader = CSV_IMPORT_HEADERS.slice(0, CSV_IMPORT_HEADERS.length - 1).join(',');
    const csv = `${invalidHeader}\n${baseRow}`;

    await expect(importCsvContent(csv, makeEnv())).rejects.toThrow(/missing or extra column/);
  });

  it('rejects invalid territory row', async () => {
    const csv = `${CSV_IMPORT_HEADERS.join(',')}\n3560070894222,Sirop Cerise 75cl,Carrefour,re,Carrefour,Carrefour Jarry,4.10,2026-02-17T18:35:00Z,EUR`;
    const result = await importCsvContent(csv, makeEnv());

    expect(result.status).toBe('failed');
    expect(result.errors[0]?.reason).toMatch(/territory/);
    expect(upsertProduct).not.toHaveBeenCalled();
    expect(insertObservationAndRefreshAggregate).not.toHaveBeenCalled();
  });

  it('rejects negative price row', async () => {
    const csv = `${CSV_IMPORT_HEADERS.join(',')}\n3560070894222,Sirop Cerise 75cl,Carrefour,gp,Carrefour,Carrefour Jarry,-4.10,2026-02-17T18:35:00Z,EUR`;
    const result = await importCsvContent(csv, makeEnv());

    expect(result.status).toBe('failed');
    expect(result.errors[0]?.reason).toMatch(/price_eur/);
  });

  it('rejects non-EUR currency row', async () => {
    const csv = `${CSV_IMPORT_HEADERS.join(',')}\n3560070894222,Sirop Cerise 75cl,Carrefour,gp,Carrefour,Carrefour Jarry,4.10,2026-02-17T18:35:00Z,USD`;
    const result = await importCsvContent(csv, makeEnv());

    expect(result.status).toBe('failed');
    expect(result.errors[0]?.reason).toBe('currency must be EUR');
  });

  it('accepts valid full row', async () => {
    const csv = `${CSV_IMPORT_HEADERS.join(',')}\n${baseRow}`;
    const result = await importCsvContent(csv, makeEnv());

    expect(result.status).toBe('success');
    expect(result.insertedRows).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(upsertProduct).toHaveBeenCalledTimes(1);
    expect(insertObservationAndRefreshAggregate).toHaveBeenCalledTimes(1);
    expect(insertObservationAndRefreshAggregate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        retailer: 'carrefour',
        price: 4.1,
      }),
    );
  });
});
