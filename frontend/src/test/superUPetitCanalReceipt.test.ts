/**
 * Tests — Super U Petit Canal — 07/03/2026
 *
 * Two test suites driven by the realistic OCR fixture:
 *
 *   1. receiptParser  — structural extraction (store, date, items, total)
 *   2. receiptNormalizer — PriceObservation mapping (territory, category, ISO date)
 *
 * The fixture intentionally contains only 23 of the original 32 items so that
 * checksum.matches === false — we assert that explicitly.
 */

import { describe, it, expect } from 'vitest';
import { parseReceipt } from '../services/receiptParser';
import {
  normalizeReceipt,
  detectTerritory,
  detectCategory,
  normalizeLabel,
  toIsoDate,
  computeConfidenceScore,
} from '../services/ocr/receiptNormalizer';
import {
  RAW_OCR_TEXT,
  EXPECTED_PARSED,
  EXPECTED_ITEMS,
  EXPECTED_NORMALIZED_COMMON,
  EXPECTED_NORMALIZED_ITEMS,
} from './fixtures/superUPetitCanalReceipt';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Find an item by case-insensitive name fragment */
function findItem(items: ReturnType<typeof parseReceipt>['items'], fragment: string) {
  return items.find((i) => i.name.toUpperCase().includes(fragment.toUpperCase()));
}

// ─── Parse suite ──────────────────────────────────────────────────────────────

describe('parseReceipt — Super U Petit Canal fixture', () => {
  const result = parseReceipt(RAW_OCR_TEXT);

  // Store header
  it("extrait le nom de l'enseigne", () => {
    expect(result.storeName).toContain('SUPER U');
  });

  it("extrait l'adresse du magasin", () => {
    expect(result.storeAddress).toMatch(/bazin/i);
  });

  // Date & time
  it('extrait la date au format DD/MM/YYYY', () => {
    expect(result.date).toBe(EXPECTED_PARSED.date);
  });

  it("extrait l'heure", () => {
    expect(result.time).toBe(EXPECTED_PARSED.time);
  });

  // Receipt number
  it('extrait le numéro de ticket', () => {
    expect(result.receiptNumber).toBe(EXPECTED_PARSED.receiptNumber);
  });

  // Total TTC
  it('extrait le total TTC', () => {
    expect(result.total).toBeCloseTo(EXPECTED_PARSED.total, 2);
  });

  // TVA
  it('extrait le montant TVA', () => {
    expect(result.tvaAmount).toBeCloseTo(EXPECTED_PARSED.tvaAmount, 2);
  });

  it('extrait le taux TVA', () => {
    expect(result.tvaRate).toBeCloseTo(EXPECTED_PARSED.tvaRate, 1);
  });

  // Payment
  it('extrait le mode de paiement', () => {
    expect(result.paymentMethod?.toLowerCase()).toContain('carte');
  });

  // Items count
  it(`extrait au moins ${EXPECTED_PARSED.itemsMinCount} lignes produit`, () => {
    expect(result.items.length).toBeGreaterThanOrEqual(EXPECTED_PARSED.itemsMinCount);
  });

  // Checksum (fixture is truncated → must not match)
  it('marque le checksum comme non concordant (ticket tronqué)', () => {
    expect(result.checksum.declared).toBeCloseTo(106.51, 2);
    expect(result.checksum.matches).toBe(EXPECTED_PARSED.checksumMatches);
  });

  // Spot-check individual items
  describe('lignes produit individuelles', () => {
    for (const expected of EXPECTED_ITEMS) {
      it(`${expected.nameFragment} → ${expected.price} €`, () => {
        const item = findItem(result.items, expected.nameFragment);
        expect(item, `item "${expected.nameFragment}" introuvable`).toBeDefined();
        expect(item!.price).toBeCloseTo(expected.price, 2);
      });

      if (expected.qty !== undefined) {
        it(`${expected.nameFragment} → qty=${expected.qty}`, () => {
          const item = findItem(result.items, expected.nameFragment);
          expect(item?.qty).toBe(expected.qty);
        });
      }

      if (expected.unitPrice !== undefined) {
        it(`${expected.nameFragment} → unitPrice=${expected.unitPrice}`, () => {
          const item = findItem(result.items, expected.nameFragment);
          expect(item?.unitPrice).toBeCloseTo(expected.unitPrice!, 2);
        });
      }
    }
  });
});

// ─── Normalizer suite ─────────────────────────────────────────────────────────

