import { describe, expect, it } from 'vitest';
import { isNetworkEnvironmentError } from './verify-pages-api.mjs';

describe('verify-pages-api network error classifier', () => {
  it('classifies tunnel/proxy/fetch failures as environment errors', () => {
    expect(isNetworkEnvironmentError(new TypeError('fetch failed'))).toBe(true);
    expect(isNetworkEnvironmentError(new Error('CONNECT tunnel failed, response 403'))).toBe(true);
    expect(isNetworkEnvironmentError({ code: 'ETIMEDOUT', message: 'request timeout' })).toBe(true);
  });

  it('does not classify logical API assertion errors as environment issues', () => {
    expect(isNetworkEnvironmentError(new Error('/api/health expected 200, received 500'))).toBe(false);
    expect(isNetworkEnvironmentError(new Error('did not return JSON'))).toBe(false);
  });
});
