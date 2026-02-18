import { insertObservationAndRefreshAggregate } from './db';
import { redactReceipt } from './pii/redact';
import { normalizeReceipt } from './receiptNormalize/normalize';
import { getReceiptExtractor } from './receiptOcr';
import type { Env, ReceiptItemRecord, ReceiptJobRecord, Territory } from './types';

interface ReservedImageRow {
  id: string;
  r2_key: string;
}

interface PresignOptions {
  method: 'PUT';
  key: string;
  expiration: number;
}

type ReceiptBucketWithPresign = R2Bucket & {
  createPresignedUrl?: (options: PresignOptions) => Promise<URL>;
};

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function computeSha256Hex(content: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', content);
  return toHex(digest);
}

async function buildR2SignedPutUrl(bucket: R2Bucket, key: string): Promise<string> {
  const withPresign = bucket as ReceiptBucketWithPresign;
  if (!withPresign.createPresignedUrl) {
    throw new Error('r2_presign_unavailable');
  }

  const url = await withPresign.createPresignedUrl({ method: 'PUT', key, expiration: 600 });
  return url.toString();
}

export async function createReceiptJob(
  env: Env,
  payload: { territory: Territory; sourceType: 'receipt' | 'invoice' | 'quote'; imagesCount: number },
): Promise<{ jobId: string; uploads: Array<{ imageId: string; url: string; headers: Record<string, string> }> }> {
  const jobId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await env.PRICE_DB
    .prepare(`INSERT INTO receipt_jobs (id, territory, status, created_at, images_count, source_type, confidence)
      VALUES (?, ?, 'queued', ?, ?, ?, 0)`)
    .bind(jobId, payload.territory, createdAt, payload.imagesCount, payload.sourceType)
    .run();

  const uploads: Array<{ imageId: string; url: string; headers: Record<string, string> }> = [];
  for (let i = 0; i < payload.imagesCount; i += 1) {
    const imageId = crypto.randomUUID();
    const r2Key = `receipt-ingest/${jobId}/${imageId}.jpg`;
    const url = await buildR2SignedPutUrl(env.RECEIPT_BUCKET, r2Key);

    await env.PRICE_DB
      .prepare(`INSERT INTO receipt_images (id, job_id, r2_key, sha256, created_at)
      VALUES (?, ?, ?, 'reserved', ?)`)
      .bind(imageId, jobId, r2Key, createdAt)
      .run();

    uploads.push({ imageId, url, headers: { 'content-type': 'image/jpeg' } });
  }

  return { jobId, uploads };
}

export async function completeReceiptUpload(
  env: Env,
  jobId: string,
  images: Array<{ imageId: string; sha256: string; width?: number; height?: number }>,
): Promise<void> {
  const job = await env.PRICE_DB.prepare('SELECT images_count FROM receipt_jobs WHERE id = ?').bind(jobId).first<{ images_count: number }>();
  if (!job) {
    throw new Error('job_not_found');
  }

  if (images.length !== Number(job.images_count)) {
    throw new Error('images_count_mismatch');
  }

  const reserved = await env.PRICE_DB
    .prepare('SELECT id, r2_key FROM receipt_images WHERE job_id = ?')
    .bind(jobId)
    .all<ReservedImageRow>();
  const byId = new Map((reserved.results ?? []).map((item) => [item.id, item]));

  if (byId.size !== Number(job.images_count)) {
    throw new Error('reserved_images_mismatch');
  }

  for (const image of images) {
    const entry = byId.get(image.imageId);
    if (!entry) {
      throw new Error(`unknown_image_id:${image.imageId}`);
    }

    const object = await env.RECEIPT_BUCKET.get(entry.r2_key);
    if (!object) {
      throw new Error(`missing_image_in_r2:${image.imageId}`);
    }

    const computedSha = await computeSha256Hex(await object.arrayBuffer());
    if (computedSha !== image.sha256.toLowerCase()) {
      throw new Error(`sha256_mismatch:${image.imageId}`);
    }

    await env.PRICE_DB
      .prepare('UPDATE receipt_images SET sha256 = ?, width = ?, height = ? WHERE id = ? AND job_id = ?')
      .bind(computedSha, image.width ?? null, image.height ?? null, image.imageId, jobId)
      .run();
  }
}

export function resolveJobStatus(itemsCount: number): 'success' | 'partial' {
  return itemsCount > 0 ? 'success' : 'partial';
}

