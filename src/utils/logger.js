/**
 * Configurable Logger Module
 * Replaces console.log with environment-aware logging
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Determine log level from environment or default to ERROR in production
const getLogLevel = () => {
  if (typeof process !== 'undefined' && process.env) {
    const envLevel = process.env.LOG_LEVEL || process.env.VITE_LOG_LEVEL;
    if (envLevel && LOG_LEVELS[envLevel.toUpperCase()] !== undefined) {
      return LOG_LEVELS[envLevel.toUpperCase()];
    }
  }
  
  // Check if running in development mode
  const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';
  return isDev ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
};

const currentLogLevel = getLogLevel();

/**
 * Logger object with level-based methods
 */
export const logger = {
  /**
   * Debug level logging - verbose information for debugging
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info level logging - general informational messages
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warning level logging - warning messages
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Error level logging - error messages (always shown except in NONE mode)
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      console.error('[ERROR]', ...args);
    }
  }
};

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { logger };
}
