import { describe, it, expect } from 'vitest';
import {
  isStoreOpen,
  getStatusColor,
  getStatusIcon,
  formatDayHours,
  getTodayHours,
  createSampleStoreHours,
  type StoreHours,
  type DayHours,
} from '../utils/storeHoursUtils';

/**
 * Helper: build a StoreHours object with a fixed local time
 * We override the timezone so getStoreLocalTime returns a predictable value.
 */
function makeHours(dayKey: string, periods: DayHours[], timezone = 'UTC'): StoreHours {
  return {
    storeId: 'test-store',
    timezone,
    regularHours: { [dayKey]: periods },
  };
}

// Use a fixed UTC Date: Wednesday 2026-01-07 at 10:00
const WED_10H = new Date(2026, 0, 7, 10, 0, 0); // Wednesday
// Same day at 20:30 (closed)
const WED_20H30 = new Date(2026, 0, 7, 20, 30, 0);
// Same day at 19:45 (closing soon)
const WED_19H45 = new Date(2026, 0, 7, 19, 45, 0);

describe('isStoreOpen', () => {
  it('returns unknown when no hours provided', () => {
    const result = isStoreOpen(null as any);
    expect(result.status).toBe('unknown');
  });

  it('returns open when current time is within open period', () => {
    // Wednesday hours: 08:00-20:00
    const hours = makeHours('mercredi', [{ open: '08:00', close: '20:00' }]);
    const result = isStoreOpen(hours, WED_10H);
    expect(result.status).toBe('open');
    expect(result.nextChangeMessage).toContain('20:00');
  });

  it('returns closing_soon when less than 60 min before close', () => {
    const hours = makeHours('mercredi', [{ open: '08:00', close: '20:00' }]);
    const result = isStoreOpen(hours, WED_19H45);
    expect(result.status).toBe('closing_soon');
  });

  it('returns closed when current time is after close', () => {
    const hours = makeHours('mercredi', [{ open: '08:00', close: '20:00' }]);
    const result = isStoreOpen(hours, WED_20H30);
    expect(result.status).toBe('closed');
  });

  it('returns closed with next open time when not yet opened', () => {
    const hours = makeHours('mercredi', [{ open: '14:00', close: '20:00' }]);
    const result = isStoreOpen(hours, WED_10H);
    expect(result.status).toBe('closed');
    expect(result.message).toContain('14:00');
  });

  it('returns closed all day for marked-closed day', () => {
    const hours = makeHours('mercredi', [{ closed: true }]);
    const result = isStoreOpen(hours, WED_10H);
    expect(result.status).toBe('closed');
  });

  it('returns closed when no hours defined for the day', () => {
    const hours = makeHours('lundi', [{ open: '08:00', close: '20:00' }]);
    const result = isStoreOpen(hours, WED_10H); // Wednesday has no hours
    expect(result.status).toBe('closed');
  });

  it('respects special hours override (store closed on holiday)', () => {
    const hours: StoreHours = {
      storeId: 'test-store',
      timezone: 'UTC',
      regularHours: { mercredi: [{ open: '08:00', close: '20:00' }] },
      specialHours: [{ date: '2026-01-07', closed: true, reason: 'Jour férié' }],
    };
    const result = isStoreOpen(hours, WED_10H);
    expect(result.status).toBe('closed');
    expect(result.message).toContain('Jour férié');
  });

  it('respects special hours override (reduced hours)', () => {
    const hours: StoreHours = {
      storeId: 'test-store',
      timezone: 'UTC',
      regularHours: { mercredi: [{ open: '08:00', close: '20:00' }] },
      specialHours: [{ date: '2026-01-07', open: '10:00', close: '14:00' }],
    };
    // At 10:00 the special hours say 10:00-14:00, so store is open
    const result = isStoreOpen(hours, WED_10H);
    expect(result.status).toBe('open');
  });
});

describe('getStatusColor', () => {
  it('returns green for open', () => expect(getStatusColor('open')).toBe('green'));
  it('returns orange for closing_soon', () =>
    expect(getStatusColor('closing_soon')).toBe('orange'));
  it('returns red for closed', () => expect(getStatusColor('closed')).toBe('red'));
  it('returns gray for unknown', () => expect(getStatusColor('unknown')).toBe('gray'));
});

describe('getStatusIcon', () => {
  it('returns correct emoji for each status', () => {
    expect(getStatusIcon('open')).toBe('🟢');
    expect(getStatusIcon('closing_soon')).toBe('🟠');
    expect(getStatusIcon('closed')).toBe('🔴');
    expect(getStatusIcon('unknown')).toBe('⚪');
  });
});

describe('formatDayHours', () => {
  it('returns Fermé for empty array', () => {
    expect(formatDayHours([])).toBe('Fermé');
  });

  it('returns Fermé for closed period', () => {
    expect(formatDayHours([{ closed: true }])).toBe('Fermé');
  });

  it('formats single period', () => {
    expect(formatDayHours([{ open: '08:00', close: '20:00' }])).toBe('08:00 - 20:00');
  });

  it('formats multiple periods joined by comma', () => {
    expect(
      formatDayHours([
        { open: '08:00', close: '12:30' },
        { open: '14:30', close: '20:00' },
      ])
    ).toBe('08:00 - 12:30, 14:30 - 20:00');
  });
});

describe('getTodayHours', () => {
  it('returns today hours for the correct day', () => {
    const hours = makeHours('mercredi', [{ open: '08:00', close: '20:00' }]);
    const result = getTodayHours(hours, WED_10H);
    expect(result).toEqual([{ open: '08:00', close: '20:00' }]);
  });

  it('returns null when no hours object', () => {
    expect(getTodayHours(null as any)).toBeNull();
  });
});

describe('createSampleStoreHours', () => {
  it('creates sample hours with all weekdays', () => {
    const hours = createSampleStoreHours('test-store', 'America/Guadeloupe');
    expect(hours.storeId).toBe('test-store');
    expect(hours.timezone).toBe('America/Guadeloupe');
    expect(hours.regularHours).toHaveProperty('lundi');
    expect(hours.regularHours).toHaveProperty('dimanche');
  });

  it('creates sample hours with special hours for holidays', () => {
    const hours = createSampleStoreHours('test-store', 'America/Guadeloupe');
    expect(hours.specialHours).toBeDefined();
    expect(hours.specialHours!.length).toBeGreaterThan(0);
    const christmas = hours.specialHours!.find((s) => s.reason === 'Noël');
    expect(christmas).toBeDefined();
    expect(christmas?.closed).toBe(true);
  });
});
