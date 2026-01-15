import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY",
  authDomain: "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: "a-ki-pri-sa-ye",
  storageBucket: "a-ki-pri-sa-ye.firebasestorage.app",
  messagingSenderId: "187272078809",
  appId: "1:187272078809:web:110a92e34493ef4506e5c8",
  measurementId: "G-NFHCZTLPDM"
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
  console.error('⚠️ Firebase initialization failed:', firebaseError);
  // Services remain null - app will continue to function
}

export { app, auth, db, firebaseError };
