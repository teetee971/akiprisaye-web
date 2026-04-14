/**
 * Automation Status Service
 *
 * Agrège les indicateurs temps réel de l'automatisation :
 *   - Santé des scrapers (scraping-health.json)
 *   - Workflows GitHub Actions récents
 *   - File de modération citoyenne
 *   - Alertes prix déclenchées
 *   - Lettre hebdo IA (dernière génération Firestore)
 */

import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScrapingSourceStatus {
  name: string;
  label: string;
  count: number;
  ok: boolean;
}

export interface ScrapingHealth {
  lastScrapedAt: string | null;
  date: string | null;
  dryRun: boolean;
  deepScan: boolean;
  sources: ScrapingSourceStatus[];
  totalEntries: number;
  shocksDetected: number;
  status: 'ok' | 'empty' | 'stale' | 'unknown';
  staleness: 'fresh' | 'recent' | 'stale' | 'unknown';
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed' | string;
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  event: string;
}

export interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  lastCheckedAt: string;
}

export interface AlertStats {
  activeAlerts: number;
  triggeredLast24h: number;
  lastTriggeredAt: string | null;
  lastCheckedAt: string;
}

export interface LettreHebdoStatus {
  lastGeneratedAt: string | null;
  lastWeekId: string | null;
  status: 'ok' | 'missing' | 'unknown';
}

export interface AutomationStatus {
  scraping: ScrapingHealth;
  workflows: WorkflowRun[];
  moderation: ModerationStats;
  alerts: AlertStats;
  lettreHebdo: LettreHebdoStatus;
  fetchedAt: string;
}

// ─── Source name → label mapping ─────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  fuel: '⛽ Carburants',
  food: '🥦 Alimentaire',
  fresh: '🌿 Produits frais',
  catalogue: '🛒 Catalogues',
  hexagone: '🇫🇷 Hexagone',
  bqp: '📋 BQP officiel',
  services: '📡 Services',
  loyer: '🏠 Loyers / DVF',
  medicaments: '💊 Médicaments',
  octroisMer: '🏛️ Octroi de mer',
  com: '🌏 COM (NC/PF/WF…)',
  grossistes: '🏭 Grossistes',
};

// ─── Scraping health ──────────────────────────────────────────────────────────

export async function getScrapingHealth(): Promise<ScrapingHealth> {
  try {
    const base = import.meta.env.BASE_URL ?? '/';
    const url = `${base.replace(/\/$/, '')}/data/scraping-health.json?_=${Date.now()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    const sources: ScrapingSourceStatus[] = Object.entries(raw.sources ?? {}).map(
      ([key, val]: [string, any]) => ({
        name: key,
        label: SOURCE_LABELS[key] ?? key,
        count: val.count ?? 0,
        ok: val.ok ?? false,
      })
    );

    // Determine staleness
    let staleness: ScrapingHealth['staleness'] = 'unknown';
    if (raw.lastScrapedAt) {
      const diffH = (Date.now() - new Date(raw.lastScrapedAt).getTime()) / 3_600_000;
      staleness = diffH < 2 ? 'fresh' : diffH < 26 ? 'recent' : 'stale';
    }

    return {
      lastScrapedAt: raw.lastScrapedAt ?? null,
      date: raw.date ?? null,
      dryRun: raw.dryRun ?? false,
      deepScan: raw.deepScan ?? false,
      sources,
      totalEntries: raw.totalEntries ?? 0,
      shocksDetected: raw.shocksDetected ?? 0,
      status: staleness === 'stale' ? 'stale' : (raw.status ?? 'unknown'),
      staleness,
    };
  } catch {
    return {
      lastScrapedAt: null,
      date: null,
      dryRun: false,
      deepScan: false,
      sources: [],
      totalEntries: 0,
      shocksDetected: 0,
      status: 'unknown',
      staleness: 'unknown',
    };
  }
}

// ─── GitHub Actions workflow runs ────────────────────────────────────────────

const WATCHED_WORKFLOWS = [
  { file: 'auto-scraping.yml', label: '🤖 Scraping automatique' },
  { file: 'lettre-hebdo-ia.yml', label: '📰 Lettre hebdo IA' },
  { file: 'alert-engine.yml', label: '🔔 Moteur d\'alertes' },
  { file: 'auto-update-prices.yml', label: '💰 Mise à jour prix' },
  { file: 'data-refresh.yml', label: '♻️ Rafraîchissement données' },
];

export async function getWorkflowRuns(
  owner = 'teetee971',
  repo = 'akiprisaye-web'
): Promise<WorkflowRun[]> {
  const results: WorkflowRun[] = [];

  await Promise.allSettled(
    WATCHED_WORKFLOWS.map(async ({ file, label }) => {
      try {
        const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${file}/runs?per_page=1`;
        const res = await fetch(url, {
          headers: { Accept: 'application/vnd.github+json' },
        });
        if (!res.ok) return;
        const data = await res.json();
        const run = data.workflow_runs?.[0];
        if (!run) return;
        results.push({
          id: run.id,
          name: label,
          status: run.status,
          conclusion: run.conclusion,
          createdAt: run.created_at,
          updatedAt: run.updated_at,
          htmlUrl: run.html_url,
          event: run.event,
        });
      } catch {
        // Network error — skip this workflow silently
      }
    })
  );

  // Sort by most recently updated
  results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return results;
}

