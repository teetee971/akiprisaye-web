
// exportModules.configured.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

// Configuration Firebase de ton projet
const firebaseConfig = {
  apiKey: "AIzaSyD*******************", // Remplace avec tes vraies clés si besoin
  authDomain: "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: "a-ki-pri-sa-ye",
  storageBucket: "a-ki-pri-sa-ye.appspot.com",
  messagingSenderId: "************",
  appId: "1:************:web:****************",
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fonction d'export
async function exportModules() {
  const modulesCol = collection(db, "modules");
  const snapshot = await getDocs(modulesCol);
  const modules = snapshot.docs.map((doc) => doc.data());

  fs.writeFileSync("modules_export.json", JSON.stringify(modules, null, 2));
  console.log("✅ Modules exportés dans 'modules_export.json'");
}

exportModules().catch(console.error);
