/**
 * Shared validation utilities for API route handlers.
 */

/**
 * Safe email format regex.
 * Designed to avoid polynomial backtracking (ReDoS) while covering common formats.
 */
export const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

/**
 * Returns true if the given string is a valid email address.
 */
export function isValidEmail(value: unknown): boolean {
  return typeof value === 'string' && EMAIL_RE.test(value);
}
