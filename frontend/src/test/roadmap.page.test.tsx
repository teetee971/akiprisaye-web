import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import '@testing-library/jest-dom/vitest';
import RoadmapPage from '../pages/RoadmapPage';

describe('Roadmap page', () => {
  it('explains clearly what is done and what remains to publish', () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <RoadmapPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(screen.getByRole('heading', { name: /état d'avancement global/i })).toBeInTheDocument();
    expect(
      screen.getByText(/toutes les feuilles de route ne sont pas encore finalisées/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/restent à mettre en ligne/i)).toBeInTheDocument();
  });
});
