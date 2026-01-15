/**
 * Silans Lokal Mode Component
 * Private mode with offline support and no tracking
 */

import { useState, useEffect } from 'react';
import { EyeOff, Shield, Database, WifiOff } from 'lucide-react';

export function SilansLokalMode() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    // Load mode state from localStorage
    const stored = localStorage.getItem('silans_lokal_mode');
    setIsEnabled(stored === 'true');

    // Check if service worker is ready for offline
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setOfflineReady(true);
      });
    }
  }, []);

  const toggleMode = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    localStorage.setItem('silans_lokal_mode', String(newState));

    if (newState) {
      // Enable private mode
      enablePrivateMode();
    } else {
      // Disable private mode
      disablePrivateMode();
    }
  };

  const enablePrivateMode = () => {
    // Disable analytics
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied'
      });
    }

    // Clear any tracking cookies
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('_ga') || name.startsWith('_gid')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });

    // Set session storage flag
    sessionStorage.setItem('privacy_mode', 'active');
  };

  const disablePrivateMode = () => {
    // Re-enable analytics if user consented before
    const consent = localStorage.getItem('cookie_consent');
    if (consent === 'accepted' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'denied'
      });
    }

    sessionStorage.removeItem('privacy_mode');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-lg ${isEnabled ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
            <EyeOff className={`w-6 h-6 ${isEnabled ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400'}`} />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
            Mode Silans Lokal
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Mode privé avec stockage local uniquement et aucun tracking.
          </p>

          {/* Status Badge */}
          {isEnabled && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Mode Privé Actif
            </div>
          )}

          {/* Features */}
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <Database className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isEnabled ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`} />
              <div>
                <div className="font-medium text-slate-900 dark:text-white text-sm">
                  Données stockées localement
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Toutes vos données restent sur votre appareil
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <WifiOff className={`w-5 h-5 flex-shrink-0 mt-0.5 ${offlineReady ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`} />
              <div>
                <div className="font-medium text-slate-900 dark:text-white text-sm">
                  Fonctionnement hors ligne
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {offlineReady ? 'Prêt à fonctionner sans connexion' : 'En cours de préparation...'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <EyeOff className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isEnabled ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`} />
              <div>
                <div className="font-medium text-slate-900 dark:text-white text-sm">
                  Aucun tracking
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Pas de suivi analytics, pas de cookies tiers
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={toggleMode}
            className={`
              w-full px-4 py-3 rounded-lg font-semibold transition-colors
              ${isEnabled 
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
              }
            `}
          >
            {isEnabled ? 'Désactiver le Mode Privé' : 'Activer le Mode Privé'}
          </button>

          {/* Info */}
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            En mode privé, certaines fonctionnalités nécessitant une connexion serveur seront limitées.
          </p>
        </div>
      </div>
    </div>
  );
}
