// firebase-config.js
// NOTE: Firebase web API keys are public by design — security is enforced via
// Firebase Security Rules, not by keeping this value secret.
// See: https://firebase.google.com/docs/projects/api-keys
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY",
  authDomain: "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: "a-ki-pri-sa-ye",
  storageBucket: "a-ki-pri-sa-ye.firebasestorage.app",
  messagingSenderId: "187272078809",
  appId: "1:187272078809:web:501d916973a75edb06e5c8",
  measurementId: "G-W0R1B4HHE1"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// Fonction helper demandée par plusieurs scripts
export function getDB() {
  return db;
}

export {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
};