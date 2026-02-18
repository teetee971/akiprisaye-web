import { describe, expect, it, vi } from 'vitest';
import { insertProductCandidate } from '../src/db';
import { resolveReceiptItemCandidate } from '../src/enrich/productEnrichService';

function createFakeDb(options: {
  candidates?: Array<Record<string, unknown>>;
  candidateById?: Record<string, unknown> | null;
}) {
  const run = vi.fn().mockResolvedValue(undefined);
  const all = vi.fn().mockResolvedValue({ results: options.candidates ?? [] });
  const first = vi.fn().mockImplementation(async () => options.candidateById ?? null);

  const bind = vi.fn().mockImplementation(() => ({ run, all, first }));
  const prepare = vi.fn().mockImplementation((sql: string) => ({ sql, bind }));

  return { prepare, bind, run, all, first };
}

describe('product candidate persistence', () => {
  it('inserts product candidates', async () => {
    const db = createFakeDb({});

    await insertProductCandidate(db as unknown as D1Database, {
      id: 'cand_1',
      receipt_item_id: 'ri_1',
      source: 'openfoodfacts',
      ean: '123',
      name: 'Produit',
      brand: 'Marque',
      image_url: 'https://img',
      quantity: '1L',
      score: 0.91,
    });

    expect(db.prepare).toHaveBeenCalled();
    expect(db.run).toHaveBeenCalled();
  });

  it('resolves using chosen candidate id and inserts observation', async () => {
    const candidate = {
      id: 'cand_1',
      receipt_item_id: 'ri_1',
      source: 'openfoodfacts',
      ean: '12345678',
      name: 'Produit',
      brand: 'Marque',
      image_url: 'https://img',
      quantity: '1L',
      score: 0.88,
      created_at: new Date().toISOString(),
    };

    const db = createFakeDb({ candidates: [candidate], candidateById: candidate });
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('obs_1');

    const result = await resolveReceiptItemCandidate(db as unknown as D1Database, {
      receiptItemId: 'ri_1',
      chosenCandidateId: 'cand_1',
    });

    expect(result.ean).toBe('12345678');
    expect(result.observationId).toBe('obs_1');
    expect(db.run).toHaveBeenCalled();
  });
});
