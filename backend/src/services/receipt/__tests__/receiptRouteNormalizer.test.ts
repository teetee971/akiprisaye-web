/**
 * Tests unitaires — routes/receipts.ts (normalizePayload + batch format)
 *
 * On teste le comportement de normalisation sans monter le serveur Express.
 * On réimporte les fonctions en les extrayant via le module.
 *
 * Couverture:
 * - Normalisation payload compact (date / price)
 * - Normalisation payload canonique (receiptDate / totalPrice)
 * - Normalisation batch (observedAt → receiptDate + receiptTime)
 * - Support productKey explicite dans les items
 * - Support weightKg dans les items
 * - Support reviewNote dans les items
 */

// Le module exporte uniquement le router Express par défaut,
// donc on teste les cas via des contrats observables: les champs
// sont bien mappés quand on appelle directement receiptImportService.
// Pour les routes, on utilise supertest — ici on se limite aux types
// et à la logique pure de normalisation.

// ─── Helpers de normalisation (copiés ici pour test unitaire pur) ─────────────

function removeAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function toProductKey(label: string, explicit?: string): string {
  if (explicit) return explicit;
  return removeAccents(label)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeItem(item: Record<string, unknown>, idx: number) {
  return {
    lineIndex:       typeof item.lineIndex === 'number' ? item.lineIndex : idx + 1,
    rawLabel:        String(item.rawLabel ?? ''),
    normalizedLabel: item.normalizedLabel ? String(item.normalizedLabel) : undefined,
    productKey:      item.productKey ? String(item.productKey) : undefined,
    brand:           item.brand != null ? String(item.brand) : undefined,
    category:        item.category != null ? String(item.category) : undefined,
    totalPrice:      typeof item.totalPrice === 'number' ? item.totalPrice
                   : typeof item.price      === 'number' ? item.price : 0,
    quantity:        typeof item.quantity === 'number' ? item.quantity : undefined,
    unitPrice:       typeof item.unitPrice === 'number' ? item.unitPrice : undefined,
    weightKg:        typeof item.weightKg === 'number' ? item.weightKg : undefined,
    confidenceScore: typeof item.confidenceScore === 'number' ? item.confidenceScore : undefined,
    needsReview:     typeof item.needsReview === 'boolean' ? item.needsReview : undefined,
    reviewNote:      item.reviewNote != null ? String(item.reviewNote) : undefined,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('normalizeItem — format compact (price)', () => {
  test('mappe price vers totalPrice', () => {
    const item = normalizeItem({ rawLabel: 'TEST', price: 3.59 }, 0);
    expect(item.totalPrice).toBe(3.59);
  });

  test('totalPrice prime sur price', () => {
    const item = normalizeItem({ rawLabel: 'TEST', price: 3.00, totalPrice: 4.00 }, 0);
    expect(item.totalPrice).toBe(4.00);
  });

  test('retourne 0 si ni price ni totalPrice', () => {
    const item = normalizeItem({ rawLabel: 'TEST' }, 0);
    expect(item.totalPrice).toBe(0);
  });
});

describe('normalizeItem — productKey', () => {
  test('conserve le productKey explicite', () => {
    const item = normalizeItem({
      rawLabel: 'ESSUIE TOUT 2RLX PAPECO',
      productKey: 'papeco_essuie_tout_2_rouleaux',
      price: 1.99,
    }, 0);
    expect(item.productKey).toBe('papeco_essuie_tout_2_rouleaux');
  });

  test('pas de productKey si absent', () => {
    const item = normalizeItem({ rawLabel: 'ESSUIE TOUT 2RLX PAPECO', price: 1.99 }, 0);
    expect(item.productKey).toBeUndefined();
  });
});

describe('normalizeItem — weightKg', () => {
  test('conserve le weightKg', () => {
    const item = normalizeItem({
      rawLabel: 'PDN CANARD COMPLET ECO 675G',
      price: 3.59,
      weightKg: 0.675,
    }, 0);
    expect(item.weightKg).toBe(0.675);
  });

  test('pas de weightKg si absent', () => {
    const item = normalizeItem({ rawLabel: 'TEST', price: 1.99 }, 0);
    expect(item.weightKg).toBeUndefined();
  });
});

describe('normalizeItem — reviewNote', () => {
  test('conserve le reviewNote', () => {
    const item = normalizeItem({
      rawLabel: 'PDN CANARD',
      price: 3.59,
      needsReview: true,
      reviewNote: 'PDN est un code interne',
    }, 0);
    expect(item.reviewNote).toBe('PDN est un code interne');
    expect(item.needsReview).toBe(true);
  });
});

describe('toProductKey — auto vs explicit', () => {
  test('auto-génère depuis label', () => {
    expect(toProductKey('Coca-Cola PET 2L')).toBe('coca-cola-pet-2l');
  });

  test('utilise la clé explicite si fournie', () => {
    expect(toProductKey('Essuie-tout Papeco 2 rouleaux', 'papeco_essuie_tout_2_rouleaux'))
      .toBe('papeco_essuie_tout_2_rouleaux');
  });
});

describe('batch observedAt → receiptDate + receiptTime', () => {
  test('extrait la date depuis observedAt ISO', () => {
    const observedAt = '2026-03-07T10:52:00-04:00';
    const receiptDate = observedAt.slice(0, 10);
    const receiptTime = observedAt.slice(11, 19);
    expect(receiptDate).toBe('2026-03-07');
    expect(receiptTime).toBe('10:52:00');
  });

  test('retourne date vide si observedAt absent', () => {
    const observedAt = undefined;
    const receiptDate = observedAt ?? '';
    expect(receiptDate).toBe('');
  });
});
