export const isProduction = import.meta.env.PROD;

/** Sensitive field names that must never appear in logs */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'email',
  'phone',
  'tel',
  'ssn',
  'credit_card',
  'cardNumber',
]);

/** Recursively mask sensitive fields in an object clone */
function maskSensitive(value: unknown, depth = 0): unknown {
  if (depth > 5 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => maskSensitive(v, depth + 1));
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    result[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : maskSensitive(v, depth + 1);
  }
  return result;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: unknown;
}

function emit(level: LogLevel, message: string, context?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context !== undefined && { context: maskSensitive(context) }),
  };

  if (isProduction) {
    // In production: only warn/error, as JSON for log aggregation
    if (level === 'warn' || level === 'error') {
      const method = level === 'error' ? console.error : console.warn;
      method(JSON.stringify(entry));
    }
  } else {
    const method =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : level === 'info'
            ? console.info
            : console.log;
    method(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`, context ?? '');
  }
}

/** Debug-level log – suppressed in production */
export function logDebug(message: string, context?: unknown): void {
  emit('debug', message, context);
}

/** Info-level log */
export function logInfo(message: string, context?: unknown): void {
  emit('info', message, context);
}

/** Warning-level log – emitted in production */
export function logWarn(message: string, context?: unknown): void {
  emit('warn', message, context);
}

/** Error-level log – always emitted */
export function logError(message: string, context?: unknown): void {
  emit('error', message, context);
}
