import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBfQGoLoqFqNFMy2uv2JvIPepLtLeBSYU",
  authDomain: "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: "a-ki-pri-sa-ye",
  storageBucket: "a-ki-pri-sa-ye.appspot.com",
  messagingSenderId: "187270278809",
  appId: "1:187270278809:android:ad2191f46c07530e5e5e68"
};

let db = null;
const firebaseEnabled = import.meta.env?.VITE_FIREBASE_ENABLED === 'true';

if (firebaseEnabled) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.warn('Firebase désactivé : configuration invalide ou inaccessible', error);
  }
} else {
  console.warn('Firebase désactivé : variable VITE_FIREBASE_ENABLED non active');
}

export { db };
