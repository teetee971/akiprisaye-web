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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
