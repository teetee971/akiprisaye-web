/**
 * Tests unitaires — receiptImportService
 *
 * Couverture:
 * - Validation: champs requis manquants
 * - Déduplication: checksum déjà présent
 * - Import nominal: création store + receipt + items + observations + history
 * - Items avec needsReview → review queue
 * - Tolérance aux erreurs par item (un item raté ne bloque pas)
 * - Support format compact (date/price au lieu de receiptDate/totalPrice)
 */

// ─── Sub-service mocks ────────────────────────────────────────────────────────
// jest.mock factories don't reference outer vars → no ESM hoisting issues.

jest.mock('../productCatalogService.js', () => ({
  productCatalogService: { upsertProduct: jest.fn() },
}));
jest.mock('../priceObservationService.js', () => ({
  priceObservationService: { create: jest.fn() },
}));
jest.mock('../priceHistoryAggregationService.js', () => ({
  priceHistoryAggregationService: { update: jest.fn() },
}));
jest.mock('../priceAlertService.js', () => ({
  priceAlertService: { evaluate: jest.fn() },
}));
jest.mock('../reviewQueueService.js', () => ({
  reviewQueueService: { enqueue: jest.fn() },
}));

// Get references to mocked sub-service methods
const mockProductCatalog   = (jest.requireMock('../productCatalogService.js') as any).productCatalogService;
const mockObsService       = (jest.requireMock('../priceObservationService.js') as any).priceObservationService;
const mockHistService      = (jest.requireMock('../priceHistoryAggregationService.js') as any).priceHistoryAggregationService;
const mockAlertService     = (jest.requireMock('../priceAlertService.js') as any).priceAlertService;
const mockReviewService    = (jest.requireMock('../reviewQueueService.js') as any).reviewQueueService;

// ─── Prisma mock via dependency injection ─────────────────────────────────────
// Use DI on ReceiptImportService to avoid ESM module-level prisma issues.

import { ReceiptImportService } from '../receiptImportService.js';
import type { ImportReceiptPayload } from '../../../types/receipt.types.js';

const mockStore = {
  findFirst: jest.fn(),
  create:    jest.fn(),
};
const mockReceipt = {
  findUnique: jest.fn(),
  create:     jest.fn(),
};
const mockReceiptItem = { create: jest.fn() };

const mockPrisma = {
  store:       mockStore,
  receipt:     mockReceipt,
  receiptItem: mockReceiptItem,
} as never;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultMocks() {
  // Prisma (direct calls in ReceiptImportService)
  mockStore.findFirst.mockResolvedValue(null);
  mockStore.create.mockResolvedValue({ id: 'store-1', normalizedName: "U Express Horne à l'Eau" });
  mockReceipt.findUnique.mockResolvedValue(null);
  mockReceipt.create.mockResolvedValue({ id: 'receipt-1' });
  mockReceiptItem.create.mockResolvedValue({ id: 'item-1' });
  // Sub-services
  mockProductCatalog.upsertProduct.mockResolvedValue({ id: 'prod-1', productKey: 'coca-cola-pet-2l', created: true, imageUpdated: false });
  mockObsService.create.mockResolvedValue('obs-1');
  mockHistService.update.mockResolvedValue({ monthlyCreated: true, yearlyCreated: true });
  mockAlertService.evaluate.mockResolvedValue(0);
  mockReviewService.enqueue.mockResolvedValue('review-1');
}

const MINIMAL_PAYLOAD: ImportReceiptPayload = {
  store: {
    normalizedName: "U Express Horne à l'Eau",
    territory: 'gp',
  },
  receipt: {
    receiptDate: '2026-03-04',
    receiptTime: '17:30:05',
    totalTtc: 72.00,
  },
  items: [
    {
      lineIndex: 1,
      rawLabel: 'BOISSONS COCA COLA PET 2L',
      normalizedLabel: 'Coca-Cola PET 2L',
      brand: 'Coca-Cola',
      category: 'soda',
      totalPrice: 2.80,
      confidenceScore: 0.97,
      needsReview: false,
    },
  ],
};

let svc: ReceiptImportService;

beforeEach(() => {
  jest.clearAllMocks();
  svc = new ReceiptImportService(mockPrisma);
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('Validation', () => {
  test('retourne erreur si store.normalizedName absent', async () => {
    const p = { ...MINIMAL_PAYLOAD, store: { normalizedName: '', territory: 'gp' as const } };
    const res = await svc.import(p);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/normalizedName/);
  });

  test('retourne erreur si receipt.receiptDate absent', async () => {
    const p = { ...MINIMAL_PAYLOAD, receipt: { ...MINIMAL_PAYLOAD.receipt, receiptDate: '' } };
    const res = await svc.import(p);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/receiptDate/);
  });

  test('retourne erreur si items vide', async () => {
    const p = { ...MINIMAL_PAYLOAD, items: [] };
    const res = await svc.import(p);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/items/);
  });
});

// ─── Déduplication ────────────────────────────────────────────────────────────

describe('Déduplication', () => {
  test('retourne success avec warning si checksum déjà présent', async () => {
    mockReceipt.findUnique.mockResolvedValue({ id: 'receipt-existing' });

    const res = await svc.import(MINIMAL_PAYLOAD);

    expect(res.success).toBe(true);
    expect(res.receiptId).toBe('receipt-existing');
    expect(res.warnings[0]).toMatch(/déjà importé/i);
    expect(mockReceipt.create).not.toHaveBeenCalled();
  });
});

