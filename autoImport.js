const fs = require("fs");
const path = require("path");
const cron = require("node-cron");

const dataDir = path.join(__dirname, "data");
const logFile = path.join(__dirname, "import.log");

function importData() {
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));
  let log = `\n--- Import du ${new Date().toISOString()} ---\n`;

  files.forEach(file => {
    const content = JSON.parse(fs.readFileSync(path.join(dataDir, file)));
    log += `✔ Import ${file} → ${content.length} produits\n`;
  });

  fs.appendFileSync(logFile, log);
  console.log("✅ Import terminé, log mis à jour.");
}

// Lancer toutes les 15 min
cron.schedule("*/15 * * * *", importData);

// Lancer au démarrage
importData();
