export const isNonEmptyString = (value: unknown, maxLength = 512): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;

export const toNumber = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const isEnumValue = <T extends string>(value: unknown, accepted: readonly T[]): value is T =>
  typeof value === 'string' && accepted.includes(value as T);

export const isLatitude = (value: unknown): boolean => {
  const n = toNumber(value);
  return n !== null && n >= -90 && n <= 90;
};

export const isLongitude = (value: unknown): boolean => {
  const n = toNumber(value);
  return n !== null && n >= -180 && n <= 180;
};

const cleanBarcode = (value: string) => value.replace(/\s+/g, '');

const checksumEan = (digits: string) => {
  const numbers = digits.split('').map(Number);
  const check = numbers.pop();
  if (typeof check === 'undefined') return false;

  const sum = numbers
    .reverse()
    .reduce((acc, digit, idx) => acc + digit * (idx % 2 === 0 ? 3 : 1), 0);

  return (10 - (sum % 10)) % 10 === check;
};

export const isBarcode = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const barcode = cleanBarcode(value);
  if (!/^\d{8}$|^\d{13}$|^\d{14}$/.test(barcode)) return false;
  return checksumEan(barcode);
};

export const parseDays = (value: unknown, min = 7, max = 90, fallback = 30): number => {
  const n = Math.trunc(toNumber(value) ?? fallback);
  return Math.min(max, Math.max(min, n));
};
