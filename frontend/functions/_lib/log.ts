type LogMeta = {
  requestId: string;
  endpoint: string;
  status: number;
  durationMs: number;
  error?: string;
};

const isProd = () => (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV === 'production';

const formatLine = (level: 'INFO' | 'WARN' | 'ERROR', meta: LogMeta) =>
  `${level} requestId=${meta.requestId} endpoint=${meta.endpoint} status=${meta.status} durationMs=${meta.durationMs}${meta.error ? ` error=${meta.error}` : ''}`;

const log = (level: 'INFO' | 'WARN' | 'ERROR', message: string, meta: LogMeta) => {
  if (isProd()) {
    console.log(formatLine(level, meta));
    return;
  }

  const logger = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.info;
  logger(`[${level}] ${message}`, {
    requestId: meta.requestId,
    endpoint: meta.endpoint,
    status: meta.status,
    durationMs: meta.durationMs,
    ...(meta.error ? { error: meta.error } : {}),
  });
};

export const logInfo = (message: string, meta: LogMeta) => log('INFO', message, meta);
export const logWarn = (message: string, meta: LogMeta) => log('WARN', message, meta);
export const logError = (message: string, meta: LogMeta) => log('ERROR', message, meta);
