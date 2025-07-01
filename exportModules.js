
// exportModules.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { writeFile } from "fs/promises";

// Remplace ces valeurs par celles de ton projet Firebase
const firebaseConfig = {
  apiKey: "TA_CLÉ_API",
  authDomain: "TON_PROJET.firebaseapp.com",
  projectId: "a-ki-pri-sa-ye",
  storageBucket: "TON_PROJET.appspot.com",
  messagingSenderId: "TON_SENDER_ID",
  appId: "TON_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function exportModules() {
  const snapshot = await getDocs(collection(db, "modules"));
  const modules = [];
  snapshot.forEach((doc) => {
    modules.push({ id: doc.id, ...doc.data() });
  });
  await writeFile("modules_export.json", JSON.stringify(modules, null, 2));
  console.log("✅ Modules exportés dans modules_export.json");
}

exportModules().catch(console.error);
