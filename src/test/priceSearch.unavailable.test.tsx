import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PriceSearchResults } from '../pages/RechercheProduits';
import type { ScanHubResult } from '../types/scanHubResult';

const unavailableResult: ScanHubResult = {
  status: 'UNAVAILABLE',
  service: 'prix-reels',
};

describe('Price search unavailable state', () => {
  it('renders the unavailable state without console errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <PriceSearchResults
          result={unavailableResult}
          onReset={() => {}}
          onScanTicket={() => {}}
          onReturnToHub={() => {}}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Prix momentanément indisponibles')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument();

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
