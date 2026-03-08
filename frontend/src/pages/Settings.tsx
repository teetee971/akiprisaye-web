 
/**
 * Settings Page
 * Part of Ticket 4: User Settings
 * 
 * Provides clear access to:
 * - Permissions (camera, OCR)
 * - User history
 * - Data management (export, deletion)
 * - Legal links
 * 
 * READ-ONLY, opt-in analytics local
 */

import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { User } from 'firebase/auth';
import { safeLocalStorage } from '../utils/safeLocalStorage';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [cameraPermission, setCameraPermission] = useState<string>('unknown');
  const [analyticsOptIn, setAnalyticsOptIn] = useState(
    () => safeLocalStorage.getItem('akiprisaye-analytics-optin') === 'true'
  );
  
  useEffect(() => {
    // Get current user
    const unsubscribe = auth?.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    }) ?? (() => {});
    
    // Check camera permission
    checkCameraPermission();
    
    return () => unsubscribe();
  }, []);
  
  async function checkCameraPermission() {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermission(result.state);
      } else {
        setCameraPermission('unavailable');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to check camera permission:', error);
      }
      setCameraPermission('unavailable');
    }
  }
  
  function handleExportData() {
    const data = {
      export_date: new Date().toISOString(),
      user_email: user?.email || 'Non connecté',
      note: 'Export des données personnelles de l\'utilisateur',
      permissions: {
        camera: cameraPermission
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `akiprisaye-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  function handleDeleteLocalData() {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données locales ? Cette action est irréversible.')) {
      // Clear safeLocalStorage
      safeLocalStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear cookies (if any)
      const cookies = document.cookie ? document.cookie.split(";") : [];
      const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
      cookies.forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = (eqPos > -1 ? cookie.substr(0, eqPos) : cookie).trim();
        // Try deleting with different path combinations
        document.cookie = name + "=; expires=" + expires + "; path=/";
        document.cookie = name + "=; expires=" + expires + "; path=/; domain=" + window.location.hostname;
      });
      
      alert('Toutes les données locales ont été supprimées. La page va se recharger.');
      window.location.reload();
    }
  }

  const handleAnalyticsToggle = () => {
    const nextValue = !analyticsOptIn;
    setAnalyticsOptIn(nextValue);
    safeLocalStorage.setItem('akiprisaye-analytics-optin', String(nextValue));
  };

  const getPermissionIcon = (state: string) => {
    switch (state) {
      case 'granted':
        return '✅';
      case 'denied':
        return '❌';
      case 'prompt':
        return '❓';
      default:
        return '➖';
    }
  };
  
  const getPermissionText = (state: string) => {
    switch (state) {
      case 'granted':
        return 'Accordée';
      case 'denied':
        return 'Refusée';
      case 'prompt':
        return 'Non demandée';
      case 'unavailable':
        return 'Non disponible';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <HeroImage
          src={PAGE_HERO_IMAGES.settings}
          alt="Paramètres"
          gradient="from-slate-950 to-slate-800"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>⚙️ Paramètres</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Gérez vos préférences et votre compte</p>
        </HeroImage>
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
          {/* User Info Section */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Informations du compte
            </h2>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              {user ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white font-semibold">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nom:</span>
                    <span className="text-white font-semibold">{user.displayName || 'Non renseigné'}</span>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-center">Non connecté</p>
              )}
            </div>
          </section>

          {/* Permissions Section */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Autorisations
            </h2>
            <div className="space-y-3">
              {/* Camera Permission */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-white font-semibold">Accès à la caméra</span>
                  </div>
                  <span className="text-lg">{getPermissionIcon(cameraPermission)}</span>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  Utilisée pour scanner les codes-barres
                </p>
                <p className={`text-sm font-semibold ${
                  cameraPermission === 'granted' ? 'text-green-400' :
                  cameraPermission === 'denied' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  État: {getPermissionText(cameraPermission)}
                </p>
                {cameraPermission === 'denied' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Activez l'accès dans les paramètres de votre navigateur
                  </p>
                )}
              </div>

              {/* OCR Permission */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-white font-semibold">Analyse OCR</span>
                  </div>
                  <span className="text-lg">ℹ️</span>
                </div>
                <p className="text-sm text-gray-400">
                  Consentement demandé à chaque utilisation. Aucune image n'est conservée.
                </p>
              </div>
            </div>
          </section>

          {/* Analytics Section */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3v18m4-14v14m4-10v10M7 9v12M3 13v8" />
              </svg>
              Analytique éthique
            </h2>
            <div className="bg-slate-800/50 rounded-lg p-4 flex flex-col gap-3">
              <p className="text-sm text-gray-400">
                Mesure d’audience locale, sans cookies tiers, et désactivée par défaut.
              </p>
              <button
                type="button"
                onClick={handleAnalyticsToggle}
                className={`flex items-center justify-between rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  analyticsOptIn
                    ? 'border-green-500 text-green-300 bg-green-500/10'
                    : 'border-slate-700 text-slate-300 bg-slate-900/40'
                }`}
              >
                <span>{analyticsOptIn ? 'Analytique activée' : 'Analytique désactivée'}</span>
                <span>{analyticsOptIn ? '✅' : '⚪️'}</span>
              </button>
              <p className="text-xs text-slate-500">
                Vous pouvez modifier ce choix à tout moment. Aucun suivi publicitaire.
              </p>
            </div>
          </section>

          {/* Data Management Section */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Gestion des données
            </h2>
            <div className="space-y-3">
              {/* Export Data */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export de vos données
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Téléchargez une copie de vos données personnelles au format JSON
                </p>
                <button
                  onClick={handleExportData}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exporter mes données
                </button>
              </div>

              {/* Delete Data */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Suppression des données
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Supprimez toutes vos données locales (localStorage, cookies)
                </p>
                <button
                  onClick={handleDeleteLocalData}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Supprimer toutes mes données locales
                </button>
              </div>
            </div>
          </section>

          {/* Legal Links Section */}
          <section className="mb-4">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Informations légales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a
                href="/mentions-legales"
                className="bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-4 transition-colors flex items-center justify-between"
              >
                <span className="text-white font-semibold">Mentions légales</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              
              <a
                href="/methodologie"
                className="bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-4 transition-colors flex items-center justify-between"
              >
                <span className="text-white font-semibold">Méthodologie</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              
              <a
                href="/a-propos"
                className="bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-4 transition-colors flex items-center justify-between"
              >
                <span className="text-white font-semibold">À propos</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              
              <a
                href="/contact"
                className="bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-4 transition-colors flex items-center justify-between"
              >
                <span className="text-white font-semibold">Contact</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </section>

          {/* Info Banner */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-blue-200 font-semibold mb-1">Service citoyen gratuit</p>
                <p className="text-sm text-blue-300">
                  Pas de publicité ni de tracking tiers. Les métriques sont opt-in et restent locales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
