import { useEffect } from 'react';

/**
 * Keyboard shortcut hook for opening the global search palette (Ctrl+K / Cmd+K).
 * Extracted from GlobalSearch.tsx so Header can install the shortcut without
 * eagerly loading the full command-palette component.
 */
export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onOpen]);
}
