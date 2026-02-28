import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMock = vi.hoisted(() => ({
  createImportJob: vi.fn(),
  ensureProductExists: vi.fn(),
  insertImportRow: vi.fn(),
  insertObservationCentsAndRefreshAggregate: vi.fn(),
  updateImportJobProgress: vi.fn(),
}));

vi.mock('../src/db', () => dbMock);

import { processCsvImportJob } from '../src/importCsv';

describe('CSV import pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createEnv(csv: string) {
    return {
      PRICE_DB: {} as D1Database,
      PRICE_ADMIN_TOKEN: 'token',
      PRICE_IMPORTS: {
        get: vi.fn().mockResolvedValue({ body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(csv)); controller.close(); } }) }),
      } as unknown as R2Bucket,
    };
  }

  it('processes valid CSV row and marks job success', async () => {
    const env = createEnv(
      'ean,territory,retailer,storeLabel,price_cents,currency,observedAt\n3560070894222,gp,carrefour,Store GP,349,EUR,2026-02-18T12:00:00Z\n',
    );

    await processCsvImportJob(env as never, 'job-1', 'imports/job-1/test.csv');

    expect(dbMock.insertObservationCentsAndRefreshAggregate).toHaveBeenCalledTimes(1);
    expect(dbMock.insertObservationCentsAndRefreshAggregate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ ean: '3560070894222', priceCents: 349 }),
    );
    expect(dbMock.updateImportJobProgress).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'success', totalRows: 1, successRows: 1, errorRows: 0, finished: true }),
    );
  });

  it('marks invalid row and fails job when all rows invalid', async () => {
    const env = createEnv(
      'ean,territory,retailer,storeLabel,price_cents,currency,observedAt\nINVALID,gp,carrefour,Store GP,349,EUR,2026-02-18T12:00:00Z\n',
    );

    await processCsvImportJob(env as never, 'job-2', 'imports/job-2/test.csv');

    expect(dbMock.insertObservationCentsAndRefreshAggregate).not.toHaveBeenCalled();
    expect(dbMock.insertImportRow).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'invalid', errorMessage: 'invalid_ean' }),
    );
    expect(dbMock.updateImportJobProgress).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'failed', totalRows: 1, successRows: 0, errorRows: 1, finished: true }),
    );
  });

  it('marks job partial when CSV has mixed valid and invalid rows', async () => {
    const env = createEnv(
      [
        'ean,territory,retailer,storeLabel,price_cents,currency,observedAt',
        '3560070894222,gp,carrefour,Store GP,349,EUR,2026-02-18T12:00:00Z',
        '3560070894222,gp,carrefour,Store GP,-10,EUR,2026-02-18T12:00:00Z',
      ].join('\n'),
    );

    await processCsvImportJob(env as never, 'job-3', 'imports/job-3/test.csv');

    expect(dbMock.insertObservationCentsAndRefreshAggregate).toHaveBeenCalledTimes(1);
    expect(dbMock.updateImportJobProgress).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'partial', totalRows: 2, successRows: 1, errorRows: 1, finished: true }),
    );
  });

  it('fails job on missing required column', async () => {
    const env = createEnv('ean,territory,retailer,storeLabel,price_cents,currency\n3560070894222,gp,carrefour,Store GP,349,EUR\n');

    await processCsvImportJob(env as never, 'job-4', 'imports/job-4/test.csv');

    expect(dbMock.updateImportJobProgress).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'failed', finished: true }),
    );
  });
});
