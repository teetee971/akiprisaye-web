import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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

// Required Firebase configuration for core services (Auth + Firestore)
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
};

// Optional Firebase configuration values
const optionalEnvVars = {
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId,
};

// Temporary diagnostics (do not log raw secrets)
console.log('FIREBASE ENV CHECK', {
  apiKeyDefined: Boolean(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomainDefined: Boolean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectIdDefined: Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucketDefined: Boolean(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderIdDefined: Boolean(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appIdDefined: Boolean(import.meta.env.VITE_FIREBASE_APP_ID),
  measurementIdDefined: Boolean(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
});

const missingRequiredVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

const firebaseConfig = {
  ...requiredEnvVars,
  ...(optionalEnvVars.storageBucket ? { storageBucket: optionalEnvVars.storageBucket } : {}),
  ...(optionalEnvVars.messagingSenderId ? { messagingSenderId: optionalEnvVars.messagingSenderId } : {}),
  ...(optionalEnvVars.appId ? { appId: optionalEnvVars.appId } : {}),
  ...(optionalEnvVars.measurementId ? { measurementId: optionalEnvVars.measurementId } : {}),
};

let app = null;
let auth = null;
let db = null;
let firebaseError = null;

if (missingRequiredVars.length > 0) {
  const errorMsg = `Missing required Firebase environment variables: ${missingRequiredVars.join(', ')}. Please configure them in .env.local`;
  console.error('🔴 Firebase Configuration Error:', errorMsg);
  firebaseError = errorMsg;
  console.warn('⚠️ Running without Firebase authentication');
} else {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    if (!optionalEnvVars.measurementId) {
      console.warn('⚠️ Firebase Analytics disabled: VITE_FIREBASE_MEASUREMENT_ID is not defined.');
    } else if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        getAnalytics(app);
      } catch (analyticsError) {
        console.warn('⚠️ Firebase Analytics initialization failed:', analyticsError?.message || analyticsError);
      }
    }

    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    firebaseError = error?.message || 'Unknown Firebase initialization error';
    console.error('⚠️ Firebase initialization failed:', firebaseError);
    console.warn('⚠️ Running without Firebase authentication');
  }
}

export { app, auth, db, firebaseError };
