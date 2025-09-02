// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AlzaSyBfQGLocAqVPNyk2w2Jyi0Pbej-Lz8tSYU",
  authDomain: "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: "a-ki-pri-sa-ye",
  storageBucket: "a-ki-pri-sa-ye.appspot.com",
  messagingSenderId: "187272078809",
  appId: "1:187272078809:web:a2841196fcd9735306e5c8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