// ─── Moderation stats (Firestore) ────────────────────────────────────────────

export async function getModerationStats(): Promise<ModerationStats> {
  try {
    const db = getFirestore();

    const [pendingSnap, approvedSnap, rejectedSnap] = await Promise.all([
      getDocs(query(collection(db, 'contributions'), where('status', '==', 'pending'), limit(200))),
      getDocs(query(collection(db, 'contributions'), where('status', '==', 'approved'), orderBy('updatedAt', 'desc'), limit(100))),
      getDocs(query(collection(db, 'contributions'), where('status', '==', 'rejected'), orderBy('updatedAt', 'desc'), limit(100))),
    ]);

    return {
      pending: pendingSnap.size,
      approved: approvedSnap.size,
      rejected: rejectedSnap.size,
      total: pendingSnap.size + approvedSnap.size + rejectedSnap.size,
      lastCheckedAt: new Date().toISOString(),
    };
  } catch {
    return {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0,
      lastCheckedAt: new Date().toISOString(),
    };
  }
}

// ─── Alert stats (Firestore) ──────────────────────────────────────────────────

export async function getAlertStats(): Promise<AlertStats> {
  try {
    const db = getFirestore();
    const yesterday = new Date(Date.now() - 86_400_000);

    const [activeSnap, triggeredSnap] = await Promise.all([
      getDocs(query(
        collection(db, 'price_alert_events'),
        where('processed', '==', false),
        limit(200)
      )),
      getDocs(query(
        collection(db, 'price_alert_events'),
        where('observedAt', '>=', yesterday.toISOString()),
        orderBy('observedAt', 'desc'),
        limit(100)
      )),
    ]);

    const lastTriggered = triggeredSnap.docs[0]?.data()?.observedAt ?? null;

    return {
      activeAlerts: activeSnap.size,
      triggeredLast24h: triggeredSnap.size,
      lastTriggeredAt: lastTriggered,
      lastCheckedAt: new Date().toISOString(),
    };
  } catch {
    return {
      activeAlerts: 0,
      triggeredLast24h: 0,
      lastTriggeredAt: null,
      lastCheckedAt: new Date().toISOString(),
    };
  }
}

// ─── Lettre hebdo IA status (Firestore) ───────────────────────────────────────

export async function getLettreHebdoStatus(): Promise<LettreHebdoStatus> {
  try {
    const db = getFirestore();
    const snap = await getDocs(
      query(collection(db, 'lettre_hebdo_ia'), orderBy('weekId', 'desc'), limit(1))
    );

    if (snap.empty) {
      return { lastGeneratedAt: null, lastWeekId: null, status: 'missing' };
    }

    const doc = snap.docs[0].data();
    return {
      lastGeneratedAt: doc.generatedAt ?? doc.createdAt ?? null,
      lastWeekId: doc.weekId ?? snap.docs[0].id,
      status: 'ok',
    };
  } catch {
    return { lastGeneratedAt: null, lastWeekId: null, status: 'unknown' };
  }
}

// ─── Aggregate ────────────────────────────────────────────────────────────────

export async function getAutomationStatus(): Promise<AutomationStatus> {
  const [scraping, workflows, moderation, alerts, lettreHebdo] = await Promise.all([
    getScrapingHealth(),
    getWorkflowRuns(),
    getModerationStats(),
    getAlertStats(),
    getLettreHebdoStatus(),
  ]);

  return {
    scraping,
    workflows,
    moderation,
    alerts,
    lettreHebdo,
    fetchedAt: new Date().toISOString(),
  };
}
