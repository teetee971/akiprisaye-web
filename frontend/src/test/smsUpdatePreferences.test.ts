import { beforeEach, describe, expect, it } from 'vitest';
import {
  isValidSmsPhoneNumber,
  loadSmsUpdatePreferences,
  normalizeSmsPhoneNumber,
  resetSmsUpdatePreferences,
  saveSmsUpdatePreferences,
} from '../services/smsUpdatePreferences';

describe('smsUpdatePreferences service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes and validates phone numbers', () => {
    expect(normalizeSmsPhoneNumber(' 00 590 690 12 34 56 ')).toBe('+590690123456');
    expect(isValidSmsPhoneNumber('+590690123456')).toBe(true);
    expect(isValidSmsPhoneNumber('0690123456')).toBe(true);
    expect(isValidSmsPhoneNumber('123')).toBe(false);
  });

  it('persists and loads SMS preferences', () => {
    const ok = saveSmsUpdatePreferences({ enabled: true, phoneNumber: '00 590 690 12 34 56' });
    expect(ok).toBe(true);
    expect(loadSmsUpdatePreferences()).toEqual({
      enabled: true,
      phoneNumber: '+590690123456',
    });
  });

  it('resets SMS preferences to defaults', () => {
    saveSmsUpdatePreferences({ enabled: true, phoneNumber: '+590690123456' });
    resetSmsUpdatePreferences();
    expect(loadSmsUpdatePreferences()).toEqual({
      enabled: false,
      phoneNumber: '',
    });
  });
});
