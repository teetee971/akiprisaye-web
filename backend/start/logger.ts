// logger.ts - Structured logging helper
// Provides JSON-formatted logging with privacy considerations

import crypto from 'node:crypto';

/**
 * Compute SHA256 hash of a query string for privacy
 * @param query - The search query string
 * @returns Hex-encoded SHA256 hash
 */
export function hashQuery(query: string): string {
  const normalized = query.toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Log a structured JSON event
 * @param level - Log level (info, warn, error)
 * @param event - Event type (e.g., 'search')
 * @param data - Additional data to log
 */
export function logStructured(level: string, event: string, data: Record<string, any> = {}) {
  const logEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  console.log(JSON.stringify(logEntry));
}
