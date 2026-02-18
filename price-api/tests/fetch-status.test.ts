import { describe, expect, it } from 'vitest';
import { computeFetchJobStatus } from '../src/fetch/status';

describe('computeFetchJobStatus', () => {
  it('returns success when there are successful items and no errors', () => {
    expect(computeFetchJobStatus({ ok: 2, error: 0 })).toBe('success');
  });

  it('returns partial when there are successes and errors', () => {
    expect(computeFetchJobStatus({ ok: 1, error: 1 })).toBe('partial');
  });

  it('returns failed when all items failed', () => {
    expect(computeFetchJobStatus({ ok: 0, error: 2 })).toBe('failed');
  });

  it('returns success when all items are no_data', () => {
    expect(computeFetchJobStatus({ ok: 0, error: 0 })).toBe('success');
  });
});
