/**
 * Language Provider
 * Manages language state and provides i18n context
 */

import { ReactNode, Suspense, lazy, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { useLanguage } from '../hooks/useLanguage';
import { Language } from '../i18n/languages';

// LanguageSuggestionModal is only shown when the user's detected territory
// suggests a different language — lazy-loaded so its dependency on useTranslation
// and lucide icons doesn't inflate the LanguageProvider chunk itself.
const LanguageSuggestionModal = lazy(() =>
  import('../components/i18n/LanguageSuggestionModal').then((m) => ({
    default: m.LanguageSuggestionModal,
  }))
);
import { logDebug } from '../utils/logger';

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  useEffect(() => {
    logDebug('🌐 LanguageProvider: Initializing i18n');
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageInitializer>{children}</LanguageInitializer>
    </I18nextProvider>
  );
}

function LanguageInitializer({ children }: { children: ReactNode }) {
  const { suggestLanguageFromTerritory, changeLanguage } = useLanguage();
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestedLanguage, setSuggestedLanguage] = useState<Language | null>(null);

  useEffect(() => {
    // Détecter le territoire de l'utilisateur et suggérer la langue
    const userTerritory = localStorage.getItem('akiprisaye-territory');

    if (userTerritory) {
      const suggestion = suggestLanguageFromTerritory(userTerritory);
      if (suggestion) {
        setSuggestedLanguage(suggestion);
        setShowSuggestion(true);
      }
    }
  }, [suggestLanguageFromTerritory]);

  const handleAcceptSuggestion = () => {
    if (suggestedLanguage) {
      changeLanguage(suggestedLanguage.code);
    }
    setShowSuggestion(false);
  };

  const handleDeclineSuggestion = () => {
    localStorage.setItem('akiprisaye-language', 'fr');
    setShowSuggestion(false);
  };

  return (
    <>
      {children}
      {showSuggestion && suggestedLanguage && (
        <Suspense fallback={null}>
          <LanguageSuggestionModal
            language={suggestedLanguage}
            onAccept={handleAcceptSuggestion}
            onDecline={handleDeclineSuggestion}
          />
        </Suspense>
      )}
    </>
  );
}
