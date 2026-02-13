export type TelemetryKind =
  | 'search_start'
  | 'search_result'
  | 'cache_hit'
  | 'cache_miss'
  | 'cache_stale_used'
  | 'provider_run'
  | 'error';

export type TelemetryMode = 'ean' | 'query' | 'mixed';

export type TelemetryStatus = 'OK' | 'PARTIAL' | 'NO_DATA' | 'UNAVAILABLE' | null;

export type TelemetryMetaValue = string | number;

export type TelemetryMeta = Record<string, TelemetryMetaValue>;

export interface TelemetryEvent {
  ts: string;
  kind: TelemetryKind;
  territory: string;
  mode: TelemetryMode;
  queryLen: number;
  eanLen: number;
  durationMs: number | null;
  status: TelemetryStatus;
  sourcesUsed: string[];
  warningsCount: number;
  meta?: TelemetryMeta;
}

export interface TelemetryStats {
  total: number;
  recentCount: number;
  cacheHitRate: number;
  medianDurationMs: number | null;
  statusBreakdown: Record<'OK' | 'PARTIAL' | 'NO_DATA' | 'UNAVAILABLE', number>;
}
