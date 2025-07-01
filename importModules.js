
import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, setDoc
} from "firebase/firestore";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "TA_CLE_API",
  authDomain: "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: "a-ki-pri-sa-ye",
  storageBucket: "a-ki-pri-sa-ye.appspot.com",
  messagingSenderId: "XXXXXX",
  appId: "APP_ID"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Importation des modules
const modules = [
  {
    "id": "1",
    "nom": "Module 1",
    "description": "Description du module 1.",
    "actif": true,
    "cat\u00e9gorie": "Analyse de prix"
  },
  {
    "id": "2",
    "nom": "Module 2",
    "description": "Description du module 2.",
    "actif": true,
    "cat\u00e9gorie": "Service"
  },
  {
    "id": "3",
    "nom": "Module 3",
    "description": "Description du module 3.",
    "actif": true,
    "cat\u00e9gorie": "Analyse de prix"
  },
  {
    "id": "4",
    "nom": "Module 4",
    "description": "Description du module 4.",
    "actif": true,
    "cat\u00e9gorie": "Service"
  },
  {
    "id": "5",
    "nom": "Module 5",
    "description": "Description du module 5.",
    "actif": true,
    "cat\u00e9gorie": "Analyse de prix"
  },
  {
    "id": "6",
    "nom": "Module 6",
    "description": "Description du module 6.",
    "actif": true,
    "cat\u00e9gorie": "Service"
  },
  {
    "id": "7",
    "nom": "Module 7",
    "description": "Description du module 7.",
    "actif": true,
    "cat\u00e9gorie": "Analyse de prix"
  },
  {
    "id": "8",
    "nom": "Module 8",
    "description": "Description du module 8.",
    "actif": true,
    "cat\u00e9gorie": "Service"
  },
  {
    "id": "9",
    "nom": "Module 9",
    "description": "Description du module 9.",
    "actif": true,
    "cat\u00e9gorie": "Analyse de prix"
  },
  {
    "id": "10",
    "nom": "Module 10",
    "description": "Description du module 10.",
    "actif": true,
    "cat\u00e9gorie": "Service"
  },
  {
    "id": "11",
    "nom": "Module 11",
    "description": "Description du module 11.",
    "actif": true,
    "cat\u00e9gorie": "Analyse de prix"
  },
  {
    "id": "12",
    "nom": "Module 12",
    "description": "Description du module 12.",
    "actif": true,
    "cat\u00e9gorie": "Service"
  },
  {
    "id": "13",
    "nom": "Module 13",
    "description": "Description du module 13.",
    "actif": true,
    "cat\u00e9gorie": "Analyse de prix"
  },
  {
    "id": "14",
    "nom": "Module 14",
    "description": "Description du module 14.",
    "actif": true,
    "cat\u00e9gorie": "Service"
  },
  {
    "id": "15",
    "nom": "Module 15",
    "description": "Description du module 15.",
    "actif": true,
    "cat\u00e9gorie": "Analyse de prix"
  }
];

async function importData() {
  for (const module of modules) {
    const ref = doc(db, "modules", module.nom);
    await setDoc(ref, module);
  }
  console.log("✅ Modules importés !");
}

importData().catch(console.error);
