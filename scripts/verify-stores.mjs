import fs from "fs";

console.log("🔎 Vérification stores.json…");

const raw = fs.readFileSync("./stores.json", "utf8");
const stores = JSON.parse(raw);

let errors = 0;
let seenNames = new Set();

stores.forEach((s, i) => {
  if (seenNames.has(s.name)) {
    console.log(`❌ Doublon détecté: ${s.name}`);
    errors++;
  }
  seenNames.add(s.name);

  if (!s.name || !s.city || !s.territory) {
    console.log(`❌ Données manquantes (index ${i}):`, s);
    errors++;
  }
});

console.log(errors === 0 ? "✔ OK : Aucun problème détecté." : `❌ ${errors} erreurs trouvées.`);
process.exit(errors > 0 ? 1 : 0);
