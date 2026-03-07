 
/**
 * Camera Permission Handler
 * Part of PR #3 - OCR Ingredients Extension
 * 
 * Explicit camera permission management with fallback options
 * Never blocks user - always provides alternatives
 */

import { useState, useEffect } from 'react';

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unknown';

interface CameraPermissionHandlerProps {
  onPermissionGranted: () => void;
  onUseFallback: () => void;
  children?: React.ReactNode;
}

export default function CameraPermissionHandler({
  onPermissionGranted,
  onUseFallback,
  children
}: CameraPermissionHandlerProps) {
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [isRequesting, setIsRequesting] = useState(false);

  // Check initial permission state
  useEffect(() => {
    checkPermissionState();
  }, []);

  async function checkPermissionState() {
    try {
      // Guard for non-browser environments (Node.js, SSR)
      if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
        setPermissionState('prompt');
        return;
      }
      
      // Check if Permissions API is available
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setPermissionState(result.state as PermissionState);
      
      // Listen for permission changes
      result.addEventListener('change', () => {
        setPermissionState(result.state as PermissionState);
      });
    } catch (error) {
      console.error('Permission check error:', error);
      setPermissionState('prompt');
    }
  }

  async function requestCameraPermission() {
    setIsRequesting(true);
    
    try {
      // Guard for non-browser environments
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      // Permission granted - stop stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState('granted');
      onPermissionGranted();
    } catch (error: any) {
      console.error('Camera permission error:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionState('denied');
      } else if (error.name === 'NotFoundError') {
        // No camera available
        alert('Aucune caméra détectée sur cet appareil.');
        onUseFallback();
      } else {
        setPermissionState('denied');
      }
    } finally {
      setIsRequesting(false);
    }
  }

  function openSystemSettings() {
    // Guard for non-browser environments
    if (typeof navigator === 'undefined') {
      return;
    }
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = "Pour activer la caméra :\n\n";
    
    if (isIOS) {
      instructions += "iOS :\n";
      instructions += "1. Ouvrez Réglages\n";
      instructions += "2. Recherchez votre navigateur (Safari/Chrome)\n";
      instructions += "3. Activez l'accès à la Caméra";
    } else if (isAndroid) {
      instructions += "Android :\n";
      instructions += "1. Ouvrez Paramètres\n";
      instructions += "2. Applications\n";
      instructions += "3. Sélectionnez votre navigateur\n";
      instructions += "4. Autorisations\n";
      instructions += "5. Activez la Caméra";
    } else {
      instructions += "Bureau :\n";
      instructions += "1. Cliquez sur l'icône de cadenas/info dans la barre d'adresse\n";
      instructions += "2. Cherchez 'Caméra'\n";
      instructions += "3. Autorisez l'accès";
    }
    
    alert(instructions);
  }

  // If permission already granted, show children
  if (permissionState === 'granted') {
    return <>{children}</>;
  }

  // Show permission request UI
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-md mx-auto">
      {/* Permission Prompt */}
      {permissionState === 'prompt' && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Accès à la caméra
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pour scanner les ingrédients, nous avons besoin d'accéder à votre caméra.
            </p>
          </div>
          
          <button
            onClick={requestCameraPermission}
            disabled={isRequesting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isRequesting ? 'Vérification...' : 'Autoriser la caméra'}
          </button>
          
          <button
            onClick={onUseFallback}
            className="w-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Importer une image
          </button>
        </div>
      )}

      {/* Permission Denied */}
      {permissionState === 'denied' && (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="font-bold text-red-900 dark:text-red-200 mb-1">
                  Accès caméra refusé
                </p>
                <p className="text-sm text-red-800 dark:text-red-300">
                  L'accès à la caméra est nécessaire pour scanner les ingrédients. 
                  Vous pouvez autoriser l'accès dans les paramètres ou importer une image.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={openSystemSettings}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ouvrir les paramètres
            </button>
            
            <button
              onClick={onUseFallback}
              className="w-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Importer une image à la place
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
