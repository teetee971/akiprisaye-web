/**
 * keywordGapEngine.ts — Keyword gap detection and prioritisation (V5)
 *
 * Generates priority keyword families for SEO conquest:
 *   - prix + produit + territoire        → high volume, transactional
 *   - meilleur prix + produit            → purchase intent
 *   - enseigne vs enseigne + territoire  → comparison pages, low competition
 *   - super u moins cher + produit       → branded long-tail
 *
 * All outputs are deterministic (sorted alphabetically then by score).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type KeywordFamily =
  | 'prix-produit-territoire'
  | 'meilleur-prix-produit'
  | 'enseigne-vs-enseigne'
  | 'moins-cher-produit'
  | 'inflation-territoire'
  | 'comparateur-produit';

export interface KeywordEntry {
  keyword: string;
  family: KeywordFamily;
  territory: string;
  product?: string;
  retailer1?: string;
  retailer2?: string;
  /** Estimated priority score 0–100 */
  priority: number;
  /** Suggested target URL slug */
  slug: string;
  /** Suggested page type */
  pageType: 'comparateur' | 'prix' | 'meilleur-prix' | 'guide' | 'inflation';
}

// ── Static data ───────────────────────────────────────────────────────────────

const TERRITORY_LABELS: Record<string, string> = {
  gp: 'guadeloupe',
  mq: 'martinique',
  gf: 'guyane',
  re: 'la-reunion',
  yt: 'mayotte',
};

const DEFAULT_PRODUCTS = [
  'riz',
  'lait',
  'huile',
  'sucre',
  'farine',
  'beurre',
  'yaourt',
  'poulet',
  'jambon',
  'eau',
  'coca-cola',
  'pates',
];

const DEFAULT_RETAILERS = ['carrefour', 'leclerc', 'super-u', 'leader-price', 'intermarch'];

// ── Slug helpers ──────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Core generator ────────────────────────────────────────────────────────────

/**
 * Generate all keyword gap entries for given products, territories, and retailers.
 *
 * @param products   Product slug list (defaults to DEFAULT_PRODUCTS)
 * @param territories Territory code list (defaults to all 4 main territories)
 * @param retailers  Retailer slug list (defaults to DEFAULT_RETAILERS)
 */
export function generateKeywordGaps(
  products: string[] = DEFAULT_PRODUCTS,
  territories: string[] = Object.keys(TERRITORY_LABELS),
  retailers: string[] = DEFAULT_RETAILERS
): KeywordEntry[] {
  const entries: KeywordEntry[] = [];

  for (const territory of territories) {
    const terrSlug = TERRITORY_LABELS[territory] ?? slugify(territory);

    for (const product of products) {
      const productSlug = slugify(product);

      // Family 1: prix + produit + territoire
      entries.push({
        keyword: `prix ${product} ${terrSlug.replace(/-/g, ' ')}`,
        family: 'prix-produit-territoire',
        territory,
        product,
        priority: 80,
        slug: `comparateur/${productSlug}-${terrSlug}`,
        pageType: 'comparateur',
      });

      // Family 2: meilleur prix + produit
      entries.push({
        keyword: `meilleur prix ${product} ${terrSlug.replace(/-/g, ' ')}`,
        family: 'meilleur-prix-produit',
        territory,
        product,
        priority: 75,
        slug: `prix/${productSlug}-${terrSlug}`,
        pageType: 'prix',
      });

      // Family 4: moins cher + produit
      entries.push({
        keyword: `${product} moins cher ${terrSlug.replace(/-/g, ' ')}`,
        family: 'moins-cher-produit',
        territory,
        product,
        priority: 65,
        slug: `moins-cher/${territory}`,
        pageType: 'guide',
      });
    }

    // Family 5: inflation + territoire
    entries.push({
      keyword: `inflation alimentaire ${terrSlug.replace(/-/g, ' ')}`,
      family: 'inflation-territoire',
      territory,
      priority: 60,
      slug: `inflation/alimentaire-${terrSlug}`,
      pageType: 'inflation',
    });

    // Family 3: enseigne vs enseigne + territoire (pairs)
    for (let i = 0; i < retailers.length; i++) {
      for (let j = i + 1; j < retailers.length; j++) {
        const r1 = retailers[i],
          r2 = retailers[j];
        entries.push({
          keyword: `${r1} vs ${r2} ${terrSlug.replace(/-/g, ' ')}`,
          family: 'enseigne-vs-enseigne',
          territory,
          retailer1: r1,
          retailer2: r2,
          priority: 70,
          slug: `comparer/${r1}-vs-${r2}-${terrSlug}`,
          pageType: 'comparateur',
        });
      }
    }
  }

  // Deduplicate by slug, then sort deterministically
  const seen = new Set<string>();
  const dedup = entries.filter((e) => {
    if (seen.has(e.slug)) return false;
    seen.add(e.slug);
    return true;
  });

  return dedup.sort((a, b) => b.priority - a.priority || a.keyword.localeCompare(b.keyword, 'fr'));
}

/**
 * Filter keyword entries by family type.
 */
export function filterByFamily(entries: KeywordEntry[], family: KeywordFamily): KeywordEntry[] {
  return entries.filter((e) => e.family === family);
}

/**
 * Return the top N highest-priority keyword entries.
 */
export function getTopKeywords(entries: KeywordEntry[], limit = 50): KeywordEntry[] {
  return entries.slice(0, limit);
}
