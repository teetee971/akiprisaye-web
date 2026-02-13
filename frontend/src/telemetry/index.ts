export { isTelemetryEnabled, track, getEvents, clear, exportJson, stats } from './client';
export { fnv1a32 } from './hash';
export type {
  TelemetryEvent,
  TelemetryKind,
  TelemetryMeta,
  TelemetryMode,
  TelemetryStatus,
} from './client';
