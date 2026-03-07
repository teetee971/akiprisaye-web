 
/**
 * Language hook for managing language state and operations
 */

import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, TERRITORY_LANGUAGE_MAP, Language } from '../i18n/languages';

export function useLanguage() {
  const { i18n } = useTranslation();
  
  const currentLanguage = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];
  
  const changeLanguage = useCallback(async (code: string) => {
    await i18n.changeLanguage(code);
    localStorage.setItem('akiprisaye-language', code);
    
    // Mettre à jour l'attribut lang du document
    document.documentElement.lang = code;
  }, [i18n]);
  
  const detectLanguageFromTerritory = useCallback((territoryCode: string) => {
    const languageCode = TERRITORY_LANGUAGE_MAP[territoryCode] || 'fr';
    return LANGUAGES.find(l => l.code === languageCode) || LANGUAGES[0];
  }, []);
  
  const suggestLanguageFromTerritory = useCallback((territoryCode: string) => {
    const savedLanguage = localStorage.getItem('akiprisaye-language');
    
    // Ne pas suggérer si l'utilisateur a déjà choisi une langue
    if (savedLanguage) return null;
    
    const suggestedLang = detectLanguageFromTerritory(territoryCode);
    
    // Ne suggérer que si c'est une langue créole
    if (suggestedLang.code === 'fr') return null;
    
    return suggestedLang;
  }, [detectLanguageFromTerritory]);
  
  // Synchroniser l'attribut lang du document
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  
  return {
    currentLanguage,
    languages: LANGUAGES,
    changeLanguage,
    detectLanguageFromTerritory,
    suggestLanguageFromTerritory,
    isCreole: currentLanguage.code !== 'fr',
  };
}
