import { PropsWithChildren, useEffect } from 'react';

/**
 * Applies the persisted UI language to the document root on mount and renders children.
 *
 * Reads the 'akiprisaye-language' key from localStorage (defaults to 'fr') and sets `document.documentElement.lang` to that value.
 *
 * @returns The rendered children passed to this provider.
 */
export function LanguageProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const savedLanguage = localStorage.getItem('akiprisaye-language') || 'fr';
    document.documentElement.lang = savedLanguage;
  }, []);

  return children;
}