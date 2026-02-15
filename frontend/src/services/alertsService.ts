import { alertsDataset } from '../data/alerts';
import type { AlertSeverity, SanitaryAlert, SanitaryAlertsResponse, TerritoryCode } from '../types/alerts';

const severityOrder: Record<AlertSeverity, number> = {
  critical: 3,
  important: 2,
  info: 1,
};

let latestSnapshot: SanitaryAlert[] = [];

function parseDate(value?: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean);
}

export function matchesSearch(alert: SanitaryAlert, q?: string): boolean {
  if (!q) return true;
  const tokens = tokenize(q);
  if (tokens.length === 0) return true;

  const haystack = normalizeText([
    alert.title,
    alert.brand,
    alert.productName,
    alert.ean,
    alert.lot,
  ]
    .filter(Boolean)
    .join(' '));

  return tokens.every((token) => haystack.includes(token));
}

export function sortAlerts(items: SanitaryAlert[]): SanitaryAlert[] {
  return [...items].sort((a, b) => {
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;

    const dateA = parseDate(a.publishedAt);
    const dateB = parseDate(b.publishedAt);
    return dateB - dateA;
  });
}

interface GetAlertsOptions {
  territory?: TerritoryCode;
  onlyActive?: boolean;
  q?: string;
  category?: string;
  severity?: AlertSeverity;
}

export interface FetchAlertsResult {
  alerts: SanitaryAlert[];
  metadata: SanitaryAlertsResponse['metadata'];
}

function localFallback(options: GetAlertsOptions = {}): FetchAlertsResult {
  const { territory, onlyActive = false, q, category, severity } = options;
  const normalizedCategory = category ? normalizeText(category) : '';

  const filtered = alertsDataset
    .filter((alert) => !territory || alert.territory === territory)
    .filter((alert) => !onlyActive || alert.status === 'active')
    .filter((alert) => !severity || alert.severity === severity)
    .filter((alert) => !normalizedCategory || normalizeText(alert.category ?? '') === normalizedCategory)
    .filter((alert) => matchesSearch(alert, q));

  const sorted = sortAlerts(filtered);
  latestSnapshot = sorted;

  return {
    alerts: sorted,
    metadata: {
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
      total: sorted.length,
    },
  };
}

export async function getAlerts(options: GetAlertsOptions = {}): Promise<FetchAlertsResult> {
  const params = new URLSearchParams();
  if (options.territory) params.set('territory', options.territory);
  if (options.q) params.set('q', options.q);
  if (options.category) params.set('category', options.category);
  if (options.severity) params.set('severity', options.severity);
  if (options.onlyActive) params.set('activeOnly', 'true');

  try {
    const response = await fetch(`/api/sanitary-alerts?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) throw new Error(`HTTP_${response.status}`);

    const payload = await response.json() as SanitaryAlertsResponse;
    latestSnapshot = sortAlerts(payload.alerts ?? []);
    return {
      alerts: latestSnapshot,
      metadata: payload.metadata,
    };
  } catch {
    return localFallback(options);
  }
}

export async function getAlertById(id: string): Promise<SanitaryAlert | null> {
  const inSnapshot = latestSnapshot.find((alert) => alert.id === id);
  if (inSnapshot) return inSnapshot;

  try {
    const response = await fetch(`/api/sanitary-alerts?id=${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error('id_lookup_failed');
    const payload = await response.json() as SanitaryAlertsResponse;
    const resolved = payload.alerts.find((alert) => alert.id === id) ?? null;
    if (resolved) latestSnapshot = [resolved, ...latestSnapshot.filter((alert) => alert.id !== id)];
    return resolved;
  } catch {
    return alertsDataset.find((alert) => alert.id === id) ?? null;
  }
}
