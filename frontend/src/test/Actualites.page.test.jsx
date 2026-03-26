import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Actualites from '../pages/Actualites';

vi.mock('../components/layout/Layout', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

describe('Actualites page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds /api/news query params from filters', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [],
        total: 0,
      }),
    });

    render(
      <MemoryRouter initialEntries={['/actualites?territory=gp&query=prix']}>
        <Actualites />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/news');
    expect(String(url)).toContain('territory=gp');
    expect(String(url)).toContain('query=prix');
  });

  it('shows fallback when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'));

    const { container } = render(
      <MemoryRouter initialEntries={['/actualites']}>
        <Actualites />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(container.textContent).toContain('Actualités');
    });

    expect(container.textContent).toMatch(/Actualités.*Bons plans/i);
    expect(container.textContent).toContain('Enquête : groupe GBH');
    expect(container.textContent).toContain('Rappel conso');
  });
});
