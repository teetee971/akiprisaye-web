import { appendTelemetryEvent, clearTelemetryEvents, readTelemetryEvents } from './store';
import type {
  TelemetryEvent,
  TelemetryKind,
  TelemetryMeta,
  TelemetryMode,
  TelemetryStats,
  TelemetryStatus,
} from './types';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function isTelemetryEnabled(): boolean {
  if (!isBrowser()) return false;
  return import.meta.env.VITE_TELEMETRY_DEBUG === '1';
}

function sanitizeMeta(meta?: TelemetryMeta): TelemetryMeta | undefined {
  if (!meta) return undefined;
  const entries = Object.entries(meta).slice(0, 5).filter(([, value]) => {
    return typeof value === 'string' || typeof value === 'number';
  });
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

type TrackInput = Partial<Omit<TelemetryEvent, 'ts' | 'kind'>> & Pick<TelemetryEvent, 'kind'>;

export function track(event: TrackInput): void {
  if (!isTelemetryEnabled()) return;

  const safeEvent: TelemetryEvent = {
    ts: new Date().toISOString(),
    kind: event.kind,
    territory: event.territory ?? 'fr',
    mode: event.mode ?? 'query',
    queryLen: Number.isFinite(event.queryLen) ? Number(event.queryLen) : 0,
    eanLen: Number.isFinite(event.eanLen) ? Number(event.eanLen) : 0,
    durationMs: event.durationMs ?? null,
    status: event.status ?? null,
    sourcesUsed: Array.isArray(event.sourcesUsed) ? event.sourcesUsed.slice(0, 10) : [],
    warningsCount: Number.isFinite(event.warningsCount) ? Number(event.warningsCount) : 0,
    meta: sanitizeMeta(event.meta),
  };

  void appendTelemetryEvent(safeEvent);
}

export async function getEvents(limit?: number): Promise<TelemetryEvent[]> {
  if (!isTelemetryEnabled()) return [];
  const events = await readTelemetryEvents();
  if (!limit || limit <= 0) return events;
  return events.slice(-limit);
}

export async function clear(): Promise<void> {
  if (!isTelemetryEnabled()) return;
  await clearTelemetryEvents();
}

export async function exportJson(): Promise<string> {
  const events = await getEvents();
  return JSON.stringify(events, null, 2);
}

export async function stats(sampleSize = 50): Promise<TelemetryStats> {
  const all = await getEvents();
  const recent = all.slice(-Math.max(1, sampleSize));

  const cacheEvents = recent.filter((event) => event.kind === 'cache_hit' || event.kind === 'cache_miss');
  const cacheHits = cacheEvents.filter((event) => event.kind === 'cache_hit').length;

  const durations = recent
    .filter((event) => typeof event.durationMs === 'number')
    .map((event) => Number(event.durationMs))
    .sort((a, b) => a - b);

  const medianDurationMs =
    durations.length === 0
      ? null
      : durations.length % 2 === 1
        ? durations[Math.floor(durations.length / 2)]
        : Math.round((durations[durations.length / 2 - 1] + durations[durations.length / 2]) / 2);

  const statusBreakdown: TelemetryStats['statusBreakdown'] = {
    OK: 0,
    PARTIAL: 0,
    NO_DATA: 0,
    UNAVAILABLE: 0,
  };

  for (const event of recent) {
    if (event.status && event.status in statusBreakdown) {
      statusBreakdown[event.status] += 1;
    }
  }

  return {
    total: all.length,
    recentCount: recent.length,
    cacheHitRate: cacheEvents.length === 0 ? 0 : Number(((cacheHits / cacheEvents.length) * 100).toFixed(1)),
    medianDurationMs,
    statusBreakdown,
  };
}

export type { TelemetryEvent, TelemetryKind, TelemetryMeta, TelemetryMode, TelemetryStatus };