describe('normalizeReceipt — Super U Petit Canal fixture', () => {
  const parsed = parseReceipt(RAW_OCR_TEXT);
  const observations = normalizeReceipt(parsed);

  it("produit au moins autant d'observations que d'items parsés", () => {
    expect(observations.length).toBeGreaterThanOrEqual(parsed.items.length);
  });

  it('chaque observation a un productId non vide', () => {
    for (const obs of observations) {
      expect(obs.productId.length).toBeGreaterThan(0);
    }
  });

  it('territoire détecté = GP (code postal 97131)', () => {
    for (const obs of observations) {
      expect(obs.territory).toBe(EXPECTED_NORMALIZED_COMMON.territory);
    }
  });

  it('storeLabel = SUPER U', () => {
    for (const obs of observations) {
      expect(obs.storeLabel).toBe(EXPECTED_NORMALIZED_COMMON.storeLabel);
    }
  });

  it('devise = EUR', () => {
    for (const obs of observations) {
      expect(obs.currency).toBe('EUR');
    }
  });

  it('sourceType = citizen', () => {
    for (const obs of observations) {
      expect(obs.sourceType).toBe('citizen');
    }
  });

  it('observedAt est une chaîne ISO 8601 commençant par 2026-03-07', () => {
    for (const obs of observations) {
      expect(obs.observedAt).toMatch(/^2026-03-07/);
    }
  });

  it("aucune observation n'a un prix nul ou négatif", () => {
    for (const obs of observations) {
      expect(obs.price).toBeGreaterThan(0);
    }
  });

  describe('catégories par produit', () => {
    for (const expected of EXPECTED_NORMALIZED_ITEMS) {
      it(`${expected.labelFragment} → catégorie "${expected.category}"`, () => {
        const obs = observations.find((o) =>
          o.productLabel.toUpperCase().includes(expected.labelFragment.toUpperCase())
        );
        expect(obs, `observation "${expected.labelFragment}" introuvable`).toBeDefined();
        expect(obs!.price).toBeCloseTo(expected.price, 2);
        expect(obs!.productCategory).toBe(expected.category);
      });
    }
  });

  describe('suppression des lignes invalides', () => {
    it("ne produit pas d'observation pour les lignes à prix nul", () => {
      const parsed2 = parseReceipt(RAW_OCR_TEXT);
      // inject a zero-price item
      parsed2.items.push({ name: 'GRATUIT', price: 0 });
      const obs2 = normalizeReceipt(parsed2);
      expect(obs2.find((o) => o.productLabel.includes('GRATUIT'))).toBeUndefined();
    });

    it("ne produit pas d'observation pour les libellés trop courts", () => {
      const parsed3 = parseReceipt(RAW_OCR_TEXT);
      parsed3.items.push({ name: 'AB', price: 1.0 });
      const obs3 = normalizeReceipt(parsed3);
      expect(obs3.find((o) => o.productLabel === 'AB')).toBeUndefined();
    });
  });
});

// ─── detectTerritory unit tests ───────────────────────────────────────────────

describe('detectTerritory', () => {
  it('extrait GP depuis le code postal 97131', () => {
    expect(detectTerritory('RUE DE BAZIN 97131 PETIT CANAL')).toBe('GP');
  });

  it('extrait MQ depuis le code postal 97200', () => {
    expect(detectTerritory('12 RUE DE LA LIBERTE 97200 FORT DE FRANCE')).toBe('MQ');
  });

  it('extrait RE depuis le code postal 97400', () => {
    expect(detectTerritory('BOULEVARD DU GENERAL 97400 SAINT DENIS')).toBe('RE');
  });

  it('extrait GF depuis le code postal 97300', () => {
    expect(detectTerritory('AVENUE DE GAULLE 97300 CAYENNE')).toBe('GF');
  });

  it('extrait GP depuis le mot-clé "guadeloupe"', () => {
    expect(detectTerritory('GUADELOUPE', 'CARREFOUR')).toBe('GP');
  });

  it('retourne le fallback par défaut GP si aucun indice', () => {
    expect(detectTerritory()).toBe('GP');
  });

  it('retourne le fallback fourni si aucun indice', () => {
    expect(detectTerritory(undefined, undefined, 'MQ')).toBe('MQ');
  });
});

// ─── detectCategory unit tests ────────────────────────────────────────────────

