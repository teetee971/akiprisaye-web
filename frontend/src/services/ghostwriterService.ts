export interface GhostwriterDailyPostData {
  territory?: string;
  topCategory?: string;
  topProduct?: string;
  averagePriceChangePct?: number;
  notableDrops?: Array<{ name: string; changePct: number }>;
  notableIncreases?: Array<{ name: string; changePct: number }>;
  date?: string;
}

/**
 * Génère un post quotidien engageant à partir de statistiques de prix.
 * MVP Ghostwriter OS : version locale, sans appel externe.
 */
export function generateDailyPost(data?: Partial<GhostwriterDailyPostData>): string {
  const payload = data ?? {};
  const territory = payload.territory ?? 'Guadeloupe';
  const topCategory = payload.topCategory ?? 'produits du quotidien';
  const topProduct = payload.topProduct ?? 'un produit essentiel';
  const delta = payload.averagePriceChangePct ?? 0;
  const trend = delta < 0 ? 'en baisse' : delta > 0 ? 'en hausse' : 'stable';
  const absDelta = Math.abs(delta).toFixed(1);

  const drops = (payload.notableDrops ?? [])
    .slice(0, 2)
    .map((item) => `⬇️ ${item.name} (${Math.abs(item.changePct).toFixed(1)}%)`)
    .join(' · ');

  const increases = (payload.notableIncreases ?? [])
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
