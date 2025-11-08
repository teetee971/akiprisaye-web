/**
 * Tests for logger utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Logger', () => {
  let originalEnv;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.resetModules();
  });

  it('should export logger object with all methods', async () => {
    const { logger } = await import('./logger.js');
    expect(logger).toBeDefined();
    expect(logger.debug).toBeTypeOf('function');
    expect(logger.info).toBeTypeOf('function');
    expect(logger.warn).toBeTypeOf('function');
    expect(logger.error).toBeTypeOf('function');
  });

  it('should log errors in production mode', async () => {
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    const { logger } = await import('./logger.js');
    
    logger.error('Test error');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should log debug messages in development mode', async () => {
    process.env.NODE_ENV = 'development';
    vi.resetModules();
    const { logger } = await import('./logger.js');
    
    logger.debug('Test debug');
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});
