// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const lookupProductByEanMock = vi.fn();

vi.mock('../services/eanProductService', () => ({
  lookupProductByEan: (...args: unknown[]) => lookupProductByEanMock(...args),
}));

vi.mock('../services/productViewModelService', () => ({
  toProductViewModel: () => ({
    nom: 'Produit OFF',
    marque: 'Marque OFF',
    contenance: '500g',
    imageUrl: 'https://img.example/off.png',
    prix: '3.50 €',
  }),
}));

describe('OFF cache fallback in resolveBarcode', () => {
  beforeEach(() => {
    lookupProductByEanMock.mockReset();
  });

  it('avoids refetch for same barcode', async () => {
    lookupProductByEanMock.mockResolvedValue({
      success: true,
      product: {
        ean: '1234567890123',
        status: 'partiel',
        nom: 'Produit OFF',
        traceability: {
          source: 'open_food_facts',
          dateObservation: new Date().toISOString(),
          territoire: 'martinique',
        },
      },
    });

    const { resolveBarcode } = await import('../hooks/useContinuousBarcodeScanner');

    await resolveBarcode('1234567890123', 'martinique', 'scan_utilisateur');
    await resolveBarcode('1234567890123', 'martinique', 'scan_utilisateur');

    expect(lookupProductByEanMock).toHaveBeenCalledTimes(1);
  });
});
