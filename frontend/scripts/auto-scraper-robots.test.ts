import { afterEach, describe, expect, it, vi } from 'vitest';
import { isScrapingAllowed } from '../../scripts/auto-scraper/sources/utils.mjs';

describe('auto-scraper robots parser', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('treats empty Disallow as allowed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('User-agent: *\nDisallow:\n', { status: 200 }),
    );

    const res = await isScrapingAllowed('https://robots-empty-disallow.example/produits/nutella');
    expect(res.allowed).toBe(true);
  });

  it('applies the longest matching Allow/Disallow rule for current path', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => (
      new Response(
        [
          'User-agent: *',
          'Disallow: /private',
          'Allow: /private/public',
          '',
        ].join('\n'),
        { status: 200 },
      )
    ));

    const allowedPath = await isScrapingAllowed('https://robots-longest-match.example/private/public/product');
    const blockedPath = await isScrapingAllowed('https://robots-longest-match-2.example/private/secret');

    expect(allowedPath.allowed).toBe(true);
    expect(blockedPath.allowed).toBe(false);
  });
});
