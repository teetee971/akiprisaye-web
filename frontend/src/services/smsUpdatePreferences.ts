import { safeLocalStorage } from '../utils/safeLocalStorage';

export const SMS_UPDATES_STORAGE_KEY = 'akiprisaye:sms_updates:v1';

export interface SmsUpdatePreferences {
  enabled: boolean;
  phoneNumber: string;
}

const DEFAULT_SMS_UPDATE_PREFERENCES: SmsUpdatePreferences = {
  enabled: false,
  phoneNumber: '',
};

export function normalizeSmsPhoneNumber(phoneNumber: string): string {
  const compact = String(phoneNumber ?? '').trim().replace(/[^\d+]/g, '');
  return compact.startsWith('00') ? `+${compact.slice(2)}` : compact;
}

export function isValidSmsPhoneNumber(phoneNumber: string): boolean {
  const normalized = normalizeSmsPhoneNumber(phoneNumber);
  return /^(?:\+\d{8,15}|0\d{9})$/.test(normalized);
}

export function loadSmsUpdatePreferences(): SmsUpdatePreferences {
  const raw = safeLocalStorage.getJSON<Partial<SmsUpdatePreferences>>(SMS_UPDATES_STORAGE_KEY, {});
  return {
    enabled: raw.enabled === true,
    phoneNumber: typeof raw.phoneNumber === 'string' ? raw.phoneNumber : '',
  };
}

export function saveSmsUpdatePreferences(preferences: SmsUpdatePreferences): boolean {
  const payload: SmsUpdatePreferences = {
    enabled: preferences.enabled === true,
    phoneNumber: normalizeSmsPhoneNumber(preferences.phoneNumber),
  };
  return safeLocalStorage.setJSON(SMS_UPDATES_STORAGE_KEY, payload);
}

export function resetSmsUpdatePreferences(): boolean {
  return safeLocalStorage.setJSON(SMS_UPDATES_STORAGE_KEY, DEFAULT_SMS_UPDATE_PREFERENCES);
}
