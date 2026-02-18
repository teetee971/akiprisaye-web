import { lookupProductByEan, searchProductsByText, type OffProduct } from './openFoodFactsClient';

export type EnrichedProductCandidate = {
  id: string;
  source: 'openfoodfacts';
  ean?: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  quantity?: string;
  score: number;
};

interface EnrichInput {
  itemName: string;
  brandHint?: string;
  quantityHint?: string;
  ean?: string;
}

function normalize(text?: string): string {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, (_, row) =>
    Array.from({ length: a.length + 1 }, (_, col) => (row === 0 ? col : col === 0 ? row : 0)),
  );

  for (let row = 1; row <= b.length; row += 1) {
    for (let col = 1; col <= a.length; col += 1) {
      const cost = a[col - 1] === b[row - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[b.length][a.length];
}

export function similarityScore(left: string, right: string): number {
  const a = normalize(left);
  const b = normalize(right);

  if (!a || !b) {
    return 0;
  }

  if (a.includes(b) || b.includes(a)) {
    return 0.95;
  }

  const distance = levenshtein(a, b);
  const longest = Math.max(a.length, b.length);
  return Math.max(0, 1 - distance / longest);
}

export function scoreCandidate(product: OffProduct, input: EnrichInput): number {
  const nameScore = similarityScore(input.itemName, product.product_name ?? '');
  const normalizedBrandHint = normalize(input.brandHint);
  const normalizedBrand = normalize(product.brands);
  const normalizedQuantityHint = normalize(input.quantityHint);
  const normalizedQuantity = normalize(product.quantity);

  let score = nameScore * 0.7;

  if (normalizedBrandHint && normalizedBrand && normalizedBrand.includes(normalizedBrandHint)) {
    score += 0.2;
  }

  if (normalizedQuantityHint && normalizedQuantity && normalizedQuantity.includes(normalizedQuantityHint)) {
    score += 0.1;
  }

  return Math.max(0, Math.min(1, Number(score.toFixed(4))));
}

function mapToCandidate(product: OffProduct, input: EnrichInput): EnrichedProductCandidate | null {
  const name = product.product_name?.trim();
  if (!name) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    source: 'openfoodfacts',
    ean: product.code,
    name,
    brand: product.brands,
    imageUrl: product.image_front_url ?? product.image_url,
    quantity: product.quantity,
    score: scoreCandidate(product, input),
  };
}

export async function enrichWithOpenFoodFacts(input: EnrichInput): Promise<EnrichedProductCandidate[]> {
  const candidates: EnrichedProductCandidate[] = [];

  if (input.ean) {
    const product = await lookupProductByEan(input.ean);
    const byEan = product ? mapToCandidate({ ...product, code: product.code ?? input.ean }, input) : null;
    if (byEan) {
      candidates.push(byEan);
    }
  }

  const searchProducts = await searchProductsByText(input.itemName);
  for (const product of searchProducts) {
    const candidate = mapToCandidate(product, input);
    if (!candidate) {
      continue;
    }

    if (candidates.some((item) => item.ean && candidate.ean && item.ean === candidate.ean)) {
      continue;
    }

    candidates.push(candidate);
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
