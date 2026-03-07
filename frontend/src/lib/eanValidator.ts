/**
 * EAN / GTIN Validator
 *
 * Implements the GS1 checksum algorithm for:
 *   - EAN-13 (most European retail products)
 *   - EAN-8  (smaller products)
 *   - UPC-A  (North American retail; structurally identical to EAN-13 with leading 0)
 *   - GTIN-14 (trade/logistics units)
 *
 * Reference: https://www.gs1.org/services/how-calculate-check-digit-manually
 *
 * ⚠️ No external dependencies — pure computation, fully offline.
 */

/** GS1 country/region prefix labels (first 3 digits of EAN-13 GCP, as integer range) */
const GS1_PREFIX_MAP: Array<[number, number, string]> = [
  [0, 99, '🇺🇸 UPC (États-Unis / Canada)'],
  [200, 299, 'Usage interne / Magasin'],
  [300, 379, '🇫🇷 France'],
  [380, 380, '🇧🇬 Bulgarie'],
  [385, 385, '🇭🇷 Croatie'],
  [400, 440, '🇩🇪 Allemagne'],
  [450, 459, '🇯🇵 Japon'],
  [460, 469, '🇷🇺 Russie'],
  [471, 471, '🇹🇼 Taïwan'],
  [474, 474, '🇪🇪 Estonie'],
  [475, 475, '🇱🇻 Lettonie'],
  [476, 476, '🇦🇿 Azerbaïdjan'],
  [477, 477, '🇱🇹 Lituanie'],
  [479, 479, '🇱🇰 Sri Lanka'],
  [480, 480, '🇵🇭 Philippines'],
  [481, 481, '🇧🇾 Biélorussie'],
  [482, 482, '🇺🇦 Ukraine'],
  [484, 484, '🇲🇩 Moldavie'],
  [485, 485, '🇦🇲 Arménie'],
  [486, 486, '🇬🇪 Géorgie'],
  [487, 487, '🇰🇿 Kazakhstan'],
  [489, 489, '🇭🇰 Hong Kong'],
  [490, 499, '🇯🇵 Japon'],
  [500, 509, '🇬🇧 Royaume-Uni'],
  [520, 521, '🇬🇷 Grèce'],
  [528, 528, '🇱🇧 Liban'],
  [529, 529, '🇨🇾 Chypre'],
  [531, 531, '🇲🇰 Macédoine du Nord'],
  [535, 535, '🇲🇹 Malte'],
  [539, 539, '🇮🇪 Irlande'],
  [540, 549, '🇧🇪 Belgique / 🇱🇺 Luxembourg'],
  [560, 560, '🇵🇹 Portugal'],
  [569, 569, '🇮🇸 Islande'],
  [570, 579, '🇩🇰 Danemark'],
  [590, 590, '🇵🇱 Pologne'],
  [594, 594, '🇷🇴 Roumanie'],
  [599, 599, '🇭🇺 Hongrie'],
  [600, 601, '🇿🇦 Afrique du Sud'],
  [603, 603, '🇬🇭 Ghana'],
  [608, 608, '🇧🇭 Bahreïn'],
  [609, 609, '🇲🇺 Maurice'],
  [611, 611, '🇲🇦 Maroc'],
  [613, 613, '🇩🇿 Algérie'],
  [615, 615, '🇳🇬 Nigeria'],
  [616, 616, '🇰🇪 Kenya'],
  [619, 619, '🇹🇳 Tunisie'],
  [621, 621, '🇸🇾 Syrie'],
  [622, 622, '🇪🇬 Égypte'],
  [624, 624, '🇱🇾 Libye'],
  [625, 625, '🇯🇴 Jordanie'],
  [626, 626, '🇮🇷 Iran'],
  [627, 627, '🇰🇼 Koweït'],
  [628, 628, '🇸🇦 Arabie Saoudite'],
  [629, 629, '🇦🇪 Émirats Arabes Unis'],
  [640, 649, '🇫🇮 Finlande'],
  [690, 695, '🇨🇳 Chine'],
  [700, 709, '🇳🇴 Norvège'],
  [729, 729, '🇮🇱 Israël'],
  [730, 739, '🇸🇪 Suède'],
  [750, 750, '🇲🇽 Mexique'],
  [754, 755, '🇨🇦 Canada'],
  [759, 759, '🇻🇪 Venezuela'],
  [760, 769, '🇨🇭 Suisse'],
  [770, 771, '🇨🇴 Colombie'],
  [773, 773, '🇺🇾 Uruguay'],
  [775, 775, '🇵🇪 Pérou'],
  [777, 777, '🇧🇴 Bolivie'],
  [779, 779, '🇦🇷 Argentine'],
  [780, 780, '🇨🇱 Chili'],
  [784, 784, '🇵🇾 Paraguay'],
  [786, 786, '🇪🇨 Équateur'],
  [789, 790, '🇧🇷 Brésil'],
  [800, 839, '🇮🇹 Italie'],
  [840, 849, '🇪🇸 Espagne'],
  [850, 850, '🇨🇺 Cuba'],
  [858, 858, '🇸🇰 Slovaquie'],
  [859, 859, '🇨🇿 République Tchèque'],
  [860, 860, '🇷🇸 Serbie'],
  [865, 865, '🇲🇳 Mongolie'],
  [867, 867, '🇰🇵 Corée du Nord'],
  [868, 869, '🇹🇷 Turquie'],
  [870, 879, '🇳🇱 Pays-Bas'],
  [880, 880, '🇰🇷 Corée du Sud'],
  [884, 884, '🇰🇭 Cambodge'],
  [885, 885, '🇹🇭 Thaïlande'],
  [888, 888, '🇸🇬 Singapour'],
  [890, 890, '🇮🇳 Inde'],
  [893, 893, '🇻🇳 Viêt Nam'],
  [896, 896, '🇵🇰 Pakistan'],
  [899, 899, '🇮🇩 Indonésie'],
  [900, 919, '🇦🇹 Autriche'],
  [930, 939, '🇦🇺 Australie'],
  [940, 949, '🇳🇿 Nouvelle-Zélande'],
  [955, 955, '🇲🇾 Malaisie'],
  [958, 958, '🇲🇴 Macao'],
  [977, 977, 'ISSN (périodiques)'],
  [978, 979, 'ISBN (livres)'],
  [980, 980, 'Remboursements / coupons'],
  [981, 982, 'Coupons monnaie commune'],
  [990, 999, 'Coupons'],
];

