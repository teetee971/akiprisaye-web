// firebase-config.js
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
  apiKey: 'AIzaSyD7d0B1Y4AkiPriSaYeWeb',
  authDomain: 'a-ki-pri-sa-ye.firebaseapp.com',
  projectId: 'a-ki-pri-sa-ye',
  storageBucket: 'a-ki-pri-sa-ye.appspot.com',
  messagingSenderId: '1099999999999',
  appId: '1:1099999999999:web:akiprisayeweb',
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