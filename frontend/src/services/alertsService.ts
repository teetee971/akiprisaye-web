import { alertsDataset } from '../data/alerts';
import type { AlertSeverity, SanitaryAlert, TerritoryCode } from '../types/alerts';

const severityOrder: Record<AlertSeverity, number> = {
  critical: 3,
  important: 2,
  info: 1,
};

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

export function getAlerts(options: GetAlertsOptions = {}): SanitaryAlert[] {
  const { territory, onlyActive = false, q, category, severity } = options;
  const normalizedCategory = category ? normalizeText(category) : '';

  const filtered = alertsDataset
    .filter((alert) => !territory || alert.territory === territory)
    .filter((alert) => !onlyActive || alert.status === 'active')
    .filter((alert) => !severity || alert.severity === severity)
    .filter((alert) => !normalizedCategory || normalizeText(alert.category ?? '') === normalizedCategory)
    .filter((alert) => matchesSearch(alert, q));

  return sortAlerts(filtered);
}

export function getAlertById(id: string): SanitaryAlert | null {
  return alertsDataset.find((alert) => alert.id === id) ?? null;
}
