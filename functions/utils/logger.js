/**
 * Centralized logging service for Cloudflare Functions
 * Replaces console.log/warn/error with structured logging
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// In production, set to INFO or WARN to reduce noise
const CURRENT_LOG_LEVEL = LOG_LEVELS.INFO;

/**
 * Format log message with timestamp and context
 */
function formatLogMessage(level, message, context = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });
}

/**
 * Log debug messages (development only)
 */
export function logDebug(message, context = {}) {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
    console.log(formatLogMessage('DEBUG', message, context));
  }
}

/**
 * Log informational messages
 */
export function logInfo(message, context = {}) {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
    console.log(formatLogMessage('INFO', message, context));
  }
}

/**
 * Log warning messages
 */
export function logWarn(message, context = {}) {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
    console.warn(formatLogMessage('WARN', message, context));
  }
}

/**
 * Log error messages
 */
export function logError(message, error = null, context = {}) {
  const errorContext = error ? {
    error: error.message,
    stack: error.stack,
    ...context,
  } : context;
  
  console.error(formatLogMessage('ERROR', message, errorContext));
}

/**
 * Log security events (always logged)
 */
export function logSecurity(message, context = {}) {
  console.log(formatLogMessage('SECURITY', message, {
    ...context,
    severity: 'high',
  }));
}
