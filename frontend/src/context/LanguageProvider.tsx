/**
 * Language Provider
 * Manages language state and provides i18n context
 */

import { ReactNode, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { useLanguage } from '../hooks/useLanguage';
import { LanguageSuggestionModal } from '../components/i18n/LanguageSuggestionModal';
import { Language } from '../i18n/languages';
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
      <LanguageInitializer>
        {children}
      </LanguageInitializer>
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
        <LanguageSuggestionModal
          language={suggestedLanguage}
          onAccept={handleAcceptSuggestion}
          onDecline={handleDeclineSuggestion}
        />
      )}
    </>
  );
}
