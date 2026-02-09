import { PropsWithChildren, useEffect } from 'react';

export function LanguageProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const savedLanguage = localStorage.getItem('akiprisaye-language') || 'fr';
    document.documentElement.lang = savedLanguage;
  }, []);

  return children;
}
