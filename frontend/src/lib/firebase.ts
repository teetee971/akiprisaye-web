import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Firebase web API keys are public by design — security is enforced via
// Firebase Security Rules, not by keeping these values secret.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAs0uisnGSK7OlrFqQPFYF6E-ctNOPY0Sw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "a-ki-pri-sa-ye",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "a-ki-pri-sa-ye.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "187272078809",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:187272078809:web:110a92e34493ef4506e5c8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NFHCZTLPDM",
};

// Kept for backward compatibility — always empty since fallback defaults are always present.
const missingCriticalEnvKeys: string[] = [];

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

export { app, auth, db, firebaseError, firebaseConfig, missingCriticalEnvKeys };
