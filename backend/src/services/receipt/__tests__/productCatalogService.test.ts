/**
 * Tests unitaires — productCatalogService
 *
 * Couverture:
 * - buildProductKey()
 * - upsertProduct() création
 * - upsertProduct() non-écrasement image haute confiance
 * - upsertProduct() mise à jour image si score supérieur
 */

import { buildProductKey, ProductCatalogService } from '../productCatalogService.js';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

// Use dependency injection — avoids ESM jest.mock() hoisting issues
// (jest.mock() factory is hoisted before const declarations in ESM mode)
const mockPrismaProduct = {
  findUnique: jest.fn(),
  create:     jest.fn(),
  update:     jest.fn(),
};

const svc = new ProductCatalogService({ product: mockPrismaProduct } as never);
const upsertProduct = svc.upsertProduct.bind(svc);

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── buildProductKey ──────────────────────────────────────────────────────────

describe('buildProductKey', () => {
  test('génère un slug ASCII lowercase', () => {
    expect(buildProductKey('Coca-Cola PET 2L')).toBe('coca-cola-pet-2l');
  });

  test('supprime les accents', () => {
    expect(buildProductKey('Lait UHT demi-écrémé U Bio 1L')).toBe('lait-uht-demi-ecreme-u-bio-1l');
  });

  test('normalise les espaces en tirets', () => {
    expect(buildProductKey('Tortillas chips nature U 300g')).toBe('tortillas-chips-nature-u-300g');
  });

  test('supprime la ponctuation inutile', () => {
    expect(buildProductKey('Rhum Damoiseau blanc 1L')).toBe('rhum-damoiseau-blanc-1l');
  });

  test('limite à 80 caractères', () => {
    const long = 'a'.repeat(100);
    expect(buildProductKey(long).length).toBeLessThanOrEqual(80);
  });

  test('est déterministe', () => {
    const label = 'Sauce pesto verde U 190g';
    expect(buildProductKey(label)).toBe(buildProductKey(label));
  });
});

// ─── upsertProduct — création ─────────────────────────────────────────────────

describe('upsertProduct — création', () => {
  test('utilise la clé explicite si fournie (pas d\'auto-génération)', async () => {
    mockPrismaProduct.findUnique.mockResolvedValue(null);
    mockPrismaProduct.create.mockResolvedValue({
      id: 'prod-003',
      productKey: 'papeco_essuie_tout_2_rouleaux',
    });

    const result = await upsertProduct({
      normalizedLabel: 'Essuie-tout Papeco 2 rouleaux',
      rawLabel: 'ESSUIE TOUT 2RLX PAPECO',
      productKey: 'papeco_essuie_tout_2_rouleaux',
      brand: 'Papeco',
      category: 'entretien',
    });

    expect(result.created).toBe(true);
    expect(result.productKey).toBe('papeco_essuie_tout_2_rouleaux');
    // La clé passée doit être utilisée telle quelle
    const createArg = mockPrismaProduct.create.mock.calls[0][0].data;
    expect(createArg.productKey).toBe('papeco_essuie_tout_2_rouleaux');
  });

  test('génère une clé auto si aucune clé explicite n\'est fournie', async () => {
    mockPrismaProduct.findUnique.mockResolvedValue(null);
    mockPrismaProduct.create.mockResolvedValue({
      id: 'prod-001',
      productKey: 'coca-cola-pet-2l',
    });

    const result = await upsertProduct({
      normalizedLabel: 'Coca-Cola PET 2L',
      rawLabel: 'BOISSONS COCA COLA PET 2L',
      brand: 'Coca-Cola',
      category: 'soda',
      packageSizeValue: 2,
      packageSizeUnit: 'l',
    });

    expect(result.created).toBe(true);
    expect(result.productKey).toBe('coca-cola-pet-2l');
    expect(mockPrismaProduct.create).toHaveBeenCalledTimes(1);
    const createArg = mockPrismaProduct.create.mock.calls[0][0].data;
    expect(createArg.brand).toBe('Coca-Cola');
    expect(createArg.category).toBe('soda');
  });
});

// ─── upsertProduct — update ───────────────────────────────────────────────────

describe('upsertProduct — mise à jour', () => {
  const existing = {
    id: 'prod-002',
    productKey: 'rhum-damoiseau-blanc-1l',
    brand: 'Damoiseau',
    category: 'rhum',
    subcategory: null,
    barcode: null,
    packageSizeValue: null,
    packageSizeUnit: null,
    primaryImageUrl: null,
    imageSource: null,
    imageSourceType: null,
    imageConfidenceScore: null,
    imageNeedsReview: false,
  };

  test('ne recrée pas si productKey existe', async () => {
    mockPrismaProduct.findUnique.mockResolvedValue(existing);
    mockPrismaProduct.update.mockResolvedValue({ ...existing });

    const result = await upsertProduct({
      normalizedLabel: 'Rhum Damoiseau blanc 1L',
      rawLabel: 'ALCOOLS RHUM DAMOISEAU BLANC 1L',
      brand: 'Damoiseau',
    });

    expect(result.created).toBe(false);
    expect(mockPrismaProduct.create).not.toHaveBeenCalled();
    expect(mockPrismaProduct.update).toHaveBeenCalledTimes(1);
  });

  test('met à jour l\'image si score entrant supérieur', async () => {
    mockPrismaProduct.findUnique.mockResolvedValue({
      ...existing,
      primaryImageUrl: 'https://example.com/old.jpg',
      imageConfidenceScore: 65,
    });
    mockPrismaProduct.update.mockResolvedValue({});

    const result = await upsertProduct({
      normalizedLabel: 'Rhum Damoiseau blanc 1L',
      rawLabel: 'ALCOOLS RHUM DAMOISEAU BLANC 1L',
      primaryImageUrl: 'https://example.com/new.jpg',
      imageConfidenceScore: 90,
    });

    expect(result.imageUpdated).toBe(true);
    const updateData = mockPrismaProduct.update.mock.calls[0][0].data;
    expect(updateData.primaryImageUrl).toBe('https://example.com/new.jpg');
    expect(updateData.imageConfidenceScore).toBe(90);
  });

  test('ne remplace PAS une image haute confiance par une image plus faible', async () => {
    mockPrismaProduct.findUnique.mockResolvedValue({
      ...existing,
      primaryImageUrl: 'https://example.com/good.jpg',
      imageConfidenceScore: 90,
    });
    mockPrismaProduct.update.mockResolvedValue({});

    const result = await upsertProduct({
      normalizedLabel: 'Rhum Damoiseau blanc 1L',
      rawLabel: 'ALCOOLS RHUM DAMOISEAU BLANC 1L',
      primaryImageUrl: 'https://example.com/weak.jpg',
      imageConfidenceScore: 55,
    });

    expect(result.imageUpdated).toBe(false);
    const updateData = mockPrismaProduct.update.mock.calls[0][0].data;
    expect(updateData.primaryImageUrl).toBeUndefined();
  });

  test('attribue l\'image si le produit n\'en a pas encore', async () => {
    mockPrismaProduct.findUnique.mockResolvedValue({
      ...existing,
      primaryImageUrl: null,
      imageConfidenceScore: null,
    });
    mockPrismaProduct.update.mockResolvedValue({});

    const result = await upsertProduct({
      normalizedLabel: 'Rhum Damoiseau blanc 1L',
      rawLabel: 'ALCOOLS RHUM DAMOISEAU BLANC 1L',
      primaryImageUrl: 'https://example.com/img.jpg',
      imageConfidenceScore: 75,
    });

    expect(result.imageUpdated).toBe(true);
  });
});
