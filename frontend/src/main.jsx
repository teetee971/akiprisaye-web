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

  // Build DOM nodes so textContent assignment prevents XSS
  const img = document.createElement('img');
  img.src = `${import.meta.env.BASE_URL}logo-akiprisaye.svg`;
  img.alt = 'A KI PRI SA YÉ';
  img.className = 'loading-logo';

  const h1 = document.createElement('h1');
  h1.className = 'loading-title';
  h1.textContent = safeToText(title);

  const p = document.createElement('p');
  p.className = 'loading-error';
  p.textContent = safeToText(message);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'loading-retry-btn';
  button.dataset.action = 'reload';
  button.textContent = 'Recharger';
  button.addEventListener('click', () => window.location.reload());

  fallback.innerHTML = '';
  fallback.appendChild(img);
  fallback.appendChild(h1);
  fallback.appendChild(p);
  fallback.appendChild(button);
};

const hideHtmlFallback = () => {
  const fallback = document.getElementById('loading-fallback');
  if (fallback) fallback.classList.add('loading-fallback-hidden');
};

const isFallbackVisible = () => {
  const fallback = document.getElementById('loading-fallback');
  return Boolean(fallback && !fallback.classList.contains('loading-fallback-hidden'));
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