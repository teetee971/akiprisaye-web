import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration - all values MUST be provided via environment variables
// No fallback values to prevent credential exposure
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate all required environment variables are present
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

let app = null;
let auth = null;
let db = null;
let firebaseError = null;

if (missingVars.length > 0) {
  const errorMsg = `Missing required Firebase environment variables: ${missingVars.join(', ')}. Please configure them in .env.local`;
  console.error('🔴 Firebase Configuration Error:', errorMsg);
  firebaseError = errorMsg;
  // DO NOT throw - allow app to run without Firebase
  console.warn('⚠️ Running without Firebase authentication');
} else {
  const firebaseConfig = requiredEnvVars;

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    firebaseError = error?.message || 'Unknown Firebase initialization error';
    console.error('⚠️ Firebase initialization failed:', firebaseError);
    // DO NOT throw - allow app to continue in degraded mode
    console.warn('⚠️ Running without Firebase authentication');
  }
}

export { app, auth, db, firebaseError };
