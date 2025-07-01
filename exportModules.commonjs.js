
const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = require("./serviceAccountKey.json"); // Remplacer par ton fichier de clé

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://a-ki-pri-sa-ye.firebaseio.com"
});

const db = admin.firestore();

async function exportModules() {
  const snapshot = await db.collection("modules").get();
  const modules = [];

  snapshot.forEach(doc => {
    modules.push({ id: doc.id, ...doc.data() });
  });

  fs.writeFileSync("modules_export.json", JSON.stringify(modules, null, 2));
  console.log("✅ Modules exportés dans modules_export.json");
}

exportModules().catch(console.error);
