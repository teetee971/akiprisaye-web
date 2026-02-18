import {
  createFetchJob,
  ensureDefaultSources,
  getFetchJob,
  insertFetchJobItem,
  insertObservationAndRefreshAggregate,
  updateFetchJobStatus,
} from '../db';
import { getConnectorById } from '../connectors/registry';
import { eanListSchema } from '../validators';
import type { Env, Territory } from '../types';
import { computeFetchJobStatus } from './status';

export interface RunJobResult {
  jobId: string;
  status: 'success' | 'partial' | 'failed';
  counts: {
    ok: number;
    noData: number;
    error: number;
    invalid: number;
  };
}

export async function createJob(env: Env, sourceId: string, territory: Territory): Promise<string> {
  await ensureDefaultSources(env.PRICE_DB);
  return createFetchJob(env.PRICE_DB, sourceId, territory);
}

export async function runJob(
  env: Env,
  jobId: string,
  input: { eans: string[] },
): Promise<RunJobResult> {
  const job = await getFetchJob(env.PRICE_DB, jobId);
  if (!job) {
    throw new Error('job_not_found');
  }

  const connector = getConnectorById(job.source_id);
  if (!connector) {
    throw new Error('connector_not_found');
  }

  const eans = eanListSchema.parse(input.eans);
  const startedAt = new Date().toISOString();
  await updateFetchJobStatus(env.PRICE_DB, jobId, 'running', { startedAt, error: null });

  const counts = { ok: 0, noData: 0, error: 0, invalid: 0 };

  try {
    const rows = await connector.fetchPrices({ territory: job.territory, eans, env: { PRICE_DB: env.PRICE_DB } });
    const byEan = new Map(rows.map((row) => [row.ean, row]));

    for (const ean of eans) {
      const row = byEan.get(ean);
      if (!row) {
        counts.noData += 1;
        await insertFetchJobItem(env.PRICE_DB, { jobId, ean, status: 'no_data' });
        continue;
      }

      if (!row.retailer || !Number.isInteger(row.priceCents) || row.priceCents <= 0) {
        counts.invalid += 1;
        await insertFetchJobItem(env.PRICE_DB, {
          jobId,
          ean,
          retailer: row.retailer,
          status: 'invalid',
          rawRef: row.rawRef,
          rawPayloadJson: row.rawPayload ? JSON.stringify(row.rawPayload) : undefined,
        });
        continue;
      }

      await insertObservationAndRefreshAggregate(env.PRICE_DB, {
        ean,
        territory: job.territory,
        retailer: row.retailer,
        price: row.priceCents / 100,
        currency: row.currency,
        unit: row.unit,
        observedAt: row.observedAt,
        source: `connector:${connector.id}`,
        confidence: 0.8,
        metadata: row.rawPayload,
      });

      counts.ok += 1;
      await insertFetchJobItem(env.PRICE_DB, {
        jobId,
        ean,
        retailer: row.retailer,
        status: 'ok',
        rawRef: row.rawRef,
        rawPayloadJson: row.rawPayload ? JSON.stringify(row.rawPayload) : undefined,
        observedPriceCents: row.priceCents,
        currency: row.currency,
        unit: row.unit,
        observedAt: row.observedAt ?? new Date().toISOString(),
      });
    }
  } catch (error) {
    counts.error += 1;
    const safeError = error instanceof Error ? error.message.slice(0, 300) : 'connector_error';
    await updateFetchJobStatus(env.PRICE_DB, jobId, 'failed', {
      finishedAt: new Date().toISOString(),
      error: safeError,
    });

    return {
      jobId,
      status: 'failed',
      counts,
    };
  }

  const finalStatus = computeFetchJobStatus({ ok: counts.ok, error: counts.error + counts.invalid });
  await updateFetchJobStatus(env.PRICE_DB, jobId, finalStatus, {
    finishedAt: new Date().toISOString(),
    error: null,
  });

  return { jobId, status: finalStatus as 'success' | 'partial' | 'failed', counts };
}
