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

/**
 * Root application render with HashRouter for Cloudflare Pages SPA
 * ErrorBoundary is intentionally placed at the highest level
 * to avoid any blank screen in production.
 */

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element #root not found');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