describe('detectCategory', () => {
  const cases: Array<[string, string]> = [
    ['Lait UHT demi-écrémé 1L', 'Produits laitiers'],
    ['Emmental râpé 500g', 'Produits laitiers'],
    ['Camembert cœur de lion', 'Produits laitiers'],
    ['Carottes bio 1,5 kg', 'Fruits et légumes'],
    ['Tomates locales', 'Fruits et légumes'],
    ['Jambon cru 150g', 'Viandes et poissons'],
    ['Cordon bleu poulet x6', 'Viandes et poissons'],
    ['Café moulu robusta 250g', 'Épicerie'],
    ['Chocolat noir 72%', 'Épicerie'],
    ['Pâte à tartiner noisette 200g', 'Épicerie'],
    ['Sucre roux 1,5 kg', 'Épicerie'],
    ['Pain de mie hamburger x4', 'Épicerie'],
    ['Haricots rouges secs 1 kg', 'Épicerie'],
    ['Margarine Oméga 3', 'Boissons'],
    ['Rhum Damoiseau blanc 1L', 'Boissons'],
    ['Coca-Cola PET 2L', 'Boissons'],
    ['Essuie-tout Papeco 2 rouleaux', 'Entretien'],
    ['Papier toilette Doudou 10+2 rouleaux', 'Entretien'],
    ['Croquettes chien', 'Autres'],
  ];

  for (const [label, expected] of cases) {
    it(`"${label}" → ${expected}`, () => {
      expect(detectCategory(label)).toBe(expected);
    });
  }
});

// ─── normalizeLabel unit tests ────────────────────────────────────────────────

describe('normalizeLabel', () => {
  it('supprime le code interne PXM', () => {
    expect(normalizeLabel('CAFE MOULU ROBUSTA PXM 250G')).not.toContain('PXM');
  });

  it('supprime le code interne LS', () => {
    expect(normalizeLabel('FROMAGE LS FROMAGE PAST NOIX')).not.toContain(' LS ');
  });

  it('développe SCE → sauce', () => {
    expect(normalizeLabel('SARDINES SCE CITRONNEE')).toContain('sauce');
  });

  it('développe PAST → pasteurisé', () => {
    expect(normalizeLabel('FROMAGE PAST NOIX')).toContain('pasteurisé');
  });

  it('développe 1/2 ECREME → demi-écrémé', () => {
    expect(normalizeLabel('LAIT 1/2 ECREME UHT')).toContain('demi-écrémé');
  });

  it('collapse les espaces multiples', () => {
    const result = normalizeLabel('ARTICLE   AVEC   ESPACES');
    expect(result).not.toContain('  ');
  });
});

// ─── toIsoDate unit tests ─────────────────────────────────────────────────────

describe('toIsoDate', () => {
  it('convertit DD/MM/YYYY + HH:MM correctement', () => {
    expect(toIsoDate('07/03/2026', '10:21')).toBe('2026-03-07T10:21:00');
  });

  it('convertit DD/MM/YYYY sans heure', () => {
    expect(toIsoDate('07/03/2026')).toBe('2026-03-07T00:00:00');
  });

  it('retourne une date courante si entrée undefined', () => {
    const result = toIsoDate(undefined);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('retourne une date courante si format invalide', () => {
    const result = toIsoDate('not-a-date');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ─── computeConfidenceScore unit tests ───────────────────────────────────────

describe('computeConfidenceScore', () => {
  const baseParsed = parseReceipt(RAW_OCR_TEXT);

  it('score de base raisonnable pour un produit clair', () => {
    const item = { name: 'CAFE MOULU ROBUSTA 250G', price: 4.14 };
    const score = computeConfidenceScore(item, baseParsed);
    expect(score).toBeGreaterThanOrEqual(0.75);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it('score réduit pour un label ambigu (Virianna)', () => {
    const clear = { name: 'CAFE MOULU ROBUSTA 250G', price: 4.14 };
    const ambiguous = { name: 'FROMAGE FONDANT VIRIANNA', price: 2.89 };
    expect(computeConfidenceScore(ambiguous, baseParsed)).toBeLessThan(
      computeConfidenceScore(clear, baseParsed)
    );
  });

  it('score réduit pour un libellé très court', () => {
    const short = { name: 'AB', price: 1.0 };
    const score = computeConfidenceScore(short, baseParsed);
    expect(score).toBeLessThan(0.75);
  });

  it('score toujours dans [0, 1]', () => {
    const adversarial = { name: 'X', price: -1 };
    const score = computeConfidenceScore(adversarial, baseParsed);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

// ─── normalizeReceipt with territory override ─────────────────────────────────

describe('normalizeReceipt — territory override', () => {
  it('utilise le territoire forcé quand fourni', () => {
    const parsed = parseReceipt(RAW_OCR_TEXT);
    const obs = normalizeReceipt(parsed, { territory: 'MQ' });
    expect(obs.every((o) => o.territory === 'MQ')).toBe(true);
  });
});
