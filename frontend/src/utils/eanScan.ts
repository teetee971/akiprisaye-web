export function normalizeDetectedCode(rawCode: string) {
  return rawCode.replace(/\s+/g, '').trim();
}

export function isAcceptedEanCode(code: string) {
  return /^\d{13}$/.test(code) || /^\d{8}$/.test(code);
}
