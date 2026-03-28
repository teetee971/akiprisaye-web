export interface GhostwriterDailyPostData {
  territory?: string;
  topCategory?: string;
  topProduct?: string;
  averagePriceChangePct?: number;
  notableDrops?: Array<{ name: string; changePct: number }>;
  notableIncreases?: Array<{ name: string; changePct: number }>;
  date?: string;
}

interface NamedPctItem {
  name?: string;
  changePct?: number;
}

function toSafeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toNamedPctArray(value: unknown): Array<{ name: string; changePct: number }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const candidate = (item ?? {}) as NamedPctItem;
      const name = typeof candidate.name === 'string' ? candidate.name : '';
      const changePct = toSafeNumber(candidate.changePct, 0);
      return { name, changePct };
    })
    .filter((item) => item.name.length > 0);
}

/**
 * Génère un post quotidien engageant à partir de statistiques de prix.
 * MVP Ghostwriter OS : version locale, sans appel externe.
 */
export function generateDailyPost(data: GhostwriterDailyPostData): string {
  const payload = (data ?? {}) as GhostwriterDailyPostData & Record<string, unknown>;
  const territory = typeof payload.territory === 'string' && payload.territory.trim().length > 0 ? payload.territory : 'Guadeloupe';
  const topCategory = typeof payload.topCategory === 'string' && payload.topCategory.trim().length > 0 ? payload.topCategory : 'produits du quotidien';
  const topProduct = typeof payload.topProduct === 'string' && payload.topProduct.trim().length > 0 ? payload.topProduct : 'un produit essentiel';
  const delta = toSafeNumber(payload.averagePriceChangePct, 0);
  const trend = delta < 0 ? 'en baisse' : delta > 0 ? 'en hausse' : 'stable';
  const absDelta = Math.abs(delta).toFixed(1);
  const dropsArray = toNamedPctArray(payload.notableDrops);
  const increasesArray = toNamedPctArray(payload.notableIncreases);

  const drops = dropsArray
    .slice(0, 2)
    .map((item) => `⬇️ ${item.name} (${Math.abs(item.changePct).toFixed(1)}%)`)
    .join(' · ');

  const increases = increasesArray
    .slice(0, 2)
    .map((item) => `⬆️ ${item.name} (${Math.abs(item.changePct).toFixed(1)}%)`)
    .join(' · ');

  const highlights = [drops, increases].filter(Boolean).join(' | ');

  return [
    `📊 Point prix du jour — ${territory}`,
    `Les ${topCategory} sont ${trend} (${absDelta}%) sur les dernières observations.`,
    `Produit à suivre : ${topProduct}.`,
    highlights || 'Alerte utile : surveillez les promotions de proximité cette semaine.',
    'Vous voulez plus d’analyses locales chaque matin ? 🪷',
  ].join('\n');
}
