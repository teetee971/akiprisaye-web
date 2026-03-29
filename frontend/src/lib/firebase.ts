import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import type { Analytics } from "firebase/analytics";
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getInstallations } from "firebase/installations";

// Firebase web API keys are public by design — security is enforced via
// Firebase Security Rules, not by keeping these values secret.
// See: https://firebase.google.com/docs/projects/api-keys
//
// Values are read from VITE_FIREBASE_* environment variables (injected at
// build time by GitHub Actions / Cloudflare Pages via repository secrets).
// The hardcoded fallbacks match frontend/.env.example and keep local dev
// working without a .env file.  In production the secrets MUST be set so
// the correct apiKey is embedded; the fallback is only a last resort.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "a-ki-pri-sa-ye",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "a-ki-pri-sa-ye.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "187272078809",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:187272078809:web:501d916973a75edb06e5c8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-W0R1B4HHE1",
};

// Detect missing VITE_FIREBASE_* secrets so diagnostic pages (Login, StatutPage)
// can warn operators.  Vite replaces `import.meta.env.*` at build time: an empty
// string means the secret was not set in GitHub Actions / Cloudflare Pages.
const missingCriticalEnvKeys: string[] = (
  [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_APP_ID",
  ] as const
).filter((k) => !import.meta.env[k as keyof ImportMetaEnv]);

// Detect the historically wrong API key (transposed characters at indices 10–11
// vs the GCP-registered key: wrong key has 'B8', correct key has '8B').
// This guard is belt-and-suspenders: CI already refuses to build with this key,
// but if somehow it reaches the browser it surfaces a clear, actionable message
// instead of a cryptic "API_KEY_INVALID" Firebase error.
// Individual charAt() checks are used deliberately — static string concatenation
// of the wrong key would be constant-folded by the bundler (esbuild/Vite) into
// a single literal in the output bundle, which would trigger false positives in
// bundle validation scripts that search for the wrong key string.
const wrongApiKeyDetected: boolean =
  typeof firebaseConfig.apiKey === "string" &&
  firebaseConfig.apiKey.length === 39 &&
  firebaseConfig.apiKey.charAt(10) === "B" && // wrong key: 'B' here; correct key: '8'
  firebaseConfig.apiKey.charAt(11) === "8";   // wrong key: '8' here; correct key: 'B'

let firebaseError: string | null = null;
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

function safeInitInstallations(appInstance: FirebaseApp): void {
  const init = () => {
    try {
      getInstallations(appInstance);
    } catch (error) {
      console.warn("Firebase Installations unavailable (non-blocking):", error);
    }
  };

  if (typeof window === "undefined") return;
  const win = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, opts?: IdleRequestOptions) => number;
  };
  if (typeof win.requestIdleCallback === "function") {
    win.requestIdleCallback(init, { timeout: 5_000 });
    return;
  }
  setTimeout(init, 2_000);
}

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  void setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn("Firebase Auth persistence fallback (local) unavailable:", error);
  });
  db = getFirestore(app);
  safeInitInstallations(app);
  // Analytics requires a real browser environment and a valid measurementId.
  // Load the analytics module lazily so Node/Vitest contexts never evaluate
  // firebase/analytics internals that assume window/document are available.
  if (typeof window !== "undefined" && typeof document !== "undefined" && firebaseConfig.measurementId) {
    void import("firebase/analytics")
      .then(async ({ getAnalytics, isSupported }) => {
        if (!app) return;
        const supported = await isSupported().catch(() => false);
        if (!supported) return;
        analytics = getAnalytics(app);
      })
      .catch((error) => {
        console.warn("Firebase analytics unavailable:", error);
      });
  }
} catch (error) {
  firebaseError = error instanceof Error ? error.message : "Unknown Firebase initialization error";
  console.error("Firebase initialization failed:", firebaseError);
}

export { app, auth, db, analytics, firebaseError, firebaseConfig, missingCriticalEnvKeys, wrongApiKeyDetected };
