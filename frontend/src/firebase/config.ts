// frontend/src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXX",
  authDomain: "akiprisaye-web.firebaseapp.com",
  projectId: "akiprisaye-web",
  storageBucket: "akiprisaye-web.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX",
  appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXX"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
