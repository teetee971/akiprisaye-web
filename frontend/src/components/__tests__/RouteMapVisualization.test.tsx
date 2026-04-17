/**
 * Tests for Route Map Visualization Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RouteMapVisualization from '../RouteMapVisualization';
import type { OptimalRoute } from '../../utils/routeOptimization';
import type { GeoPosition } from '../../utils/geoLocation';

describe('RouteMapVisualization', () => {
  const mockUserPosition: GeoPosition = {
    lat: 16.2415,
    lon: -61.5331,
  };

  const mockRoute: OptimalRoute = {
    stores: [
      {
        id: '1',
        name: 'Store A',
        enseigne: 'Super U',
        lat: 16.271,
        lon: -61.588,
        distance: 5.2,
        type_magasin: 'Supermarché',
      },
      {
        id: '2',
        name: 'Store B',
        enseigne: 'Carrefour',
        lat: 16.224,
        lon: -61.493,
        distance: 3.8,
        type_magasin: 'Hypermarché',
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

  it('should render loading state initially', () => {
    render(<RouteMapVisualization route={mockRoute} userPosition={mockUserPosition} />);

    expect(screen.getByText('Chargement de la carte...')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <RouteMapVisualization
        route={mockRoute}
        userPosition={mockUserPosition}
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });
});
