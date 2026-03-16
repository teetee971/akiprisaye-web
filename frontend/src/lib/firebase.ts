import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

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

// Detect the historically wrong API key (transposed characters vs GCP value).
// This guard is belt-and-suspenders: CI already refuses to build with this key,
// but if somehow it reaches the browser it surfaces a clear, actionable message
// instead of a cryptic "API_KEY_INVALID" Firebase error.
const WRONG_KEY_PART_A = "AIzaSyDf_mB8z";
const WRONG_KEY_PART_B = "MWHFwoFhVLyThuKWMTmhB7uSZY";
const wrongApiKeyDetected: boolean =
  firebaseConfig.apiKey === WRONG_KEY_PART_A + WRONG_KEY_PART_B;

let firebaseError: string | null = null;
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  firebaseError = error instanceof Error ? error.message : "Unknown Firebase initialization error";
  console.error("Firebase initialization failed:", firebaseError);
}

export { app, auth, db, firebaseError, firebaseConfig, missingCriticalEnvKeys, wrongApiKeyDetected };
