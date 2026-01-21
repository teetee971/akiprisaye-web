export const safeLocalStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      return;
    }
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      return;
    }
  },
  clear(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.clear();
    } catch {
      return;
    }
  },
};
