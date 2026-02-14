/**
 * i18next configuration for AKiPriSaYe
 * Handles internationalization with support for multiple languages
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { logDebug } from '../utils/logger';

const SUPPORTED_LANGUAGES = ['fr', 'gcf', 'acf', 'rcf', 'gcr'];

logDebug('🌐 i18n: Starting initialization');

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    supportedLngs: SUPPORTED_LANGUAGES,
    
    // Namespaces pour organiser les traductions
    ns: [
      'common',        // Éléments communs (boutons, navigation)
      'home',          // Page d'accueil
      'search',        // Recherche
      'store',         // Magasins
      'product',       // Produits
      'cart',          // Liste de courses
      'profile',       // Profil utilisateur
      'gamification',  // Gamification
      'alerts',        // Alertes et notifications
      'map',           // Carte
      'inflation',     // Tableau de bord inflation
      'reviews',       // Avis et commentaires
      'errors',        // Messages d'erreur
      'validation',    // Validation de formulaires
    ],
    defaultNS: 'common',
    
    // Détection de langue
    detection: {
      order: ['localStorage', 'querystring', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'akiprisaye-language',
      caches: ['localStorage'],
    },
    
    // Chargement des traductions
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'no-cache',
      },
      // Add timeout to prevent hanging on slow networks
      parse: (data: string) => {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse translation file:', e);
          return {};
        }
      },
    },
    
    // Partitioning - load namespaces on-demand instead of all at once
    partialBundledLanguages: true,
    
    // Load only when needed, not all at initialization
    load: 'languageOnly',
    
    // Interpolation et formatage
    interpolation: {
      escapeValue: false,
      format: (value, format, lng) => {
        if (format === 'price') {
          return new Intl.NumberFormat(lng === 'fr' ? 'fr-FR' : 'fr-FR', {
            style: 'currency',
            currency: 'EUR',
          }).format(value);
        }
        if (format === 'number') {
          return new Intl.NumberFormat(lng === 'fr' ? 'fr-FR' : 'fr-FR').format(value);
        }
        if (format === 'percent') {
          return new Intl.NumberFormat(lng === 'fr' ? 'fr-FR' : 'fr-FR', {
            style: 'percent',
            maximumFractionDigits: 1,
          }).format(value / 100);
        }
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng === 'fr' ? 'fr-FR' : 'fr-FR', {
            dateStyle: 'long',
          }).format(new Date(value));
        }
        if (format === 'datetime') {
          return new Intl.DateTimeFormat(lng === 'fr' ? 'fr-FR' : 'fr-FR', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(value));
        }
        if (format === 'relative') {
          const rtf = new Intl.RelativeTimeFormat(lng === 'fr' ? 'fr-FR' : 'fr-FR', {
            numeric: 'auto',
          });
          // Calculer la différence en jours
          const diff = Math.round((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return rtf.format(diff, 'day');
        }
        return value;
      },
    },
    
    react: {
      useSuspense: false, // Disable suspense to prevent blocking render
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'em', 'i', 'b', 'u', 'span'],
    },
  })
  .then(() => {
    logDebug('✅ i18n: Initialized successfully');
  })
  .catch((error) => {
    console.error('⚠️ i18n: Initialization failed', error);
    // Don't throw - allow app to continue even if i18n fails
  });

export default i18n;
