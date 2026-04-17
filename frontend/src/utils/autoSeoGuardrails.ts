export const MAX_HIGH_PRIORITY = 20;
export const MAX_DUPLICATIONS = 10;
export const WHITELISTED_PATCH_FILES = [
  'frontend/src/data/seo/generated-pages.json',
  'frontend/src/data/seo/internal-links-map.json',
  'frontend/src/data/seo/generated-content.json',
  'seo-pages-manifest.json',
  'public/sitemap.xml',
] as const;

export function capHighPriority<T extends { priority: string }>(items: T[]): T[] {
  const high = items.filter((i) => i.priority === 'high').slice(0, MAX_HIGH_PRIORITY);
  const rest = items.filter((i) => i.priority !== 'high');
  return [...high, ...rest];
}

export function capDuplications<T extends { type?: string; recommendationType?: string }>(
  patches: T[]
): T[] {
  let dupCount = 0;
  return patches.filter((p) => {
    const isDup = p.type === 'DUPLICATE_PAGE' || p.recommendationType === 'DUPLICATE_PAGE';
    if (isDup) {
      dupCount++;
      return dupCount <= MAX_DUPLICATIONS;
    }
    return true;
  });
}

export function isWhitelisted(file: string): boolean {
  return (WHITELISTED_PATCH_FILES as readonly string[]).includes(file);
}

export function validateRecommendations<T extends { reason?: string; type: string }>(
  items: T[]
): T[] {
  return items.filter((i) => i.reason && i.reason.trim().length > 0);
}
