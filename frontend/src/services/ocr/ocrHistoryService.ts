 
import { safeLocalStorage } from '../../utils/safeLocalStorage';
/**
 * OCR History Service
 * 
 * Local storage service for OCR scan history
 * - Opt-in only (requires explicit user consent)
 * - LocalStorage based (simple, no IndexedDB complexity for MVP)
 * - User can delete history at any time
 * - Export to JSON for portability
 * - RGPD compliant (local only, no identifiers)
 */

export interface OCRHistoryEntry {
  id: string;
  timestamp: number;
  type: 'text' | 'ean' | 'product' | 'photo' | 'ingredients';
  confidence: number;
  textExtracted: string;
  imageDataUrl?: string; // Optional thumbnail
  processingTime: number;
}

const HISTORY_KEY = 'akiprisaye_ocr_history';
const CONSENT_KEY = 'akiprisaye_ocr_history_consent';
const MAX_ENTRIES = 50; // Limit to prevent safeLocalStorage overflow

/**
 * Check if user has consented to history storage
 */
export function hasHistoryConsent(): boolean {
  try {
    return safeLocalStorage.getItem(CONSENT_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Set user consent for history storage
 */
export function setHistoryConsent(consent: boolean): void {
  try {
    if (consent) {
      safeLocalStorage.setItem(CONSENT_KEY, 'true');
    } else {
      safeLocalStorage.removeItem(CONSENT_KEY);
      // Also clear history if consent is revoked
      clearHistory();
    }
  } catch (error) {
    console.error('Failed to set history consent:', error);
  }
}

/**
 * Get OCR history (only if consent is given)
 */
export function getHistory(): OCRHistoryEntry[] {
  if (!hasHistoryConsent()) {
    return [];
  }

  try {
    const data = safeLocalStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data) as OCRHistoryEntry[];
  } catch (error) {
    console.error('Failed to load OCR history:', error);
    return [];
  }
}

/**
 * Add entry to OCR history (only if consent is given)
 */
export function addHistoryEntry(entry: Omit<OCRHistoryEntry, 'id' | 'timestamp'>): void {
  if (!hasHistoryConsent()) {
    return;
  }

  try {
    const history = getHistory();
    
    const newEntry: OCRHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    // Add to beginning (most recent first)
    history.unshift(newEntry);

    // Keep only last MAX_ENTRIES
    const trimmed = history.slice(0, MAX_ENTRIES);

    safeLocalStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save OCR history entry:', error);
  }
}

/**
 * Delete a specific history entry
 */
export function deleteHistoryEntry(id: string): void {
  try {
    const history = getHistory();
    const filtered = history.filter(entry => entry.id !== id);
    safeLocalStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete history entry:', error);
  }
}

/**
 * Clear all OCR history
 */
export function clearHistory(): void {
  try {
    safeLocalStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}

/**
 * Export history to JSON file
 */
export function exportHistoryToJSON(): string {
  const history = getHistory();
  return JSON.stringify(history, null, 2);
}

/**
 * Get history statistics
 */
export function getHistoryStats() {
  const history = getHistory();
  
  if (history.length === 0) {
    return {
      totalScans: 0,
      averageConfidence: 0,
      byType: {},
    };
  }

  const totalConfidence = history.reduce((sum, entry) => sum + entry.confidence, 0);
  const byType = history.reduce((acc, entry) => {
    acc[entry.type] = (acc[entry.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalScans: history.length,
    averageConfidence: totalConfidence / history.length,
    byType,
  };
}
