
// importFromExportedJson.js

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './a-ki-pri-sa-ye-firebase-adminsdk-fbsvc-066c7f1bb2.json' assert { type: 'json' };
import fs from 'fs';

// Initialiser Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function importModules() {
  const data = JSON.parse(fs.readFileSync('./modules_export.json', 'utf8'));
  const batch = db.batch();

  Object.entries(data).forEach(([docId, fields]) => {
    const ref = db.collection('modules').doc(docId);
    batch.set(ref, fields);
  });

  await batch.commit();
  console.log('✅ Données importées avec succès depuis modules_export.json');
}

importModules().catch(console.error);
