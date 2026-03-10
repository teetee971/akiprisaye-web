import { Link } from 'react-router-dom';

type ErrorStateProps = {
  error: string;
  onRetry: () => void;
  debugInfo?: string;
};

// Configuration constants
const SUPPORT_EMAIL = 'support@akiprisaye.fr';

export default function ErrorState({ error, onRetry, debugInfo }: ErrorStateProps) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border-2 border-red-200 dark:border-red-800 p-8">
      <div className="text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">⚠️</span>
        </div>

        {/* Error Message */}
        <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">
          Erreur de chargement
        </h3>
        <p className="text-lg text-slate-700 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
          {error}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            <span className="text-xl">🔄</span>
            <span>Réessayer</span>
          </button>
          
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
          >
            <span>←</span>
            <span>Retour à l'accueil</span>
          </Link>
        </div>

        {/* Contact Support */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-4 mb-4 text-left max-w-2xl mx-auto">
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
            <strong>Le problème persiste ?</strong>
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Contactez notre équipe support à{' '}
            <a 
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold underline hover:text-blue-900 dark:hover:text-blue-200"
            >
              {SUPPORT_EMAIL}
            </a>
            {' '}ou consultez notre{' '}
            <Link 
              to="/faq" 
              className="font-semibold underline hover:text-blue-900 dark:hover:text-blue-200"
            >
              FAQ
            </Link>.
          </p>
        </div>

        {/* Debug Info (Dev Mode Only) */}
        {isDev && debugInfo && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
              🔧 Informations de débogage (mode développement)
            </summary>
            <div className="mt-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 font-mono overflow-x-auto">
              {debugInfo}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
