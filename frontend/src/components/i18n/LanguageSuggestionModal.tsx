/**
 * Language Suggestion Modal
 * Suggests language based on user's territory
 */

import { useTranslation } from 'react-i18next';
import { Language } from '../../i18n/languages';

interface LanguageSuggestionModalProps {
  language: Language;
  onAccept: () => void;
  onDecline: () => void;
}

export function LanguageSuggestionModal({
  language,
  onAccept,
  onDecline,
}: LanguageSuggestionModalProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{language.flag}</div>
          <h2 className="text-2xl font-bold mb-2">{t('common:app.name')}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Nous avons détecté que vous êtes en {language.territory}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <p className="text-center font-medium">
            Préférez-vous utiliser l'application en <strong>{language.native}</strong> ?
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onAccept}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Oui, utiliser {language.native}
          </button>
          <button
            onClick={onDecline}
            className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors"
          >
            Non, continuer en Français
          </button>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          Vous pourrez toujours changer de langue dans les paramètres
        </p>
      </div>
    </div>
  );
}
