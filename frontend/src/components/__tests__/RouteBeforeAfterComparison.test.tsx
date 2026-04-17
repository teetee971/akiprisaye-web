/**
 * Tests for Route Before/After Comparison Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RouteBeforeAfterComparison from '../RouteBeforeAfterComparison';
import type { OptimalRoute } from '../../utils/routeOptimization';

describe('RouteBeforeAfterComparison', () => {
  const mockRoute: OptimalRoute = {
    stores: [
      {
        id: '1',
        name: 'Store A',
        lat: 16.271,
        lon: -61.588,
        distance: 5.2,
      },
      {
        id: '2',
        name: 'Store B',
        lat: 16.224,
        lon: -61.493,
        distance: 3.8,
      },
    ],
    totalDistance: 12.5,
    totalTime: 25,
    order: [0, 1],
    savings: {
      distance: 5.5,
      fuel: 0.33,
      co2: 0.76,
    },
  };

  it('should render comparison title', () => {
    render(<RouteBeforeAfterComparison route={mockRoute} />);

    expect(screen.getByText('Comparaison Avant / Après Optimisation')).toBeInTheDocument();
  });

  it('should display distance comparison', () => {
    render(<RouteBeforeAfterComparison route={mockRoute} />);

    expect(screen.getByText('Distance totale')).toBeInTheDocument();
    expect(screen.getByText('12.5')).toBeInTheDocument(); // Optimized distance
  });

  it('should display time comparison', () => {
    render(<RouteBeforeAfterComparison route={mockRoute} />);

    expect(screen.getByText('Temps de trajet')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument(); // Optimized time
  });

  it('should display fuel comparison', () => {
    render(<RouteBeforeAfterComparison route={mockRoute} />);

    expect(screen.getByText('Carburant')).toBeInTheDocument();
  });

  it('should display CO2 comparison', () => {
    render(<RouteBeforeAfterComparison route={mockRoute} />);

    expect(screen.getByText('Émissions CO₂')).toBeInTheDocument();
  });

  it('should calculate unoptimized distance correctly', () => {
    render(<RouteBeforeAfterComparison route={mockRoute} />);

    // Unoptimized = (5.2 * 2) + (3.8 * 2) = 18.0 km
    // Component should show this value in "Avant" column
    const beforeValues = screen.getAllByText(/18\.0/);
    expect(beforeValues.length).toBeGreaterThan(0);
  });

  it('should display savings summary', () => {
    render(<RouteBeforeAfterComparison route={mockRoute} />);

    expect(screen.getByText('Économie globale')).toBeInTheDocument();
    expect(screen.getByText('En optimisant votre itinéraire')).toBeInTheDocument();
  });

  it('should display methodology note', () => {
    render(<RouteBeforeAfterComparison route={mockRoute} />);

    expect(
      screen.getByText(/L'itinéraire "avant" correspond à des allers-retours séparés/)
    ).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <RouteBeforeAfterComparison route={mockRoute} className="custom-class" />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should show percentage savings', () => {
    render(<RouteBeforeAfterComparison route={mockRoute} />);

    // Should show percentage reductions - look for "-31%" pattern
    const percentages = screen.getAllByText(/-\d+%/);
    expect(percentages.length).toBeGreaterThan(0);
  });

  it('should handle single store route', () => {
    const singleStoreRoute: OptimalRoute = {
      stores: [
        {
          id: '1',
          name: 'Store A',
          lat: 16.271,
          lon: -61.588,
          distance: 5.0,
        },
      ],
      totalDistance: 10.0,
      totalTime: 20,
      order: [0],
      savings: {
        distance: 0,
        fuel: 0,
        co2: 0,
      },
    };

    render(<RouteBeforeAfterComparison route={singleStoreRoute} />);

    // Should still render without errors
    expect(screen.getByText('Comparaison Avant / Après Optimisation')).toBeInTheDocument();
  });

  it('should calculate fuel savings correctly', () => {
    render(<RouteBeforeAfterComparison route={mockRoute} />);

    // Savings displayed should match route.savings.fuel (0.33 displayed as "0.3 L")
    const savingsText = screen.getByText(/0\.3.*L/);
    expect(savingsText).toBeInTheDocument();
  });

  it('should calculate CO2 savings correctly', () => {
    render(<RouteBeforeAfterComparison route={mockRoute} />);

    // Savings displayed should match route.savings.co2 (0.76 displayed as "0.8 kg")
    const savingsText = screen.getByText(/0\.8.*kg/);
    expect(savingsText).toBeInTheDocument();
  });
});
