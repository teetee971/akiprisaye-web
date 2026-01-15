// Re-export from centralized Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

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
let storage = null;
let functions = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);
  if (import.meta.env.DEV) {
    console.warn('✅ Firebase initialisé avec succès');
  }
} catch (error) {
  console.warn('⚠️ Firebase désactivé - l\'application fonctionne sans backend:', error.code || error.message);
  // Les services restent null - l'app continuera de fonctionner
}

// Exporter tous les services (null si échec)
export { app, auth, db, storage, functions };
