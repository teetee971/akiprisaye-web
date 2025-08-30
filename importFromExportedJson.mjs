import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './a-ki-pri-sa-ye-firebase-adminsdk-fbsvc-066c7f1bb2.json' assert { type: 'json' };
import fs from 'fs';

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function exportModulesToFile() {
  const snapshot = await db.collection('modules').get();
  const modules = [];

  snapshot.forEach(doc => {
    modules.push({ id: doc.id, ...doc.data() });
  });

  fs.writeFileSync('modules_exported.json', JSON.stringify(modules, null, 2));
  console.log('✅ Export terminé. Données sauvegardées dans modules_exported.json');
}

exportModulesToFile().catch(console.error);