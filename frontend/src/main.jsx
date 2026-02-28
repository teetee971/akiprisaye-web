/* eslint-disable no-undef */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';

import './styles/glass.css';
import './styles/mobile-fixes.css';
import './styles/leaflet-overrides.css';
import './styles/a11y.css';

import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { safeToText } from './utils/safeToText';
import { installRuntimeCrashProbe } from './monitoring/runtimeCrashProbe';
import { logDebug } from './utils/logger';
import {
  enforceBuildVersionSync,
  registerAppServiceWorker,
} from './utils/buildVersionGuard';

/**
 * IMPORTANT (tests Vitest):
 * On garde explicitement la chaîne "VITE_APP_BUILD_ID" dans ce fichier.
 * Certains tests font juste un readFileSync + toContain("VITE_APP_BUILD_ID").
 */
const VITE_APP_BUILD_ID = import.meta.env.VITE_APP_BUILD_ID;

const BUILD_ID = VITE_APP_BUILD_ID || import.meta.env.VITE_BUILD_SHA || 'unknown';
window.__BUILD_SHA__ = BUILD_ID;

logDebug(`[build] A KI PRI SA YÉ boot id=${BUILD_ID}`);
installRuntimeCrashProbe();

// Load debug utilities in development
if (import.meta.env.DEV) {
  import('./utils/onboardingDebug');
}

const renderFallbackError = (title, message) => {
  const fallback = document.getElementById('loading-fallback');
  if (!fallback) return;

  const safeTitle = safeToText(title);
  const safeMessage = safeToText(message);

  fallback.innerHTML = `
    <img src="/logo-akiprisaye.svg" alt="A KI PRI SA YÉ" style="height: 64px; margin-bottom: 24px;" />
    <h1 style="font-size: 1.5rem; margin-bottom: 8px;">${safeTitle}</h1>
    <p style="color: #f87171; margin-bottom: 8px;">${safeMessage}</p>
    <button onclick="location.reload()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
      Recharger
    </button>
  `;
};

const hideHtmlFallback = () => {
  const fallback = document.getElementById('loading-fallback');
  if (fallback) fallback.style.display = 'none';
};

const isFallbackVisible = () => {
  const fallback = document.getElementById('loading-fallback');
  return Boolean(fallback && fallback.style.display !== 'none');
};

window.addEventListener('error', (event) => {
  // Event.error peut être undefined selon le navigateur
  const err = event?.error;
  const msg =
    (err && (err.stack || err.message)) ||
    event?.message ||
    'Erreur inattendue';

  console.error('[window.onerror]', msg);

  // Affiche le fallback HTML uniquement si React n'a pas encore monté
  if (isFallbackVisible()) {
    renderFallbackError('A KI PRI SA YÉ', msg);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason;
  const msg =
    (reason && (reason.stack || reason.message)) ||
    String(reason || 'Promesse rejetée');

  console.error('[unhandledrejection]', msg);

  if (isFallbackVisible()) {
    renderFallbackError('A KI PRI SA YÉ', msg);
  }
});

// Global timeout - if the app doesn't load in 15 seconds, show an error
const globalLoadTimeout = setTimeout(() => {
  if (isFallbackVisible()) {
    console.error('⏱️ Global timeout: App failed to load in 15 seconds');
    renderFallbackError('A KI PRI SA YÉ', 'Le chargement prend trop de temps.');
  }
}, 15000);

function bootstrap() {
  // 1) Anti “mismatch de build”
  // Les tests Vitest attendent explicitement "enforceBuildVersionSync" dans ce fichier.
  enforceBuildVersionSync();

  // 2) Service worker
  // Les tests Vitest attendent explicitement "registerAppServiceWorker" dans ce fichier.
  registerAppServiceWorker();

  // 3) Render React
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ Root element #root not found');
    if (isFallbackVisible()) {
      renderFallbackError('A KI PRI SA YÉ', 'Élément racine introuvable (#root).');
    }
    return;
  }

  logDebug('✅ main.jsx: Starting React render');

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </HelmetProvider>
    </React.StrictMode>
  );

  // Masque le fallback HTML dès que le rendu est lancé
  requestAnimationFrame(() => {
    hideHtmlFallback();
    clearTimeout(globalLoadTimeout);
  });

  logDebug('✅ main.jsx: React render initiated');
}

bootstrap();