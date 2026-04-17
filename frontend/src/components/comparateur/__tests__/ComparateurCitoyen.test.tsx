import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import ComparateurCitoyen from '../../../pages/ComparateurCitoyen';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockObservatoireData = {
  territoire: 'Guadeloupe',
  date_snapshot: '2026-02-03',
  source: 'releve_citoyen',
  qualite: 'verifie',
  donnees: [
    {
      commune: 'Les Abymes',
      enseigne: 'Carrefour',
      categorie: 'Produits laitiers',
      produit: 'Lait demi-écrémé UHT 1L',
      ean: '3560070123456',
      unite: '1L',
      prix: 1.48,
    },
    {
      commune: 'Les Abymes',
      enseigne: 'E.Leclerc',
      categorie: 'Produits laitiers',
      produit: 'Lait demi-écrémé UHT 1L',
      ean: '3560070123456',
      unite: '1L',
      prix: 1.39,
    },
  ],
};

/** Helper: render the component with all required providers */
function renderComponent() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <ComparateurCitoyen />
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('ComparateurCitoyen', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('loads data successfully from primary file', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockObservatoireData,
    } as Response);

    renderComponent();

    // Should show loading state initially
    expect(screen.getByText(/chargement des données/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/chargement des données/i)).not.toBeInTheDocument();
    });

    // Should display data info
    await waitFor(() => {
      expect(screen.getAllByText(/Guadeloupe/i).length).toBeGreaterThan(0);
    });

    // Should have called fetch with primary file (first in DATA_FILES list)
    expect(mockFetch).toHaveBeenCalledWith('/data/observatoire/guadeloupe_2026-03.json');
  });

  test('falls back to secondary file when primary fails with 404', async () => {
    // First file (guadeloupe_2026-03) fails with 404
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    // Second file (guadeloupe_2026-02) succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockObservatoireData,
        date_snapshot: '2026-01-15',
      }),
    } as Response);

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/chargement des données/i)).not.toBeInTheDocument();
    });

    // Should have tried both files
    expect(mockFetch).toHaveBeenCalledWith('/data/observatoire/guadeloupe_2026-03.json');
    expect(mockFetch).toHaveBeenCalledWith('/data/observatoire/guadeloupe_2026-02.json');

    // Should display data info
    await waitFor(() => {
      expect(screen.getAllByText(/Guadeloupe/i).length).toBeGreaterThan(0);
    });
  });

  test('displays specific error message when all files fail', async () => {
    // All files fail
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/impossible de charger les données de l'observatoire/i)
      ).toBeInTheDocument();
    });

    // Should show error state with retry button
    expect(screen.getByText(/réessayer/i)).toBeInTheDocument();
    expect(screen.getByText(/retour à l'accueil/i)).toBeInTheDocument();
  });

  test('displays specific error for server errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/impossible de charger les données de l'observatoire/i)
      ).toBeInTheDocument();
    });
  });

  test('retry button reloads data', async () => {
    // First attempt fails — need to fail all 6 DATA_FILES to trigger error state
    const failResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response;
    mockFetch.mockResolvedValue(failResponse);

    renderComponent();

    // Wait for error to appear
    await waitFor(() => {
      expect(
        screen.getByText(/impossible de charger les données de l'observatoire/i)
      ).toBeInTheDocument();
    });

    // Clear previous fetch calls
    mockFetch.mockClear();

    // Mock success for retry
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockObservatoireData,
    } as Response);

    // Click retry button
    const retryButton = screen.getByText(/réessayer/i);
    fireEvent.click(retryButton);

    // Should show loading state
    expect(screen.getByText(/chargement des données/i)).toBeInTheDocument();

    // Should load successfully
    await waitFor(() => {
      expect(screen.queryByText(/chargement des données/i)).not.toBeInTheDocument();
      expect(screen.getAllByText(/Guadeloupe/i).length).toBeGreaterThan(0);
    });

    // Should have called fetch again with primary file
    expect(mockFetch).toHaveBeenCalledWith('/data/observatoire/guadeloupe_2026-03.json');
  });

  test('handles invalid data structure', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        territoire: 'Test',
        // Missing donnees field
      }),
    } as Response);

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/impossible de charger les données de l'observatoire/i)
      ).toBeInTheDocument();
    });
  });

  test('displays data metadata correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockObservatoireData,
    } as Response);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/Guadeloupe/i).length).toBeGreaterThan(0);
    });

    // Check metadata elements
    expect(screen.getAllByText(/Guadeloupe/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/[0-9]{1,2} .*2026/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText((_, el) =>
        (el?.textContent || '').toLowerCase().includes('releve citoyen')
      ).length
    ).toBeGreaterThan(0);
    // Use getAllByText since "vérifié" may appear in multiple elements
    expect(screen.getAllByText(/vérifié/i).length).toBeGreaterThan(0);
  });

  test('selects first product by default', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockObservatoireData,
    } as Response);

    renderComponent();

    await waitFor(() => {
      // Product should be selected in dropdown
      const productSelect = screen.getByLabelText(/produit/i) as HTMLSelectElement;
      expect(productSelect.value).toBe('3560070123456');
    });
  });

  test('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/impossible de charger les données de l'observatoire/i)
      ).toBeInTheDocument();
    });
  });
});