export async function processReceiptJob(env: Env, jobId: string): Promise<void> {
  await env.PRICE_DB.prepare("UPDATE receipt_jobs SET status = 'running' WHERE id = ?").bind(jobId).run();

  try {
    const images = await env.PRICE_DB
      .prepare('SELECT r2_key FROM receipt_images WHERE job_id = ?')
      .bind(jobId)
      .all<{ r2_key: string }>();
    const extractor = getReceiptExtractor(env);
    const raw = await extractor.extract(
      (images.results ?? []).map((img) => ({ r2Key: img.r2_key })),
      { env },
    );
    const sanitized = redactReceipt(raw);
    const normalized = normalizeReceipt(sanitized);

    await env.PRICE_DB.prepare('DELETE FROM receipt_items WHERE job_id = ?').bind(jobId).run();

    for (const item of normalized.items) {
      await env.PRICE_DB
        .prepare(`INSERT INTO receipt_items (
            id, job_id, line_index, product_label, quantity, unit_price_cents, line_total_cents,
            ean, brand, category, confidence
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          crypto.randomUUID(),
          jobId,
          item.lineIndex,
          item.productLabel,
          item.quantity ?? null,
          item.unitPriceCents ?? null,
          item.lineTotalCents ?? null,
          item.ean ?? null,
          item.brand ?? null,
          item.category ?? null,
          item.confidence,
        )
        .run();
    }

    const finalStatus = resolveJobStatus(normalized.items.length);

    await env.PRICE_DB
      .prepare(`UPDATE receipt_jobs
        SET status = ?, retailer = ?, store_name = ?, observed_at = ?, totals_json = ?, pii_redaction_json = ?, confidence = ?, completed_at = ?, error = NULL
        WHERE id = ?`)
      .bind(
        finalStatus,
        normalized.retailer ?? null,
        normalized.storeName ?? null,
        normalized.observedAt ?? null,
        JSON.stringify(normalized.totals),
        JSON.stringify(normalized.piiRedaction),
        normalized.confidence,
        new Date().toISOString(),
        jobId,
      )
      .run();

    if ((env.RECEIPT_AUTOCONFIRM ?? 'false').toLowerCase() === 'true' && normalized.confidence >= 0.75) {
      await confirmReceiptJob(env, jobId);
    }
  } catch (error) {
    await env.PRICE_DB
      .prepare("UPDATE receipt_jobs SET status = 'failed', error = ?, completed_at = ? WHERE id = ?")
      .bind(error instanceof Error ? error.message : 'unknown_error', new Date().toISOString(), jobId)
      .run();
  }
}

export async function getReceiptJobWithItems(
  env: Env,
  jobId: string,
): Promise<{ job: ReceiptJobRecord | null; items: ReceiptItemRecord[] }> {
  const job = await env.PRICE_DB.prepare('SELECT * FROM receipt_jobs WHERE id = ?').bind(jobId).first<ReceiptJobRecord>();
  const items = await env.PRICE_DB
    .prepare('SELECT * FROM receipt_items WHERE job_id = ? ORDER BY line_index ASC')
    .bind(jobId)
    .all<ReceiptItemRecord>();
  return { job: job ?? null, items: items.results ?? [] };
}

interface ConfirmOverride {
  items?: Array<{
    lineIndex: number;
    productLabel: string;
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
    ean?: string;
    brand?: string;
    category?: string;
    confidence?: number;
  }>;
}

export async function confirmReceiptJob(env: Env, jobId: string, override?: ConfirmOverride): Promise<void> {
  const job = await env.PRICE_DB.prepare('SELECT * FROM receipt_jobs WHERE id = ?').bind(jobId).first<ReceiptJobRecord>();
  if (!job) {
    throw new Error('job_not_found');
  }

  if (!['success', 'partial'].includes(job.status)) {
    throw new Error('job_not_ready_for_confirm');
  }

  const itemRows = override?.items
    ? override.items.map((item) => ({
        line_index: item.lineIndex,
        product_label: item.productLabel,
        quantity: item.quantity ?? null,
        unit_price_cents: typeof item.unitPrice === 'number' ? Math.round(item.unitPrice * 100) : null,
        line_total_cents: typeof item.lineTotal === 'number' ? Math.round(item.lineTotal * 100) : null,
        ean: item.ean ?? null,
        brand: item.brand ?? null,
        category: item.category ?? null,
        confidence: item.confidence ?? job.confidence,
      }))
    : (
        await env.PRICE_DB
          .prepare('SELECT * FROM receipt_items WHERE job_id = ? ORDER BY line_index ASC')
          .bind(jobId)
          .all<ReceiptItemRecord>()
      ).results ?? [];

  const observedAt = job.observed_at ?? new Date().toISOString();
  const skippedRows: number[] = [];

  for (const item of itemRows) {
    const cents = item.line_total_cents ?? item.unit_price_cents;
    if (!cents || cents <= 0 || !item.ean || !/^\d{8,14}$/.test(item.ean)) {
      skippedRows.push(item.line_index);
      continue;
    }

    await insertObservationAndRefreshAggregate(env.PRICE_DB, {
      ean: item.ean,
      territory: job.territory,
      retailer: job.retailer ?? 'unknown',
      storeName: job.store_name ?? undefined,
      observedAt,
      price: cents / 100,
      currency: 'EUR',
      source: 'receipt_user',
      confidence: item.confidence,
      metadata: {
        jobId,
        lineIndex: item.line_index,
        productLabel: item.product_label,
        quantity: item.quantity,
        category: item.category,
        brand: item.brand,
      },
    });
  }

  if (skippedRows.length > 0) {
    await env.PRICE_DB
      .prepare(`UPDATE receipt_jobs
        SET status = 'partial', error = ?, completed_at = COALESCE(completed_at, ?)
        WHERE id = ?`)
      .bind(`skipped_items_without_valid_ean:${skippedRows.join(',')}`, new Date().toISOString(), jobId)
      .run();
  }
}
