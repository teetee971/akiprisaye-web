import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Default Firebase config for the a-ki-pri-sa-ye project.
// Firebase web API keys are public by design — security is enforced via
// Firebase Security Rules, not by keeping these values secret.
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY",
  authDomain: "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: "a-ki-pri-sa-ye",
  storageBucket: "a-ki-pri-sa-ye.firebasestorage.app",
  messagingSenderId: "187272078809",
  appId: "1:187272078809:web:110a92e34493ef4506e5c8",
  measurementId: "G-NFHCZTLPDM",
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId,
};

const envStatus = {
  apiKeyDefined: Boolean(firebaseConfig.apiKey),
  authDomainDefined: Boolean(firebaseConfig.authDomain),
  projectIdDefined: Boolean(firebaseConfig.projectId),
  storageBucketDefined: Boolean(firebaseConfig.storageBucket),
  messagingSenderIdDefined: Boolean(firebaseConfig.messagingSenderId),
  appIdDefined: Boolean(firebaseConfig.appId),
  measurementIdDefined: Boolean(firebaseConfig.measurementId),
};

const criticalEnvKeyByStatusField: Record<keyof typeof envStatus, string> = {
  apiKeyDefined: "VITE_FIREBASE_API_KEY",
  authDomainDefined: "VITE_FIREBASE_AUTH_DOMAIN",
  projectIdDefined: "VITE_FIREBASE_PROJECT_ID",
  storageBucketDefined: "VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderIdDefined: "VITE_FIREBASE_MESSAGING_SENDER_ID",
  appIdDefined: "VITE_FIREBASE_APP_ID",
  measurementIdDefined: "VITE_FIREBASE_MEASUREMENT_ID",
};

const criticalStatusFields: Array<keyof typeof envStatus> = [
  "apiKeyDefined",
  "projectIdDefined",
  "authDomainDefined",
  "appIdDefined",
];

const missingCriticalEnvKeys = criticalStatusFields
  .filter((field) => !envStatus[field])
  .map((field) => criticalEnvKeyByStatusField[field]);

let firebaseError: string | null = null;
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (missingCriticalEnvKeys.length > 0) {
  firebaseError = `Firebase env variables missing: ${missingCriticalEnvKeys.join(", ")}`;
} else {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    firebaseError = error instanceof Error ? error.message : "Unknown Firebase initialization error";
    console.error("Firebase initialization failed:", firebaseError);
  }
}

export { app, auth, db, envStatus, firebaseError, missingCriticalEnvKeys };
