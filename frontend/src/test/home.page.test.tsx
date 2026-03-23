import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router-dom')>();
  return { ...original, useNavigate: () => mockNavigate };
});

vi.mock('../hooks/useScrollReveal', () => ({
  useScrollReveal: () => undefined,
}));

vi.mock('../components/home/PriceLiveTicker', () => ({
  default: () => <div>Mock price ticker</div>,
}));

vi.mock('../components/ui/SEOHead', () => ({
  SEOHead: () => null,
}));

vi.mock('../components/ui/FlipStatCard', () => ({
  default: ({ label }: { label: string }) => <div>{label}</div>,
}));

vi.mock('../pages/home-v5/HowItWorksSection', () => ({
  default: () => <section>Mock how it works</section>,
}));

vi.mock('../pages/home-v5/ObservatorySection', () => ({
  default: () => <section>Mock observatory section</section>,
}));

vi.mock('../pages/home-v5/MiniFaqSection', () => ({
  default: () => <section>Mock FAQ</section>,
}));

vi.mock('../components/home/TerritoryPriceChart', () => ({
  default: () => <section>Mock territory price chart</section>,
}));

vi.mock('../components/home/PriceEvolutionChart', () => ({
  default: () => <section>Mock price evolution chart</section>,
}));

vi.mock('../components/home/LiveNewsFeed', () => ({
  default: () => <section>Mock live news</section>,
}));

vi.mock('../components/home/PanierVitalWidget', () => ({
  default: () => <section>Mock panier vital</section>,
}));

vi.mock('../components/home/CategoryOvercostChart', () => ({
  default: () => <section>Mock category overcost</section>,
}));

vi.mock('../components/home/StoreRankingWidget', () => ({
  default: () => <section>Mock store ranking</section>,
}));

vi.mock('../components/home/InflationBarometerWidget', () => ({
  default: () => <section>Mock inflation barometer</section>,
}));

vi.mock('../components/home/ProduitChocWidget', () => ({
  default: () => <section>Mock produit choc</section>,
}));

vi.mock('../components/home/IndiceEquiteWidget', () => ({
  default: () => <section>Mock indice equite</section>,
}));

vi.mock('../components/home/AppDemoShowcase', () => ({
  default: () => <section>Mock app demo</section>,
}));

vi.mock('../components/home/VideoVieChere', () => ({
  default: () => <section>Mock video vie chere</section>,
}));

vi.mock('../components/home/PriceExplainerBanner', () => ({
  default: () => <section>Mock price explainer</section>,
}));

vi.mock('../components/home/LettreHebdoWidget', () => ({
  default: () => <section>Mock lettre hebdo</section>,
}));

vi.mock('../components/home/LettreJourWidget', () => ({
  default: () => <section>Mock lettre jour</section>,
}));

import Home from '../pages/Home';

describe('Home page', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );
  });

  it('renders the full homepage by default', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.getByText(/le plus utile, sans surcharge/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /masquer la vue complète/i })).toBeInTheDocument();
    expect(screen.getByText(/ce que disent nos utilisateurs/i)).toBeInTheDocument();
    expect(await screen.findByText(/mock observatory section/i)).toBeInTheDocument();
  });

  it('can hide the extended homepage on demand', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /masquer la vue complète/i }));

    expect(screen.getByRole('button', { name: /voir toute la page d’accueil/i })).toBeInTheDocument();
    expect(screen.queryByText(/ce que disent nos utilisateurs/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mock observatory section/i)).not.toBeInTheDocument();
  });

  it('submits hero search to /recherche-produits, not /comparateur', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    const searchInput = screen.getByRole('textbox', { name: /rechercher un produit/i });
    fireEvent.change(searchInput, { target: { value: 'riz 5kg' } });
    fireEvent.submit(searchInput.closest('form')!);

    expect(mockNavigate).toHaveBeenCalledWith('/recherche-produits?q=riz%205kg');
    expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/comparateur'));
  });
});
