import React from 'react';
import ReactDOM from 'react-dom/client';
import L from 'leaflet';

import './styles/glass.css';
import './styles/mobile-fixes.css';
import './styles/leaflet-overrides.css';
import './styles/a11y.css';

import App from './App';

// Fix Leaflet marker icons for Vite/Cloudflare build
// Point to our bundled markers in /public/leaflet/
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

// Load debug utilities in development
if (import.meta.env.DEV) {
  import('./utils/onboardingDebug');
}

const fallbackElement = document.getElementById('loading-fallback');
const rootElement = document.getElementById('root');

if (fallbackElement && rootElement && rootElement.contains(fallbackElement)) {
  document.body.appendChild(fallbackElement);
}

const showFallback = (html) => {
  if (fallbackElement) {
    fallbackElement.style.display = 'flex';
    fallbackElement.setAttribute('aria-hidden', 'false');
    fallbackElement.innerHTML = html;
  }
};

const hideFallback = () => {
  if (fallbackElement) {
    fallbackElement.style.display = 'none';
    fallbackElement.setAttribute('aria-hidden', 'true');
  }
};


const renderRecoverableError = (message, details = '') => {
  showFallback(`
    <img src="/logo-akiprisaye.svg" alt="A KI PRI SA YÉ" style="height: 64px; margin-bottom: 24px;" />
    <h1 style="font-size: 1.5rem; margin-bottom: 8px;">A KI PRI SA YÉ</h1>
    <p style="color: #f87171; margin-bottom: 8px;">${message}</p>
    <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 16px;">${details}</p>
    <button onclick="location.reload()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; margin-bottom: 12px; display: block; width: 220px; margin-left: auto; margin-right: auto;">
      Recharger l'application
    </button>
    <p style="color: #64748b; font-size: 0.75rem; margin-top: 16px;">
      Si le problème persiste, vider le cache du navigateur.
    </p>
  `);
};

const isChunkLoadingError = (text = '') => {
  const normalized = String(text || '').toLowerCase();
  return (
    normalized.includes('chunkloaderror') ||
    normalized.includes('failed to fetch dynamically imported module') ||
    normalized.includes('importing a module script failed')
  );
};

const recoverFromChunkError = (error) => {
  const errorText = String(error?.message || error || '');
  if (!isChunkLoadingError(errorText)) {
    return false;
  }

  console.error('⚠️ Chunk loading error detected:', errorText);
  const reloadFlag = 'akiprisaye:chunk-reload-attempted';
  const hasReloaded = sessionStorage.getItem(reloadFlag) === '1';

  if (!hasReloaded) {
    sessionStorage.setItem(reloadFlag, '1');
    window.location.reload();
    return true;
  }

  renderRecoverableError(
    'Une mise à jour est en cours',
    'Le contenu a changé sur le serveur. Rechargez la page pour récupérer la version la plus récente.'
  );
  return true;
};

// Global error handler to catch errors before React loads
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Erreur globale:', { message, source, lineno, colno, error });
  if (recoverFromChunkError(error || message)) {
    return true;
  }

  renderRecoverableError('Une erreur est survenue', "Réessayez pour recharger l'application.");
  return true;
};

// Global timeout - if the app doesn't load in 15 seconds, show an error
const globalLoadTimeout = setTimeout(() => {
  // Only show error if fallback is still visible (app hasn't loaded)
  if (fallbackElement && fallbackElement.style.display !== 'none') {
    console.error('⏱️ Global timeout: App failed to load in 15 seconds');
    renderRecoverableError('Le chargement prend trop de temps', "L'application ne répond pas. Cela peut être dû à une connexion lente ou à une ancienne version en cache.");
  }
}, 15000);

// Clear the timeout if the app loads successfully
window.addEventListener('load', () => {
  clearTimeout(globalLoadTimeout);
});


window.addEventListener('unhandledrejection', (event) => {
  if (recoverFromChunkError(event.reason)) {
    event.preventDefault();
  }
});

window.addEventListener('vite:preloadError', (event) => {
  const error = event?.payload || event;
  if (recoverFromChunkError(error)) {
    event.preventDefault();
  }
});

window.addEventListener('load', async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch (swError) {
    console.warn('⚠️ Service Worker cleanup skipped:', swError);
  }
});

/**
 * Root application render with HashRouter for Cloudflare Pages SPA
 * ErrorBoundary is intentionally placed at the highest level
 * to avoid any blank screen in production.
 */

if (!rootElement) {
  console.error('❌ Root element #root not found');
} else {
  console.log('✅ main.jsx: Starting React render');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  const checkMount = () => {
    if (rootElement.childElementCount > 0) {
      hideFallback();
    } else {
      requestAnimationFrame(checkMount);
    }
  };

  requestAnimationFrame(checkMount);
  
  console.log('✅ main.jsx: React render initiated');
}