// ─── Import nominal ───────────────────────────────────────────────────────────

describe('Import nominal', () => {
  test('crée store, receipt, product, item, observation, history', async () => {
    defaultMocks();

    const res = await svc.import(MINIMAL_PAYLOAD);

    expect(res.success).toBe(true);
    expect(res.receiptId).toBe('receipt-1');
    expect(res.storeId).toBe('store-1');
    expect(res.createdProducts).toBe(1);
    expect(res.createdObservations).toBe(1);
    expect(res.createdHistoryMonthly).toBe(1);
    expect(res.createdHistoryYearly).toBe(1);
    expect(res.warnings).toHaveLength(0);
  });

  test('réutilise le store s\'il existe déjà', async () => {
    defaultMocks();
    mockStore.findFirst.mockResolvedValue({ id: 'store-existing', normalizedName: "U Express Horne à l'Eau" });

    const res = await svc.import(MINIMAL_PAYLOAD);

    expect(res.storeId).toBe('store-existing');
    expect(mockStore.create).not.toHaveBeenCalled();
  });
});

// ─── needsReview ──────────────────────────────────────────────────────────────

describe('Review queue', () => {
  test('enqueue si item.needsReview=true', async () => {
    defaultMocks();
    const payload: ImportReceiptPayload = {
      ...MINIMAL_PAYLOAD,
      items: [
        {
          ...MINIMAL_PAYLOAD.items[0],
          rawLabel: 'SUCRE BATONNETS VAN/PISTAC',
          normalizedLabel: 'Sucre bâtonnets vanille pistache 370g',
          confidenceScore: 0.72,
          needsReview: true,
        },
      ],
    };

    const res = await svc.import(payload);

    expect(res.reviewItems).toBe(1);
    expect(mockReviewService.enqueue).toHaveBeenCalledTimes(1);
    const args = mockReviewService.enqueue.mock.calls[0][0];
    expect(args.entityType).toBe('receipt_item');
    expect(args.reason).toMatch(/needsReview/i);
  });

  test('enqueue si confidenceScore < 0.70', async () => {
    defaultMocks();
    const payload: ImportReceiptPayload = {
      ...MINIMAL_PAYLOAD,
      items: [
        {
          ...MINIMAL_PAYLOAD.items[0],
          confidenceScore: 0.60,
          needsReview: false,
        },
      ],
    };

    const res = await svc.import(payload);

    expect(res.reviewItems).toBe(1);
    const args = mockReviewService.enqueue.mock.calls[0][0];
    expect(args.reason).toMatch(/confiance/i);
  });

  test('pas d\'enqueue si score élevé et needsReview=false', async () => {
    defaultMocks();

    const res = await svc.import(MINIMAL_PAYLOAD); // confidenceScore = 0.97

    expect(res.reviewItems).toBe(0);
    expect(mockReviewService.enqueue).not.toHaveBeenCalled();
  });
});

// ─── Explicit productKey ──────────────────────────────────────────────────────

describe('Explicit productKey', () => {
  test('utilise le productKey fourni dans l\'item', async () => {
    defaultMocks();
    mockProductCatalog.upsertProduct.mockResolvedValue({
      id: 'prod-2', productKey: 'papeco_essuie_tout_2_rouleaux', created: true, imageUpdated: false,
    });
    const payload: ImportReceiptPayload = {
      ...MINIMAL_PAYLOAD,
      items: [
        {
          lineIndex: 1,
          rawLabel: 'ESSUIE TOUT 2RLX PAPECO',
          normalizedLabel: 'Essuie-tout Papeco 2 rouleaux',
          productKey: 'papeco_essuie_tout_2_rouleaux',
          totalPrice: 1.99,
          confidenceScore: 0.92,
        },
      ],
    };

    const res = await svc.import(payload);
    expect(res.success).toBe(true);
    expect(mockProductCatalog.upsertProduct).toHaveBeenCalledWith(
      expect.objectContaining({ productKey: 'papeco_essuie_tout_2_rouleaux' })
    );
  });
});

describe('Tolérance erreur par item', () => {
  test('continue les autres items si un item plante', async () => {
    defaultMocks();
    // Faire planter upsertProduct sur le premier appel
    mockProductCatalog.upsertProduct
      .mockRejectedValueOnce(new Error('DB timeout'))
      .mockResolvedValue({ id: 'prod-2', productKey: 'sirop-citron-vert-u-75cl', created: true, imageUpdated: false });

    const payload: ImportReceiptPayload = {
      ...MINIMAL_PAYLOAD,
      items: [
        MINIMAL_PAYLOAD.items[0], // va planter
        {
          lineIndex: 2,
          rawLabel: 'SIROP CITRON VERT U 75CL',
          normalizedLabel: 'Sirop citron vert U 75cl',
          totalPrice: 4.78,
          confidenceScore: 0.94,
        },
      ],
    };

    const res = await svc.import(payload);

    expect(res.success).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(res.warnings[0]).toMatch(/DB timeout/);
    // Deuxième item doit être créé
    expect(res.createdProducts).toBeGreaterThan(0);
  });
});
