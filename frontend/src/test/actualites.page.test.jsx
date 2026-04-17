import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import Actualites from '../pages/Actualites';
import { DEFAULT_NEWS_LIMIT } from '../constants/news';

describe('Actualites page', () => {
  let container;
  let root;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T10:00:00.000Z'));
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
      }
    );
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('builds /api/news query params from filters', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ items: [], mode: 'mock' }) });
    vi.stubGlobal('fetch', fetchMock);

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HelmetProvider>
            <Actualites />
          </HelmetProvider>
        </MemoryRouter>
      );
    });

    const territorySelect = container.querySelector('select');

    await act(async () => {
      territorySelect.value = 'gp';
      territorySelect.dispatchEvent(new Event('change', { bubbles: true }));
      const buttons = Array.from(container.querySelectorAll('button'));
      buttons
        .find((b) => b.textContent === 'Bons plans')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      buttons
        .find((b) => b.textContent === 'Fort')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const urls = fetchMock.mock.calls.map((call) => String(call[0] ?? ''));
    const latest = urls.at(-1) ?? '';
    expect(latest).toContain('/api/news?');
    expect(latest).toContain('territory=gp');
    expect(latest).toContain('type=bons_plans');
    expect(latest).toContain('impact=fort');
    expect(latest).toContain(`limit=${DEFAULT_NEWS_LIMIT}`);
    expect(latest).toContain('refresh=');
    expect(latest).not.toContain('&q=');
  });

  it('shows fallback when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HelmetProvider>
            <Actualites />
          </HelmetProvider>
        </MemoryRouter>
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Données hors connexion affichées');
    expect(container.textContent).toContain('Ouvrir la recherche globale du site');
  });

  it('shows staleness notice when there is no update in the current month', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          mode: 'live',
          items: [
            {
              id: 'item-janvier',
              type: 'reglementaire',
              territory: 'fr',
              title: 'Ancienne publication',
              summary: 'Résumé test',
              source_name: 'Source test',
              source_url: 'https://example.com',
              published_at: '2026-01-20T10:00:00.000Z',
              impact: 'info',
              verified: true,
            },
          ],
        }),
      })
    );

    await act(async () => {
      root.render(
        <MemoryRouter>
          <HelmetProvider>
            <Actualites />
          </HelmetProvider>
        </MemoryRouter>
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Pas de nouvelle mise à jour pour');
    expect(container.textContent).toContain('avril 2026');
    expect(container.textContent).toContain('janvier 2026');
  });
});
