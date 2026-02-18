import {
  cacheProductMedia,
  clearProductCandidatesForReceiptItem,
  getProductCandidateById,
  getProductCandidatesByReceiptItem,
  getReceiptItemById,
  insertProductCandidate,
  insertReceiptUserResolution,
} from '../db';
import { enrichWithOpenFoodFacts, type EnrichedProductCandidate } from './productEnrich';

export async function enrichReceiptItemWithOff(db: D1Database, receiptItemId: string): Promise<EnrichedProductCandidate[]> {
  const receiptItem = await getReceiptItemById(db, receiptItemId);
  if (!receiptItem) {
    throw new Error('receipt_item_not_found');
  }

  const candidates = await enrichWithOpenFoodFacts({
    itemName: receiptItem.name,
    quantityHint: receiptItem.quantity ?? undefined,
    ean: receiptItem.ean ?? undefined,
  });

  await clearProductCandidatesForReceiptItem(db, receiptItemId);
  for (const candidate of candidates) {
    await insertProductCandidate(db, {
      id: candidate.id,
      receipt_item_id: receiptItemId,
      source: candidate.source,
      ean: candidate.ean ?? null,
      name: candidate.name,
      brand: candidate.brand ?? null,
      image_url: candidate.imageUrl ?? null,
      quantity: candidate.quantity ?? null,
      score: candidate.score,
    });

    if (candidate.ean && candidate.imageUrl) {
      await cacheProductMedia(db, candidate.ean, candidate.imageUrl);
    }
  }

  return candidates;
}

export async function listReceiptItemCandidates(db: D1Database, receiptItemId: string): Promise<EnrichedProductCandidate[]> {
  const records = await getProductCandidatesByReceiptItem(db, receiptItemId);
  return records.map((record) => ({
    id: record.id,
    source: 'openfoodfacts',
    ean: record.ean ?? undefined,
    name: record.name,
    brand: record.brand ?? undefined,
    imageUrl: record.image_url ?? undefined,
    quantity: record.quantity ?? undefined,
    score: record.score,
  }));
}

export async function resolveReceiptItemCandidate(
  db: D1Database,
  input: { receiptItemId: string; chosenEan?: string; chosenCandidateId?: string },
): Promise<{ observationId: string; ean: string; imageUrl?: string; confidenceScore: number }> {
  const candidates = await getProductCandidatesByReceiptItem(db, input.receiptItemId);

  let selectedCandidate = input.chosenCandidateId
    ? await getProductCandidateById(db, input.chosenCandidateId)
    : null;

  if (!selectedCandidate && input.chosenEan) {
    selectedCandidate = candidates.find((candidate) => candidate.ean === input.chosenEan) ?? null;
  }

  const ean = input.chosenEan ?? selectedCandidate?.ean ?? undefined;
  if (!ean) {
    throw new Error('resolution_requires_ean');
  }

  const confidenceScore = selectedCandidate?.score ?? 0.6;
  const imageUrl = selectedCandidate?.image_url ?? undefined;

  const observationId = await insertReceiptUserResolution(db, {
    ean,
    imageUrl,
    confidenceScore,
  });

  if (imageUrl) {
    await cacheProductMedia(db, ean, imageUrl);
  }

  return { observationId, ean, imageUrl, confidenceScore };
}
