import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import Actualites from '../pages/Actualites';

describe('Actualites page', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.restoreAllMocks();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it('builds /api/news query params from filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [], mode: 'mock' }) });
    vi.stubGlobal('fetch', fetchMock);

    await act(async () => {
      root.render(<HelmetProvider><Actualites /></HelmetProvider>);
    });

    const territorySelect = container.querySelector('select');

    await act(async () => {
      territorySelect.value = 'gp';
      territorySelect.dispatchEvent(new Event('change', { bubbles: true }));
      const buttons = Array.from(container.querySelectorAll('button'));
      buttons.find((b) => b.textContent === 'Bons plans')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      buttons.find((b) => b.textContent === 'Fort')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const urls = fetchMock.mock.calls.map((call) => String(call[0] ?? ''));
    const latest = urls.at(-1) ?? '';
    expect(latest).toContain('/api/news?');
    expect(latest).toContain('territory=gp');
    expect(latest).toContain('type=bons_plans');
    expect(latest).toContain('impact=fort');
    expect(latest).toContain('limit=30');
    expect(latest).not.toContain('&q=');
  });

  it('shows fallback when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await act(async () => {
      root.render(<HelmetProvider><Actualites /></HelmetProvider>);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain('fallback embarqué affiché');
    expect(container.textContent).toContain('Enquête : groupe GBH et impact sur les prix en Guadeloupe');
    expect(container.textContent).toContain('Rappel conso : lot de sardines en conserve');
    expect(container.textContent).toContain('Ouvrir la recherche globale du site');
  });
});
