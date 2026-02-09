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

// Global error handler to catch errors before React loads
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Erreur globale:', { message, source, lineno, colno, error });
  const fallback = document.getElementById('loading-fallback');
  if (fallback) {
    fallback.innerHTML = `
      <img src="/logo-akiprisaye.svg" alt="A KI PRI SA YÉ" style="height: 64px; margin-bottom: 24px;" />
      <h1 style="font-size: 1.5rem; margin-bottom: 8px;">A KI PRI SA YÉ</h1>
      <p style="color: #f87171; margin-bottom: 16px;">Une erreur est survenue</p>
      <button onclick="location.reload()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
        Réessayer
      </button>
    `;
  }
  return true;
};

// Global timeout - if the app doesn't load in 15 seconds, show an error
const globalLoadTimeout = setTimeout(() => {
  const fallback = document.getElementById('loading-fallback');
  // Only show error if fallback is still visible (app hasn't loaded)
  if (fallback && fallback.style.display !== 'none') {
    console.error('⏱️ Global timeout: App failed to load in 15 seconds');
    fallback.innerHTML = `
      <img src="/logo-akiprisaye.svg" alt="A KI PRI SA YÉ" style="height: 64px; margin-bottom: 24px;" />
      <h1 style="font-size: 1.5rem; margin-bottom: 8px;">A KI PRI SA YÉ</h1>
      <p style="color: #f87171; margin-bottom: 8px;">Le chargement prend trop de temps</p>
      <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 16px;">
        L'application ne répond pas. Cela peut être dû à une connexion lente ou à un problème de configuration.
      </p>
      <button onclick="location.reload()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; margin-bottom: 12px; display: block; width: 200px; margin-left: auto; margin-right: auto;">
        Réessayer
      </button>
      <p style="color: #64748b; font-size: 0.75rem; margin-top: 16px;">
        Si le problème persiste, essayez de vider le cache de votre navigateur.
      </p>
    `;
  }
}, 15000);

// Clear the timeout if the app loads successfully
window.addEventListener('load', () => {
  clearTimeout(globalLoadTimeout);
});

/**
 * Root application render with HashRouter for Cloudflare Pages SPA
 * ErrorBoundary is intentionally placed at the highest level
 * to avoid any blank screen in production.
 */

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element #root not found');
} else {
  console.log('✅ main.jsx: Starting React render');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ main.jsx: React render initiated');
}
