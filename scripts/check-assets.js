import fs from 'fs';

console.log('🖼️ Analyse des assets (images)…');

const files = fs.readdirSync('./images');

files.forEach(f => {
  if (!/\.(png|jpg|jpeg|webp)$/i.test(f)) {
    console.log(`⚠️ Fichier non image ignoré : ${f}`);
  }
});

console.log('✔ Analyse terminée.');
