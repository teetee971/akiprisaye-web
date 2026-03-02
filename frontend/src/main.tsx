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
import { enforceBuildVersionSync, registerAppServiceWorker, selfHealGithubPagesIfNeeded } from './utils/buildVersionGuard';

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

const logoUrl = `${import.meta.env.BASE_URL}logo-akiprisaye.svg`;

function renderFallbackError(title: unknown, message: unknown) {
  const fallback = document.getElementById('loading-fallback');
  if (!fallback) return;

  const safeTitle = safeToText(title);
  const safeMessage = safeToText(message);

  fallback.innerHTML = `
    <img src="${logoUrl}" alt="A KI PRI SA YÉ" style="height: 64px; margin-bottom: 24px;" />
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


async function tryGithubPagesSelfHeal(reason?: unknown) {
  const healed = await selfHealGithubPagesIfNeeded(reason);
  return healed;
}

window.addEventListener('error', (event) => {
  const errorMessage = (event as ErrorEvent).error || (event as ErrorEvent).message || 'Erreur inattendue';
  void tryGithubPagesSelfHeal(errorMessage);

  // Affiche le fallback HTML uniquement si React n'a pas encore monté
  if (isFallbackVisible()) {
    renderFallbackError('A KI PRI SA YÉ', errorMessage);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = (event as PromiseRejectionEvent).reason || 'Promesse rejetée';
  void tryGithubPagesSelfHeal(reason);

  if (isFallbackVisible()) {
    renderFallbackError('A KI PRI SA YÉ', reason);
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
    const healed = await tryGithubPagesSelfHeal('startup-probe');
    if (healed) return;

    const versionChanged = await enforceBuildVersionSync(BUILD_ID);
    if (versionChanged) return;

    registerAppServiceWorker(BUILD_ID);
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
