import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';

import './styles/glass.css';
import './styles/innovations-3d.css';
import './styles/mobile-fixes.css';
import './styles/leaflet-overrides.css';
import './styles/a11y.css';

import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { safeToText } from './utils/safeToText';
import { installRuntimeCrashProbe } from './monitoring/runtimeCrashProbe';
import { initSentry } from './monitoring/sentry';
import { initErrorTracker } from './monitoring/errorTracker';
import { initWebVitals } from './monitoring/webVitals';
import { logDebug } from './utils/logger';
import { enforceBuildVersionSyncAsync, registerAppServiceWorker } from './utils/buildVersionGuard.client';

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
initSentry();
installRuntimeCrashProbe();
initErrorTracker();
initWebVitals();

// A) Purge stale price data from IndexedDB on startup (non-blocking)
import('./services/priceCacheService').then(({ purgeExpiredPriceCache }) => {
  purgeExpiredPriceCache().then((count) => {
    if (count > 0) logDebug(`[cache] Purged ${count} stale price records`);
  });
});

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
    <img src="${import.meta.env.BASE_URL}logo-akiprisaye.svg" alt="A KI PRI SA YÉ" width="64" height="64" style="margin-bottom: 24px;" />
    <h1 style="font-size: 1.5rem; margin-bottom: 8px;">${safeTitle}</h1>
    <p style="color: #f87171; margin-bottom: 8px;">${safeMessage}</p>
    <button type="button" data-action="reload" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
      Recharger
    </button>
  `;
  // Attach the reload handler imperatively — avoids inline onclick which is
  // blocked by strict-dynamic CSP and flagged by Lighthouse Best Practices.
  fallback.querySelector<HTMLButtonElement>('[data-action="reload"]')
    ?.addEventListener('click', () => { window.location.reload(); });
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

/**
 * Determine whether the current hostname corresponds to a GitHub Pages site.
 * We consider hostnames of the form "<user>.github.io" (at least three labels).
 */
function isGitHubPagesHost(hostname: string): boolean {
  const parts = hostname.split('.');
  if (parts.length < 3) return false;
  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];
  return last === 'io' && secondLast === 'github';
}

/**
 * GitHub Pages self-heal: if the app is served from a github.io subdirectory
 * and a stale service worker might be intercepting requests with wrong paths,
 * purge all SW registrations + caches and reload once.
 */
async function githubPagesSelfHeal(): Promise<boolean> {
  if (!isGitHubPagesHost(window.location.hostname)) return false;
  const HEAL_KEY = 'gh_pages_healed_v3';
  if (sessionStorage.getItem(HEAL_KEY)) return false;

  try {
    const baseUrl = import.meta.env.BASE_URL;
    const probePaths = [
      `${baseUrl}manifest.webmanifest`,
      `${baseUrl}icon-192.png`,
    ];

    const probeResults = await Promise.allSettled(
      probePaths.map(async (path) => {
        const response = await fetch(path, { method: 'GET', cache: 'no-store' });
        return { path, status: response.status };
      }),
    );

    const has404 = probeResults.some(
      (result) => result.status === 'fulfilled' && result.value.status === 404,
    );

    if (!has404) return false;

    let didHeal = false;
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
        didHeal = true;
      }
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
        didHeal = true;
      }
    }
    if (didHeal) {
      sessionStorage.setItem(HEAL_KEY, '1');
      window.location.reload();
      return true;
    }
  } catch {
    // best-effort
  }
  return false;
}

async function bootstrap() {
  // 0) GitHub Pages self-heal: clear stale SW/caches on github.io
  if (await githubPagesSelfHeal()) return;

  // 1) Anti “mismatch de build” (peut reload/redirect)

  if (import.meta.env.PROD) {

    const versionChanged = await enforceBuildVersionSyncAsync(BUILD_ID);

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