/**
 * Compute the GS1 check digit for a string of N-1 digits.
 * The check digit is the last digit of an EAN/GTIN code.
 */
function computeGS1CheckDigit(digits: string): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const d = parseInt(digits[digits.length - 1 - i], 10);
    // Rightmost position gets weight 3, next gets 1, alternating
    sum += d * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

/** Return true if the code passes the GS1 check-digit test */
function validateGS1(code: string): boolean {
  if (!/^\d+$/.test(code)) return false;
  const body = code.slice(0, -1);
  const declared = parseInt(code[code.length - 1], 10);
  return computeGS1CheckDigit(body) === declared;
}

/**
 * Validate an EAN-13 barcode (13 digits, GS1 checksum).
 */
export function validateEAN13(code: string): boolean {
  const clean = code.trim();
  return clean.length === 13 && validateGS1(clean);
}

/**
 * Validate an EAN-8 barcode (8 digits, GS1 checksum).
 */
export function validateEAN8(code: string): boolean {
  const clean = code.trim();
  return clean.length === 8 && validateGS1(clean);
}

/**
 * Validate a UPC-A barcode (12 digits).
 * UPC-A is structurally equivalent to EAN-13 with a leading 0.
 */
export function validateUPCA(code: string): boolean {
  const clean = code.trim();
  return clean.length === 12 && validateGS1(`0${clean}`);
}

/**
 * Validate any supported GTIN (8, 12, 13 or 14 digits).
 */
export function validateGTIN(code: string): boolean {
  const clean = code.trim();
  if (!/^\d+$/.test(clean)) return false;
  if ([8, 12, 13, 14].includes(clean.length)) return validateGS1(clean);
  return false;
}

/**
 * Normalize a UPC-A (12 digits) or EAN-8 to EAN-13 by padding with leading zeros.
 * Returns null for unsupported or invalid codes.
 */
export function normalizeToEAN13(code: string): string | null {
  const clean = code.trim().replace(/\s+/g, '');
  if (!/^\d+$/.test(clean)) return null;
  if (clean.length === 13) return validateEAN13(clean) ? clean : null;
  if (clean.length === 12) {
    const ean13 = `0${clean}`;
    return validateEAN13(ean13) ? ean13 : null;
  }
  if (clean.length === 8) {
    // EAN-8 cannot be mechanically extended to EAN-13; return as-is if valid
    return validateEAN8(clean) ? clean : null;
  }
  return null;
}

/**
 * Look up the GS1 country/region label from the first 3 digits of an EAN-13 code.
 * Returns null for EAN-8 or unrecognized prefixes.
 */
export function getGS1CountryLabel(code: string): string | null {
  const clean = code.trim();
  if (clean.length < 3 || !/^\d/.test(clean)) return null;

  const prefix3 = parseInt(clean.slice(0, 3), 10);

  for (const [min, max, label] of GS1_PREFIX_MAP) {
    if (prefix3 >= min && prefix3 <= max) return label;
  }

  return null;
}

/**
 * Compute the expected check digit for a partial GTIN body (all digits except last).
 * Useful for real-time validation feedback while the user types.
 */
export function computeCheckDigit(body: string): number | null {
  if (!/^\d+$/.test(body)) return null;
  if (![7, 11, 12, 13].includes(body.length)) return null;
  return computeGS1CheckDigit(body);
}
