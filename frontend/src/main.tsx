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
import { enforceBuildVersionSync, registerAppServiceWorker } from './utils/buildVersionGuard';

declare global {
  interface Window {
    __BUILD_SHA__?: string;
  }
}

/**
 * IMPORTANT (tests Vitest):
 * On garde explicitement la chaîne "VITE_APP_BUILD_ID" dans ce fichier.
 * Certains tests font juste un readFileSync + toContain("VITE_APP_BUILD_ID").
 */
const VITE_APP_BUILD_ID = import.meta.env.VITE_APP_BUILD_ID as string | undefined;

const BUILD_ID = VITE_APP_BUILD_ID || (import.meta.env.VITE_BUILD_SHA as string | undefined) || 'unknown';
window.__BUILD_SHA__ = BUILD_ID;

logDebug(`[build] A KI PRI SA YÉ boot id=${BUILD_ID}`);
installRuntimeCrashProbe();

// Load debug utilities in development
if (import.meta.env.DEV) {
  import('./utils/onboardingDebug');
}

function renderFallbackError(title: unknown, message: unknown) {
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
}

function hideHtmlFallback() {
  const fallback = document.getElementById('loading-fallback');
  if (fallback) fallback.style.display = 'none';
}

function isFallbackVisible() {
  const fallback = document.getElementById('loading-fallback');
  return Boolean(fallback && fallback.style.display !== 'none');
}

window.addEventListener('error', (event) => {
  // Affiche le fallback HTML uniquement si React n'a pas encore monté
  if (isFallbackVisible()) {
    renderFallbackError('A KI PRI SA YÉ', (event as ErrorEvent).error || (event as ErrorEvent).message || 'Erreur inattendue');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (isFallbackVisible()) {
    renderFallbackError('A KI PRI SA YÉ', (event as PromiseRejectionEvent).reason || 'Promesse rejetée');
  }
});

// Global timeout - if the app doesn't load in 15 seconds, show an error
const globalLoadTimeout = window.setTimeout(() => {
  if (isFallbackVisible()) {
    renderFallbackError('A KI PRI SA YÉ', 'Le chargement prend trop de temps.');
  }
}, 15000);

async function bootstrap() {
  // 1) Anti “mismatch de build” (peut reload/redirect)

  if (import.meta.env.PROD) {

    const versionChanged = await enforceBuildVersionSync(BUILD_ID);

    if (versionChanged) return;

    registerAppServiceWorker();

  }
  // 3) Render React
  const rootElement = document.getElementById('root');
if (!rootElement) {
    if (isFallbackVisible()) {
      renderFallbackError('A KI PRI SA YÉ', 'Élément racine introuvable (#root).');
    }
    return;
  }

  setTimeout(() => hideHtmlFallback(), 0);
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
    clearTimeout(globalLoadTimeout);
  });
}

bootstrap();