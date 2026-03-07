/**
 * Safely parse JSON with typed fallback
 * Returns fallback value if parsing fails or data is invalid
 */
export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (raw === null || raw === undefined || raw === '') {
    return fallback;
  }
  
  try {
    const parsed = JSON.parse(raw);
    
    // Type validation for arrays
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    
    // Type validation for objects (non-array)
    if (fallback !== null && typeof fallback === 'object' && !Array.isArray(fallback)) {
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        return fallback;
      }
    }
    
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Safe localStorage wrapper
 */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  removeItem(key: string): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string): boolean {
    return this.removeItem(key);
  },
  clear(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.clear();
    } catch {
      return;
    }
  },
  getJSON<T>(key: string, fallback: T): T {
    return safeJsonParse(this.getItem(key), fallback);
  },
  setJSON(key: string, value: unknown): boolean {
    try {
      return this.setItem(key, JSON.stringify(value));
    } catch {
      return false;
    }
  }
};

// Default export for backwards compatibility
export default safeLocalStorage;
