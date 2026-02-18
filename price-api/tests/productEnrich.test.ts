import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enrichWithOpenFoodFacts, scoreCandidate, similarityScore } from '../src/enrich/productEnrich';

describe('product enrichment scoring', () => {
  it('computes similarity score for close product names', () => {
    expect(similarityScore('Nutella 750g', 'Nutella 750 g')).toBeGreaterThan(0.9);
  });

  it('adds quantity/brand bonus when hints match', () => {
    const score = scoreCandidate(
      {
        product_name: 'Eau minérale',
        brands: 'Evian',
        quantity: '1.5L',
      },
      {
        itemName: 'Eau minerale',
        brandHint: 'evian',
        quantityHint: '1.5l',
      },
    );

    expect(score).toBeGreaterThan(0.8);
  });
});

describe('text-search fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns text-search candidates when ean lookup misses', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            products: [
              {
                code: '12345678',
                product_name: 'Jus Orange',
                brands: 'Tropicana',
                quantity: '1L',
                image_front_url: 'https://img.example/jus.jpg',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );

    const result = await enrichWithOpenFoodFacts({ itemName: 'Jus Orange', ean: '99999999' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Jus Orange');
  });
});
