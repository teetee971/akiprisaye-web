import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "a-ki-pri-sa-ye",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "a-ki-pri-sa-ye.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "187272078809",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:187272078809:web:110a92e34493ef4506e5c8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NFHCZTLPDM"
};

let app = null;
let auth = null;
let db = null;
let firebaseError = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  if (import.meta.env?.DEV) {
    console.warn('✅ Firebase initialized successfully');
  }
} catch (error) {
  firebaseError = error?.message || 'Unknown Firebase initialization error';
  // Only log errors in development
  if (import.meta.env?.DEV) {
    console.error('⚠️ Firebase initialization failed:', firebaseError);
  }
  // Services remain null - app will continue to function
}

export { app, auth, db, firebaseError };
