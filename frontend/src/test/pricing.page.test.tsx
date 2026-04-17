import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import '@testing-library/jest-dom/vitest';
import PricingPage from '../pages/Pricing';

describe('Pricing page', () => {
  it('explains links open official operator websites in FAQ', () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <PricingPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    const question = /comment fonctionnent les liens vers les opérateurs/i;
    const answer = /les liens « voir l'offre » ouvrent toujours le site officiel de l'opérateur/i;

    expect(screen.getByRole('button', { name: question })).toBeInTheDocument();
    expect(screen.queryByText(answer)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: question }));

    expect(screen.getByText(answer)).toBeInTheDocument();
  });
});
