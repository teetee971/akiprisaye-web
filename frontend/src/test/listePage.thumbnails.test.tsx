import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../billing/useEntitlements', () => ({
  useEntitlements: () => ({
    can: () => true,
    quota: (name: string) => (name === 'maxItems' ? 30 : 100),
    explain: () => 'Disponible en PRO',
  }),
}));

import ListePage from '../pages/ListePage';

describe('ListePage thumbnails', () => {
  it('renders product thumbnail image when imageThumbUrl exists', () => {
    window.localStorage.setItem(
      'akiprisaye_shopping_list_v1',
      JSON.stringify([
        { id: '1', name: 'Banane', quantity: 1, imageThumbUrl: 'https://img.test/banana-thumb.jpg' },
      ]),
    );

    render(
      <MemoryRouter>
        <ListePage />
      </MemoryRouter>,
    );

    const image = screen.getByTestId('item-thumb');
    expect(image.getAttribute('src')).toBe('https://img.test/banana-thumb.jpg');
    expect(screen.queryByTestId('item-thumb-placeholder')).toBeNull();
  });

  it('renders placeholder when imageThumbUrl is missing', () => {
    window.localStorage.setItem(
      'akiprisaye_shopping_list_v1',
      JSON.stringify([{ id: '2', name: 'Riz', quantity: 2 }]),
    );

    render(
      <MemoryRouter>
        <ListePage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('item-thumb-placeholder')).toBeTruthy();
    expect(screen.queryByTestId('item-thumb')).toBeNull();
  });
});
