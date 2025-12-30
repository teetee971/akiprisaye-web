import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyBfQGLocAqVPNyk2w2Jyi0Pbej-Lz8tSYU',
  authDomain: 'a-ki-pri-sa-ye.firebaseapp.com',
  projectId: 'a-ki-pri-sa-ye',
  storageBucket: 'a-ki-pri-sa-ye.firebasestorage.app',
  messagingSenderId: '187272078809',
  appId: '1:187272078809:android:a2841196fcd9735306e5c8',
};

// Initialiser tous les services Firebase comme null par défaut
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
  console.log(' Firebase initialisé avec succès');
} catch (error) {
  console.warn(' Firebase désactivé - l\'application fonctionne sans backend:', error.code || error.message);
  // Les services restent null - l'app continuera de fonctionner
}

// Exporter tous les services (null si échec)
export { app, auth, db, storage, functions };
