import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import type { Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const missingCriticalEnvKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
].filter((k) => !import.meta.env[k]);

const wrongApiKeyDetected = typeof firebaseConfig.apiKey === "string" && 
  firebaseConfig.apiKey.length === 39 && 
  firebaseConfig.apiKey.charAt(10) === "B" && 
  firebaseConfig.apiKey.charAt(11) === "8";

let firebaseError: string | null = null;
let app: any = null;
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
  
  // 🔥 L'ULTIMATUM : On active la mémoire du navigateur ici
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Erreur persistance Firebase:", err);
  });

  if (typeof window !== "undefined" && typeof document !== "undefined" && firebaseConfig.measurementId) {
    import("firebase/analytics").then(({ getAnalytics }) => {
      if (!app) return;
      analytics = getAnalytics(app);
    }).catch((error) => {
      console.warn("Firebase analytics unavailable:", error);
    });
  }
} catch (error) {
  firebaseError = error instanceof Error ? error.message : "Unknown Firebase initialization error";
  console.error("Firebase initialization failed:", firebaseError);
}

export { app, auth, db, analytics, firebaseError, firebaseConfig, missingCriticalEnvKeys, wrongApiKeyDetected };
