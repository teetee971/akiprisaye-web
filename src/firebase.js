// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AlzaSyBfQGLocAqVPNyk2w2Jyi0Pbej-Lz8tSYU",   // Clé API Web (vue dans ton écran)
  authDomain: "a-ki-pri-sa-ye.firebaseapp.com",       // Toujours ce format
  projectId: "a-ki-pri-sa-ye",                        // ID du projet
  storageBucket: "a-ki-pri-sa-ye.appspot.com",        // Toujours ce format
  messagingSenderId: "187272078809",                  // Numéro du projet
  appId: "1:187272078809:android:a2841196fcd9735306e5c8" // ID de l'application
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
