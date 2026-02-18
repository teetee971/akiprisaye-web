import { insertObservationAndRefreshAggregate } from './db';
import { redactReceipt } from './pii/redact';
import { normalizeReceipt } from './receiptNormalize/normalize';
import { getReceiptExtractor } from './receiptOcr';
import type { Env, ReceiptItemRecord, ReceiptJobRecord, Territory } from './types';

interface ReservedImageRow {
  id: string;
  r2_key: string;
}

function syntheticEanFromLabel(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = ((hash << 5) - hash + label.charCodeAt(i)) | 0;
  }
  const positive = Math.abs(hash).toString().padStart(12, '0').slice(0, 12);
  return `2${positive}`;
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

    const url = await (env.RECEIPT_BUCKET as unknown as { createPresignedUrl: (opts: { method: string; key: string; expiration: number }) => Promise<URL> })
      .createPresignedUrl({ method: 'PUT', key: r2Key, expiration: 600 });

    await env.PRICE_DB
      .prepare(`INSERT INTO receipt_images (id, job_id, r2_key, sha256, created_at)
      VALUES (?, ?, ?, 'reserved', ?)`)
      .bind(imageId, jobId, r2Key, createdAt)
      .run();

    uploads.push({ imageId, url: url.toString(), headers: { 'content-type': 'image/jpeg' } });
  }

  return { jobId, uploads };
}

export async function completeReceiptUpload(
  env: Env,
  jobId: string,
  images: Array<{ imageId: string; sha256: string; width?: number; height?: number }>,
): Promise<void> {
  const reserved = await env.PRICE_DB.prepare('SELECT id, r2_key FROM receipt_images WHERE job_id = ?').bind(jobId).all<ReservedImageRow>();
  const byId = new Map((reserved.results ?? []).map((item) => [item.id, item]));

  for (const image of images) {
    const entry = byId.get(image.imageId);
    if (!entry) {
      throw new Error(`unknown imageId ${image.imageId}`);
    }

    const exists = await env.RECEIPT_BUCKET.head(entry.r2_key);
    if (!exists) {
      throw new Error(`missing image in R2 for imageId ${image.imageId}`);
    }

    await env.PRICE_DB
      .prepare('UPDATE receipt_images SET sha256 = ?, width = ?, height = ? WHERE id = ? AND job_id = ?')
      .bind(image.sha256, image.width ?? null, image.height ?? null, image.imageId, jobId)
      .run();
  }
}

export function resolveJobStatus(itemsCount: number): "success" | "partial" {
  return itemsCount > 0 ? "success" : "partial";
}

export async function processReceiptJob(env: Env, jobId: string): Promise<void> {
  await env.PRICE_DB.prepare("UPDATE receipt_jobs SET status = 'running' WHERE id = ?").bind(jobId).run();

  try {
    const images = await env.PRICE_DB.prepare('SELECT r2_key FROM receipt_images WHERE job_id = ?').bind(jobId).all<{ r2_key: string }>();
    const extractor = getReceiptExtractor(env);
    const raw = await extractor.extract((images.results ?? []).map((img) => ({ r2Key: img.r2_key })), { env });
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
  const items = await env.PRICE_DB.prepare('SELECT * FROM receipt_items WHERE job_id = ? ORDER BY line_index ASC').bind(jobId).all<ReceiptItemRecord>();
  return { job: job ?? null, items: items.results ?? [] };
}

export async function confirmReceiptJob(
  env: Env,
  jobId: string,
  override?: {
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
  },
): Promise<void> {
  const job = await env.PRICE_DB.prepare('SELECT * FROM receipt_jobs WHERE id = ?').bind(jobId).first<ReceiptJobRecord>();
  if (!job) {
    throw new Error('job_not_found');
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
        await env.PRICE_DB.prepare('SELECT * FROM receipt_items WHERE job_id = ? ORDER BY line_index ASC').bind(jobId).all<ReceiptItemRecord>()
      ).results ?? [];

  const observedAt = job.observed_at ?? new Date().toISOString();
  for (const item of itemRows) {
    const cents = item.line_total_cents ?? item.unit_price_cents;
    if (!cents || cents <= 0) {
      continue;
    }

    const ean = item.ean && /^\d{8,14}$/.test(item.ean) ? item.ean : syntheticEanFromLabel(item.product_label);

    await insertObservationAndRefreshAggregate(env.PRICE_DB, {
      ean,
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
}
