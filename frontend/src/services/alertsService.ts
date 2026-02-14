import { alertsDataset } from '../data/alerts';
import type { Alert, AlertSeverity, TerritoryCode } from '../types/market';

const severityRank: Record<AlertSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

export function isAlertActive(alert: Alert, now = new Date()): boolean {
  const start = new Date(alert.startsAt).getTime();
  const end = alert.endsAt ? new Date(alert.endsAt).getTime() : Number.POSITIVE_INFINITY;
  const ts = now.getTime();
  return ts >= start && ts <= end;
}

export function filterActiveAlerts(options: { territory?: TerritoryCode; severity?: AlertSeverity; now?: Date } = {}) {
  const { territory, severity, now = new Date() } = options;
  return alertsDataset
    .filter((alert) => isAlertActive(alert, now))
    .filter((alert) => !territory || !alert.territory || alert.territory === territory)
    .filter((alert) => !severity || alert.severity === severity)
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
}

export function getTopActiveAlert(territory?: TerritoryCode) {
  return filterActiveAlerts({ territory })[0] ?? null;
}
