import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('App legacy alias routes', () => {
  it('keeps panier/cart/checkout aliases to /liste', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const appSource = readFileSync(resolve(here, '../App.tsx'), 'utf-8');
    expect(appSource).toContain(
      '<Route path="panier" element={<Navigate to="/liste" replace />} />'
    );
    expect(appSource).toContain('<Route path="cart" element={<Navigate to="/liste" replace />} />');
    expect(appSource).toContain(
      '<Route path="checkout" element={<Navigate to="/liste" replace />} />'
    );
  });
});
