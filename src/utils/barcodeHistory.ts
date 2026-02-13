const KEY = 'akiprisaye_barcode_history_v1';
const MAX = 15;

export type BarcodeHistoryItem = {
  barcode: string;
  at: string;
};

export function loadHistory(): BarcodeHistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is BarcodeHistoryItem => Boolean(item?.barcode) && Boolean(item?.at))
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function addToHistory(barcode: string): BarcodeHistoryItem[] {
  const now = new Date().toISOString();
  const current = loadHistory();

  const next = [
    { barcode, at: now },
    ...current.filter((entry) => entry.barcode !== barcode),
  ].slice(0, MAX);

  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ignore quota errors
  }

  return next;
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // noop
  }
}
