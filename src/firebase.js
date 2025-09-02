// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ⚠️ Remplace les valeurs ci-dessous par TA config
// Firebase Console > Project settings (engrenage) > onglet "General" > section "Your apps" > "SDK setup and configuration" (Web)
const firebaseConfig = {
  apiKey: "TA_API_KEY",
  authDomain: "TON_PROJET.firebaseapp.com",
  projectId: "TON_PROJET",
  storageBucket: "TON_PROJET.appspot.com",
  messagingSenderId: "TON_SENDER_ID",
  appId: "TON_APP_ID",
  measurementId: "G-… (optionnel)"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;

// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ⚠️ Remplace par TES vraies infos Firebase (issues de ton projet Firebase Console)
const firebaseConfig = {
  apiKey: "TA_CLE_API",
  authDomain: "TON_PROJET.firebaseapp.com",
  projectId: "TON_PROJET",
  storageBucket: "TON_PROJET.appspot.com",
  messagingSenderId: "TON_SENDER_ID",
  appId: "TON_APP_ID"
};

// Initialisation
const app = initializeApp(firebaseConfig);

// Export Firestore
export const db = getFirestore(app);

