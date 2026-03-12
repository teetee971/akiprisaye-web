import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('PortailDeveloppeurs Browser Rendering setup docs', () => {
  it('documents the exact Cloudflare token permission and env vars', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(resolve(here, '../pages/PortailDeveloppeurs.tsx'), 'utf-8');

    expect(source).toContain('Compte → Browser Rendering → Modifier / Edit');
    expect(source).toContain('CLOUDFLARE_BROWSER_RENDERING_API_TOKEN');
    expect(source).toContain('BROWSER_RENDERING_SHARED_SECRET');
    expect(source).toContain('Zone');
    expect(source).toContain('Workers');
  });
});
