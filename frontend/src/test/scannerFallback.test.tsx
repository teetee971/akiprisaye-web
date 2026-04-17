import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../billing/useEntitlements', () => ({
  useEntitlements: () => ({ quota: () => 30 }),
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn() }),
}));

vi.mock('../hooks/useContinuousBarcodeScanner', () => ({
  DEFAULT_LOOKUP_TERRITORY: 'martinique',
  resolveBarcode: vi.fn(),
  useContinuousBarcodeScanner: () => ({
    videoRef: { current: null },
    cameraError: null,
    barcodeSupport: false,
    scanActive: false,
    setScanActive: vi.fn(),
    results: [],
    clear: vi.fn(),
    removeItem: vi.fn(),
    addAllOk: () => 0,
    addItemToCart: () => false,
    okItems: [],
    autoAddToCart: false,
    setAutoAddToCart: vi.fn(),
    debugInfo: {
      status: 'idle',
      lastCode: null,
      stableCounter: 0,
      secondsSinceLastDetection: null,
    },
  }),
}));

import ScannerHub from '../pages/ScannerHub';

describe('ScannerHub fallback', () => {
  it('renders manual fallback controls when BarcodeDetector is unavailable', () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <ScannerHub />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(screen.getByText(/BarcodeDetector non disponible/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/Saisir EAN \(fallback\)/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Rechercher/i })).toBeTruthy();
  });
});
