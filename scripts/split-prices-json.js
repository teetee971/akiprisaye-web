#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📊 Splitting expanded-prices.json by territory...\n');

// Lire le fichier
const filepath = 'public/data/expanded-prices.json';
if (!fs.existsSync(filepath)) {
  console.error('❌ File not found:', filepath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
console.log(`✅ Loaded ${data.length} items from expanded-prices.json`);

// Créer dossier par territoire
const outDir = 'public/data/territories';
if (! fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`✅ Created directory: ${outDir}\n`);
}

// Grouper par territoire
const byTerritory = {};

data.forEach(item => {
  const territory = item.territoire || item.territory || 'unknown';
  if (!byTerritory[territory]) {
    byTerritory[territory] = [];
  }
  byTerritory[territory]. push(item);
});

console.log(`📊 Found ${Object.keys(byTerritory).length} territories\n`);

// Sauvegarder chaque territoire
let totalSize = 0;
Object.entries(byTerritory).forEach(([territory, items]) => {
  const filename = territory.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.json';
  const filepath = path.join(outDir, filename);
  
  // Minified JSON (pas de whitespace)
  fs.writeFileSync(filepath, JSON.stringify(items));
  
  const sizeBytes = fs.statSync(filepath).size;
  const sizeKB = (sizeBytes / 1024).toFixed(1);
  totalSize += sizeBytes;
  
  console. log(`  ✅ ${territory. padEnd(30)} → ${filename.padEnd(35)} (${items.length. toString().padStart(5)} items, ${sizeKB. padStart(6)} KB)`);
});

// Créer index
const index = {
  territories: Object.keys(byTerritory).sort().map(t => ({
    name: t,
    code: t.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    file: `territories/${t.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`,
    count: byTerritory[t].length
  })),
  totalItems: data.length,
  territoriesCount: Object.keys(byTerritory).length,
  generated: new Date().toISOString()
};

fs.writeFileSync(
  'public/data/territories-index.json',
  JSON.stringify(index, null, 2)
);

console.log(`\n📊 Summary:`);
console.log(`  - Total items:         ${data.length. toLocaleString()}`);
console.log(`  - Territories:        ${Object.keys(byTerritory).length}`);
console.log(`  - Original size:      2.3 MB`);
console.log(`  - Split total size:   ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`  - Average per file:   ${(totalSize / Object.keys(byTerritory).length / 1024).toFixed(1)} KB`);
console.log(`  - Reduction per load: ${((1 - (totalSize / Object.keys(byTerritory).length) / (2.3 * 1024 * 1024)) * 100).toFixed(1)}%`);
console.log(`\n✅ Split completed!`);
console.log(`✅ Index created: public/data/territories-index.json\n`);
