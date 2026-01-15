// ─────────────────────────────────────────────
// Firebase configuration + Lazy Loading Modules
// Projet : A KI PRI SA YÉ
// ─────────────────────────────────────────────

// Firebase config - centralized configuration
const firebaseConfig = {
  apiKey: "AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY",
  authDomain: "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: "a-ki-pri-sa-ye",
  storageBucket: "a-ki-pri-sa-ye.firebasestorage.app",
  messagingSenderId: "187272078809",
  appId: "1:187272078809:web:110a92e34493ef4506e5c8",
  measurementId: "G-NFHCZTLPDM"
};

// Instances uniques
let appInstance = null;
let dbInstance = null;

/**
 * Initialise Firebase App (lazy)
 */
async function getApp() {
  if (!appInstance) {
    const { initializeApp } = await import(
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
    );
    appInstance = initializeApp(firebaseConfig);
  }
  return appInstance;
}

/**
 * Initialise Firestore (lazy)
 */
export async function getDB() {
  if (!dbInstance) {
    const app = await getApp();
    const { getFirestore } = await import(
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
    );
    dbInstance = getFirestore(app);
  }
  return dbInstance;
}

/**
 * Exporte aussi les primitives Firestore
 */
export async function loadFirestore() {
  return import(
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
  );
}

export default firebaseConfig;