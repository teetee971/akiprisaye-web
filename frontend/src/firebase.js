import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Required Firebase configuration for core services (Auth + Firestore)
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

// Optional Firebase configuration values
const optionalEnvVars = {
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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
