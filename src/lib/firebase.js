// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBfQGoLoqFqNFMy2uv2JvIPepLtLeBSYU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'a-ki-pri-sa-ye.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'a-ki-pri-sa-ye',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'a-ki-pri-sa-ye.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '187270278809',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:187270278809:android:ad2191f46c07530e5e5e68',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
