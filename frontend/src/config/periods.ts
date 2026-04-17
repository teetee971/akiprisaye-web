/**
 * periods.ts — Centralized time periods and durations
 *
 * Purpose: Single source of truth for all time-related constants
 * Used by: Data freshness checks, time filters, caching, shopping lists
 *
 * @module periods
 */

/**
 * Time periods in hours
 */
export const TIME_PERIODS = {
  /** 1 day = 24 hours */
  ONE_DAY: 24,

  /** 1 week = 7 days = 168 hours */
  ONE_WEEK: 168,

  /** 2 weeks = 14 days = 336 hours */
  TWO_WEEKS: 336,

  /** 1 month (30 days) = 720 hours */
  ONE_MONTH: 720,

  /** 3 months (90 days) = 2160 hours */
  THREE_MONTHS: 2160,
} as const;

/**
 * Time periods in days
 */
export const DAY_PERIODS = {
  /** 7 days */
  ONE_WEEK: 7,

  /** 14 days */
  TWO_WEEKS: 14,

  /** 30 days */
  ONE_MONTH: 30,

  /** 90 days */
  THREE_MONTHS: 90,
} as const;

/**
 * Shopping time slots (delivery/pickup windows)
 */
export const TIME_SLOTS = ['16h-18h', '17h-19h', '17h30-19h30', '18h-20h'] as const;

/**
 * Default time slot option (empty = all slots)
 */
export const ALL_TIME_SLOTS = '';

/**
 * Data freshness configurations
 */
export const DATA_FRESHNESS = {
  /** Price data is considered fresh for 30 days (720 hours) */
  PRICE_DATA_MAX_AGE_HOURS: TIME_PERIODS.ONE_MONTH,

  /** Store data is considered fresh for 90 days (2160 hours) */
  STORE_DATA_MAX_AGE_HOURS: TIME_PERIODS.THREE_MONTHS,

  /** Promotion data is considered fresh for 7 days (168 hours) */
  PROMO_DATA_MAX_AGE_HOURS: TIME_PERIODS.ONE_WEEK,
} as const;

/**
 * Get time period in hours by name
 */
export function getTimePeriodHours(period: keyof typeof TIME_PERIODS): number {
  return TIME_PERIODS[period];
}

/**
 * Get time period in days by name
 */
export function getTimePeriodDays(period: keyof typeof DAY_PERIODS): number {
  return DAY_PERIODS[period];
}

/**
 * Get all available time slots
 */
export function getAllTimeSlots(): readonly string[] {
  return TIME_SLOTS;
}

/**
 * Check if a time slot is valid
 */
export function isValidTimeSlot(slot: string): boolean {
  if (slot === ALL_TIME_SLOTS) return true;
  return (TIME_SLOTS as readonly string[]).includes(slot);
}
