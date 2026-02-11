import React from 'react';
import ReactDOM from 'react-dom/client';
import L from 'leaflet';

import './styles/glass.css';
import './styles/mobile-fixes.css';
import './styles/leaflet-overrides.css';
import './styles/a11y.css';

import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { safeToText } from './utils/safeToText';
import { installRuntimeCrashProbe } from './monitoring/runtimeCrashProbe';

const BUILD_SHA = import.meta.env.VITE_BUILD_SHA || 'unknown';
window.__BUILD_SHA__ = BUILD_SHA;
const consoleInfo = globalThis?.console?.info?.bind(globalThis.console);
consoleInfo?.(`[build] A KI PRI SA YÉ boot sha=${BUILD_SHA}`);
installRuntimeCrashProbe();

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

const renderFallbackError = (title, message) => {
  const fallback = document.getElementById('loading-fallback');
  if (!fallback) return;

  fallback.innerHTML = `
    <img src="/logo-akiprisaye.svg" alt="A KI PRI SA YÉ" style="height: 64px; margin-bottom: 24px;" />
    <h1 style="font-size: 1.5rem; margin-bottom: 8px;">${title}</h1>
    <p style="color: #f87171; margin-bottom: 8px;">${message}</p>
    <button onclick="location.reload()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
      Recharger
    </button>
  `;
};

window.addEventListener('error', (event) => {
  console.error('[window.onerror]', event.error || event.message);

  // Display fallback only if React has not mounted yet
  const fallback = document.getElementById('loading-fallback');
  if (fallback && fallback.style.display !== 'none') {
    renderFallbackError('A KI PRI SA YÉ', safeToText(event.error || event.message || 'Erreur inattendue'));
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[unhandledrejection]', event.reason);
});

// Global timeout - if the app doesn't load in 15 seconds, show an error
const globalLoadTimeout = setTimeout(() => {
  const fallback = document.getElementById('loading-fallback');
  // Only show error if fallback is still visible (app hasn't loaded)
  if (fallback && fallback.style.display !== 'none') {
    console.error('⏱️ Global timeout: App failed to load in 15 seconds');
    renderFallbackError('A KI PRI SA YÉ', 'Le chargement prend trop de temps.');
  }
}, 15000);

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element #root not found');
} else {
  console.log('✅ main.jsx: Starting React render');

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );

  requestAnimationFrame(() => {
    const fallback = document.getElementById('loading-fallback');
    if (fallback) {
      fallback.style.display = 'none';
    }
    clearTimeout(globalLoadTimeout);
  });

  console.log('✅ main.jsx: React render initiated');
}
