import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PriceSearchResults } from '../pages/RechercheProduits';
import type { ScanHubResult } from '../types/scanHubResult';

const emptyResult: ScanHubResult = {
  status: 'NO_DATA',
  reason: 'Données insuffisantes pour établir une fourchette de prix fiable.',
};

describe('Price search empty state', () => {
  it('renders NoPriceDataState without triggering errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <PriceSearchResults
          result={emptyResult}
          onReset={() => {}}
          onScanTicket={() => {}}
          onReturnToHub={() => {}}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Aucune donnée de prix disponible')
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /rechercher un autre produit/i })
    ).toBeInTheDocument();

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
