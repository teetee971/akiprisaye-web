/**
 * Tests unitaires — priceHistoryAggregationService
 *
 * Couverture:
 * - updateMonthly() création
 * - updateMonthly() mise à jour avg/min/max incrémentale
 * - updateYearly()  création + mise à jour
 * - update()        délègue aux deux sous-méthodes
 */

const mockMonthly = {
  findUnique: jest.fn(),
  create:     jest.fn(),
  update:     jest.fn(),
};
const mockYearly = {
  findUnique: jest.fn(),
  create:     jest.fn(),
  update:     jest.fn(),
};

jest.mock('../../../database/prisma.js', () => ({
  default: {
    priceHistoryMonthly: mockMonthly,
    priceHistoryYearly:  mockYearly,
  },
}));

let svc: import('../priceHistoryAggregationService.js').PriceHistoryAggregationService;

beforeEach(async () => {
  jest.clearAllMocks();
  const mod = await import('../priceHistoryAggregationService.js');
  svc = mod.priceHistoryAggregationService;
});

// ─── Monthly ──────────────────────────────────────────────────────────────────

describe('updateMonthly', () => {
  test('crée un enregistrement si aucun n\'existe', async () => {
    mockMonthly.findUnique.mockResolvedValue(null);
    mockMonthly.create.mockResolvedValue({ id: 'hist-001' });

    const created = await svc.updateMonthly('prod-1', 'gp', 2026, 3, 3.21);

    expect(created).toBe(true);
    const data = mockMonthly.create.mock.calls[0][0].data;
    expect(data.avgPrice).toBe(3.21);
    expect(data.minPrice).toBe(3.21);
    expect(data.maxPrice).toBe(3.21);
    expect(data.observationsCount).toBe(1);
  });

  test('met à jour avg/min/max de façon incrémentale', async () => {
    mockMonthly.findUnique.mockResolvedValue({
      productId: 'prod-1',
      territory: 'gp',
      year: 2026,
      month: 3,
      avgPrice: 3.00,
      minPrice: 2.80,
      maxPrice: 3.20,
      observationsCount: 4,
    });
    mockMonthly.update.mockResolvedValue({});

    const created = await svc.updateMonthly('prod-1', 'gp', 2026, 3, 2.50);

    expect(created).toBe(false);
    const data = mockMonthly.update.mock.calls[0][0].data;
    // avg = (3.00 * 4 + 2.50) / 5 = 14.50 / 5 = 2.90
    expect(data.avgPrice).toBeCloseTo(2.90, 5);
    expect(data.minPrice).toBe(2.50);  // nouveau min
    expect(data.maxPrice).toBe(3.20);  // inchangé
    expect(data.observationsCount).toBe(5);
  });

  test('ne change pas le min si prix plus élevé', async () => {
    mockMonthly.findUnique.mockResolvedValue({
      avgPrice: 3.00, minPrice: 2.80, maxPrice: 3.20, observationsCount: 3,
    });
    mockMonthly.update.mockResolvedValue({});

    await svc.updateMonthly('prod-1', 'gp', 2026, 3, 3.50);
    const data = mockMonthly.update.mock.calls[0][0].data;
    expect(data.minPrice).toBe(2.80); // inchangé
    expect(data.maxPrice).toBe(3.50); // nouveau max
  });
});

// ─── Yearly ───────────────────────────────────────────────────────────────────

describe('updateYearly', () => {
  test('crée si absent', async () => {
    mockYearly.findUnique.mockResolvedValue(null);
    mockYearly.create.mockResolvedValue({ id: 'hist-y-001' });

    const created = await svc.updateYearly('prod-1', 'gp', 2026, 12.31);

    expect(created).toBe(true);
    const data = mockYearly.create.mock.calls[0][0].data;
    expect(data.avgPrice).toBe(12.31);
    expect(data.year).toBe(2026);
  });

  test('met à jour si présent', async () => {
    mockYearly.findUnique.mockResolvedValue({
      avgPrice: 12.00, minPrice: 11.00, maxPrice: 13.00, observationsCount: 10,
    });
    mockYearly.update.mockResolvedValue({});

    const created = await svc.updateYearly('prod-1', 'gp', 2026, 10.00);

    expect(created).toBe(false);
    // avg = (12.00 * 10 + 10.00) / 11 = 130.00 / 11 ≈ 11.818
    const data = mockYearly.update.mock.calls[0][0].data;
    expect(data.avgPrice).toBeCloseTo(11.818, 2);
    expect(data.minPrice).toBe(10.00);
  });
});

// ─── update() (délègue aux deux) ─────────────────────────────────────────────

describe('update', () => {
  test('appelle monthly et yearly', async () => {
    mockMonthly.findUnique.mockResolvedValue(null);
    mockMonthly.create.mockResolvedValue({});
    mockYearly.findUnique.mockResolvedValue(null);
    mockYearly.create.mockResolvedValue({});

    const result = await svc.update('prod-1', 'gp', new Date('2026-03-04'), 3.21);

    expect(result.monthlyCreated).toBe(true);
    expect(result.yearlyCreated).toBe(true);
  });
});
