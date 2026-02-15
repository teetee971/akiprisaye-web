import { describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import AlertProductImage from '../components/alerts/AlertProductImage';

vi.mock('../services/alertProductImageService', () => ({
  getProductImageUrl: vi.fn(async () => ({
    url: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.400.jpg',
    source: 'off',
  })),
}));

describe('AlertProductImage', () => {
  it('sets img src from API data.url', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<AlertProductImage ean="3017620422003" alt="Nutella" />);
    });

    await act(async () => {
      await Promise.resolve();
    });

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toContain('images.openfoodfacts.org');

    root.unmount();
    container.remove();
  });
});
