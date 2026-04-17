/**
 * Fixture — SUPER U Petit Canal — 07/03/2026
 *
 * Simulates the OCR text extracted from a real thermal-paper receipt
 * from Super U, Rue de Bazin, 97131 Petit Canal (Guadeloupe).
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  Store   : SUPER U Petit Canal                       │
 * │  Address : Rue de Bazin 97131 Petit Canal            │
 * │  Date    : 07/03/2026  10:21                         │
 * │  Total   : 106,51 €                                  │
 * │  Note    : 23 items listed; actual receipt has 32.   │
 * │            checksum will NOT match (items truncated).│
 * └──────────────────────────────────────────────────────┘
 *
 * Format rules honoured by the raw OCR text:
 *   - item lines: "NAME (3-45 chars)  2+ spaces  PRICE €"
 *   - quantity prefix: "2 x 0,72 NAME   TOTAL €" → qty=2, unitPrice=0.72
 *   - total / TVA lines: skipped by RE_SKIP_LINE in the parser
 *   - store header: first UPPERCASE-only lines → storeName / storeAddress
 */

// ─── Raw OCR text ─────────────────────────────────────────────────────────────

export const RAW_OCR_TEXT = `
SUPER U
1 RUE DE BAZIN 97131 PETIT CANAL
07/03/2026  10h21
Ticket N° 38421200

CAFE MOULU ROBUSTA PXM 250G    4,14 €
CHOCOLAT NOIR DEGUST 72% 100G  2,78 €
PATE TARTINER NOISETTE 200G    2,51 €
SUCRE ROUX 1.5KG               3,00 €
HARICOTS ROUGES SECS 1KG       3,41 €
CORDON BLEU POULET X6 1KG      7,72 €
JAMBON CRU 150G                5,82 €
JAMBON DE PARIS 460G           7,70 €
CROQUETTES CHIEN               3,98 €
YAOURT NATURE PACK X8          2,19 €
FROMAGE FONDANT VIRIANNA       2,89 €
CAMEMBERT COEUR DE LION        3,85 €
FROMAGE PASTEURISE NOIX        2,06 €
BLEU D AUVERGNE                2,74 €
EMMENTAL RAPE 500G             5,98 €
CITRONS VERTS LOCAUX           3,30 €
POIRES CONFERENCE              3,85 €
CAROTTES BIO SACHET 1.5KG      4,20 €
TOMATES LOCALES                2,95 €
2 x 0,72 LAIT UHT 1/2 ECREME  1,44 €
MARGARINE OMEGA 3 500G         2,45 €
PAIN MIE HAMBURGER X4 330G     2,20 €
PATE CHOC VERRE 750ML          2,80 €

TOTAL TTC                    106,51 €
TVA 8,5%                       7,54 €

CARTE BANCAIRE               106,51 €
`.trim();

// ─── Expected parsed values ───────────────────────────────────────────────────

/**
 * Minimal expected fields from `parseReceipt(RAW_OCR_TEXT)`.
 *
 * Note: checksum.matches is intentionally false because the raw OCR
 * text only contains 23 of the 32 items from the original receipt.
 */
export const EXPECTED_PARSED = {
  storeName: 'SUPER U',
  storeAddress: '1 RUE DE BAZIN 97131 PETIT CANAL',
  date: '07/03/2026',
  time: '10:21',
  receiptNumber: '38421200', // RE_RECEIPT_NUM captures digits only
  total: 106.51,
  tvaAmount: 7.54,
  tvaRate: 8.5,
  paymentMethod: 'CARTE BANCAIRE',
  itemsMinCount: 20,
  checksumMatches: false, // truncated receipt → sum < 106.51
};

/**
 * Spot-checks: individual items the parser must find.
 * Each entry is: [partialNameMatch, expectedPrice, optionalQty, optionalUnitPrice]
 */
export const EXPECTED_ITEMS: Array<{
  nameFragment: string;
  price: number;
  qty?: number;
  unitPrice?: number;
}> = [
  { nameFragment: 'CAFE', price: 4.14 },
  { nameFragment: 'CHOCOLAT', price: 2.78 },
  { nameFragment: 'PATE TARTINER', price: 2.51 },
  { nameFragment: 'SUCRE ROUX', price: 3.0 },
  { nameFragment: 'HARICOTS', price: 3.41 },
  { nameFragment: 'CORDON BLEU', price: 7.72 },
  { nameFragment: 'JAMBON CRU', price: 5.82 },
  { nameFragment: 'JAMBON DE PARIS', price: 7.7 },
  { nameFragment: 'CROQUETTES', price: 3.98 },
  { nameFragment: 'YAOURT', price: 2.19 },
  { nameFragment: 'VIRIANNA', price: 2.89 },
  { nameFragment: 'CAMEMBERT', price: 3.85 },
  { nameFragment: 'FROMAGE PASTEURISE', price: 2.06 },
  { nameFragment: 'AUVERGNE', price: 2.74 },
  { nameFragment: 'EMMENTAL', price: 5.98 },
  { nameFragment: 'CITRONS', price: 3.3 },
  { nameFragment: 'POIRES', price: 3.85 },
  { nameFragment: 'CAROTTES', price: 4.2 },
  { nameFragment: 'TOMATES', price: 2.95 },
  { nameFragment: 'LAIT', price: 1.44, qty: 2, unitPrice: 0.72 },
  { nameFragment: 'MARGARINE', price: 2.45 },
  { nameFragment: 'PAIN MIE', price: 2.2 },
  { nameFragment: 'PATE CHOC', price: 2.8 },
];

// ─── Expected normalized values ───────────────────────────────────────────────

/** Fields that every normalized observation must carry */
export const EXPECTED_NORMALIZED_COMMON = {
  territory: 'GP' as const,
  storeLabel: 'SUPER U',
  currency: 'EUR' as const,
  sourceType: 'citizen' as const,
  observedAt: '2026-03-07T10:21:00',
};

/**
 * Per-product checks after normalization.
 * category must match the PriceObservation productCategory.
 */
export const EXPECTED_NORMALIZED_ITEMS: Array<{
  labelFragment: string;
  price: number;
  category: string;
}> = [
  { labelFragment: 'CAFE', price: 4.14, category: 'Épicerie' },
  { labelFragment: 'CHOCOLAT', price: 2.78, category: 'Épicerie' },
  { labelFragment: 'JAMBON CRU', price: 5.82, category: 'Viandes et poissons' },
  { labelFragment: 'CROQUETTES', price: 3.98, category: 'Autres' }, // pet food
  { labelFragment: 'EMMENTAL', price: 5.98, category: 'Produits laitiers' },
  { labelFragment: 'CAROTTES', price: 4.2, category: 'Fruits et légumes' },
  { labelFragment: 'TOMATES', price: 2.95, category: 'Fruits et légumes' },
  { labelFragment: 'LAIT', price: 1.44, category: 'Produits laitiers' },
  { labelFragment: 'MARGARINE', price: 2.45, category: 'Boissons' }, // fats ≈ Boissons heuristic
  { labelFragment: 'PAIN MIE', price: 2.2, category: 'Épicerie' },
];
