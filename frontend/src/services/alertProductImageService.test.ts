import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  __alertImageInternals,
  extractOffImageUrl,
  getProductImageUrl,
} from './alertProductImageService';

describe('alertProductImageService OFF parsing', () => {
  it('prioritizes selected_images.front.display.fr over other fields', () => {
    const url = extractOffImageUrl({
      status: 1,
      product: {
        image_url: 'https://img.test/fallback.jpg',
        selected_images: {
          front: {
            display: {
              fr: 'https://img.test/fr.jpg',
              en: 'https://img.test/en.jpg',
            },
          },
        },
      },
    });

    expect(url).toBe('https://img.test/fr.jpg');
  });

  it('returns undefined when OFF has no image data', () => {
    const url = extractOffImageUrl({
      status: 1,
      product: {},
    });

    expect(url).toBeUndefined();
  });
});

describe('alertProductImageService fallback and cache', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns category placeholder when backend has no image', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ source: 'none' }),
      }) as unknown as globalThis.Response)
    );

    const result = await getProductImageUrl('3760123456789', 'bébé');

    expect(result.source).toBe('placeholder');
    expect(result.url).toBe('/assets/placeholders/placeholder-bebe.svg');
  });

  it('returns placeholder on network error and keeps local cache entry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );

    const first = await getProductImageUrl('3390011200456', 'viande/poisson');
    const second = await getProductImageUrl('3390011200456', 'viande/poisson');

    expect(first.source).toBe('placeholder');
    expect(first.url).toBe('/assets/placeholders/placeholder-viande-poisson.svg');
    expect(second.url).toBe(first.url);

    const rawCache = window.localStorage.getItem(__alertImageInternals.IMAGE_CACHE_KEY);
    expect(rawCache).toContain('ean:3390011200456');
  });
});
