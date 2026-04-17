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
  const territory =
    typeof payload.territory === 'string' && payload.territory.trim().length > 0
      ? payload.territory
      : 'Guadeloupe';
  const topCategory =
    typeof payload.topCategory === 'string' && payload.topCategory.trim().length > 0
      ? payload.topCategory
      : 'produits du quotidien';
  const topProduct =
    typeof payload.topProduct === 'string' && payload.topProduct.trim().length > 0
      ? payload.topProduct
      : 'un produit essentiel';
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

  const dateLabel =
    typeof payload.date === 'string' && payload.date.trim().length > 0
      ? payload.date
      : new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return [
    `📊 Point prix du ${dateLabel} — ${territory}`,
    `Tendance "${topCategory}" : ${trend} (${absDelta}%) sur les dernières observations.`,
    `Produit à suivre : ${topProduct}.`,
    highlights || 'Alerte utile : surveillez les promotions de proximité cette semaine.',
    "Vous voulez plus d'analyses locales chaque matin ? 🪷",
  ].join('\n');
}

// ─── Historique des posts (localStorage) ──────────────────────────────────────

export interface GhostwriterHistoryEntry {
  id: string;
  generatedAt: string;
  post: string;
  briefing?: string;
}

const STORAGE_KEY = 'ghostwriter_post_history';
const MAX_HISTORY = 10;

function loadHistory(): GhostwriterHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as GhostwriterHistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: GhostwriterHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {
    // ignore quota errors
  }
}

/**
 * Retourne les entrées de l'historique (les 10 plus récentes, ordre anti-chronologique).
 */
export function getGhostwriterHistory(): GhostwriterHistoryEntry[] {
  return loadHistory();
}

/**
 * Sauvegarde un post généré dans l'historique localStorage.
 * Déduplique par contenu exact (évite les doublons en cas de re-render).
 */
export function saveGhostwriterPost(post: string, briefing?: string): GhostwriterHistoryEntry {
  const existing = loadHistory();
  if (existing.length > 0 && existing[0].post === post) return existing[0];

  const entry: GhostwriterHistoryEntry = {
    id: Date.now().toString(36),
    generatedAt: new Date().toISOString(),
    post,
    briefing,
  };
  saveHistory([entry, ...existing]);
  return entry;
}
