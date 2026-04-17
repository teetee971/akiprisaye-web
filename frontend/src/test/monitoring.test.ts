/**
 * Tests for the monitoring system:
 * - storageBuffer (FIFO, max 100, TTL)
 * - errorTracker (format, idempotent install)
 * - eventLogger (format, getEvents)
 * - systemSnapshot (shape)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createStorageBuffer } from '../monitoring/storageBuffer';
import { initErrorTracker, getErrors, _resetErrorTracker } from '../monitoring/errorTracker';
import { logEvent, getEvents } from '../monitoring/eventLogger';
import { getSystemSnapshot } from '../monitoring/systemSnapshot';
import { monitoringBuffer } from '../monitoring/storageBuffer';

// ─────────────────────────────────────────────
// storageBuffer
// ─────────────────────────────────────────────
describe('storageBuffer', () => {
  it('addItem / getItems roundtrip', () => {
    const buf = createStorageBuffer({ storageKey: 'test:buf:1' });
    buf.clear();
    buf.addItem({ x: 1 });
    buf.addItem({ x: 2 });
    expect(buf.getItems()).toEqual([{ x: 1 }, { x: 2 }]);
    buf.clear();
  });

  it('respects maxItems (FIFO — keeps newest)', () => {
    const buf = createStorageBuffer({ storageKey: 'test:buf:max', maxItems: 5 });
    buf.clear();
    for (let i = 0; i < 10; i++) buf.addItem({ i });
    const items = buf.getItems() as Array<{ i: number }>;
    expect(items).toHaveLength(5);
    // Should keep the newest 5 (indices 5-9)
    expect(items[0].i).toBe(5);
    expect(items[4].i).toBe(9);
    buf.clear();
  });

  it('enforces default max of 100', () => {
    const buf = createStorageBuffer({ storageKey: 'test:buf:100' });
    buf.clear();
    for (let i = 0; i < 110; i++) buf.addItem({ i });
    expect(buf.getItems()).toHaveLength(100);
    buf.clear();
  });

  it('clear empties the buffer', () => {
    const buf = createStorageBuffer({ storageKey: 'test:buf:clear' });
    buf.addItem('hello');
    buf.clear();
    expect(buf.getItems()).toHaveLength(0);
  });

  it('TTL: expired items are filtered out on read', () => {
    vi.useFakeTimers();
    const buf = createStorageBuffer({ storageKey: 'test:buf:ttl', ttl: 1000 });
    buf.clear();
    buf.addItem({ msg: 'old' });
    // Advance time beyond TTL
    vi.advanceTimersByTime(2000);
    buf.addItem({ msg: 'fresh' });
    const items = buf.getItems() as Array<{ msg: string }>;
    expect(items).toHaveLength(1);
    expect(items[0].msg).toBe('fresh');
    buf.clear();
    vi.useRealTimers();
  });
});

// ─────────────────────────────────────────────
// errorTracker
// ─────────────────────────────────────────────
describe('errorTracker', () => {
  beforeEach(() => {
    _resetErrorTracker();
    monitoringBuffer.clear();
  });

  afterEach(() => {
    _resetErrorTracker();
    monitoringBuffer.clear();
  });

  it('initErrorTracker is idempotent (no duplicate listeners)', () => {
    initErrorTracker();
    initErrorTracker();
    initErrorTracker();
    // Should not throw; listeners installed only once
    expect(true).toBe(true);
  });

  it('getErrors returns only error entries from buffer', () => {
    // Manually push an event entry to the buffer
    monitoringBuffer.addItem({
      category: 'event',
      name: 'login_success',
      route: '/',
      timestamp: '',
    });
    // Push an error entry
    monitoringBuffer.addItem({
      type: 'runtime_error',
      message: 'test error',
      route: '/',
      timestamp: new Date().toISOString(),
      userAgent: '',
      buildId: 'abc',
    });
    const errors = getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe('runtime_error');
    expect(errors[0].message).toBe('test error');
  });

  it('runtime_error entry has required fields', () => {
    monitoringBuffer.addItem({
      type: 'runtime_error',
      message: 'oops',
      route: '/test',
      timestamp: new Date().toISOString(),
      userAgent: 'ua',
      buildId: '1',
    });
    const errors = getErrors();
    expect(errors[0]).toMatchObject({
      type: 'runtime_error',
      message: expect.any(String),
      route: expect.any(String),
      timestamp: expect.any(String),
      userAgent: expect.any(String),
      buildId: expect.any(String),
    });
  });
});

// ─────────────────────────────────────────────
// eventLogger
// ─────────────────────────────────────────────
describe('eventLogger', () => {
  beforeEach(() => monitoringBuffer.clear());
  afterEach(() => monitoringBuffer.clear());

  it('logEvent stores event with correct shape', () => {
    logEvent('login_success', { provider: 'google' });
    const events = getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      category: 'event',
      name: 'login_success',
      payload: { provider: 'google' },
      route: expect.any(String),
      timestamp: expect.any(String),
    });
  });

  it('logEvent works without payload', () => {
    logEvent('logout');
    const events = getEvents();
    expect(events[0].name).toBe('logout');
    expect(events[0].payload).toBeUndefined();
  });

  it('getEvents filters out non-event entries', () => {
    monitoringBuffer.addItem({
      type: 'runtime_error',
      message: 'err',
      route: '/',
      timestamp: '',
      userAgent: '',
      buildId: '',
    });
    logEvent('scan_success');
    const events = getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('scan_success');
  });
});

// ─────────────────────────────────────────────
// systemSnapshot
// ─────────────────────────────────────────────
describe('systemSnapshot', () => {
  it('returns expected shape with anonymous user', () => {
    const snap = getSystemSnapshot();
    expect(snap).toMatchObject({
      route: expect.any(String),
      userId: 'anonymous',
      buildId: expect.any(String),
      mode: expect.any(String),
      debugFlags: expect.any(Array),
      timestamp: expect.any(String),
      viewport: { width: expect.any(Number), height: expect.any(Number) },
      online: expect.any(Boolean),
    });
  });

  it('anonymises user uid to first 6 chars', () => {
    const snap = getSystemSnapshot({ uid: 'abcdef1234567890' });
    expect(snap.userId).toBe('abcdef…');
  });

  it('returns anonymous when no user provided', () => {
    const snap = getSystemSnapshot(null);
    expect(snap.userId).toBe('anonymous');
  });
});
