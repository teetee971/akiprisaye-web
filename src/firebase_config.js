// Minimal firebase_config.ts (example)
// This file should initialize Firebase App and export `db` (Firestore instance).
// DO NOT commit real credentials (google-services.json) to a public repo.
// Place your real config locally and initialize here.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NX_FIREBASE_API_KEY || "",
  authDomain: process.env.NX_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NX_FIREBASE_PROJECT_ID || "a-ki-pri-sa-ye",
  storageBucket:
    process.env.NX_FIREBASE_STORAGE_BUCKET ||
    "a-ki-pri-sa-ye.firebasestorage.app",
  messagingSenderId: process.env.NX_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NX_FIREBASE_APP_ID || "",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);