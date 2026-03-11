import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Firebase web API keys are public by design — security is enforced via
// Firebase Security Rules, not by keeping these values secret.
// See: https://firebase.google.com/docs/projects/api-keys
//
// Values are hardcoded here to prevent deployment issues where incorrect
// environment variable secrets could override the correct fallback values.
const firebaseConfig = {
  apiKey: "AIzaSyDf_mB8zMWHFwoFhVLyThuKWMTmhB7uSZY",
  authDomain: "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: "a-ki-pri-sa-ye",
  storageBucket: "a-ki-pri-sa-ye.firebasestorage.app",
  messagingSenderId: "187272078809",
  appId: "1:187272078809:web:110a9e34493ef4506e5c8",
  measurementId: "G-NFHCZTLPDM",
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
