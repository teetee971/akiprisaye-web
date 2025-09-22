#!/usr/bin/env node

/**
 * Update Roadmap Script for A KI PRI SA YÉ
 * Automatically updates timestamps in roadmap files
 */

const fs = require('fs');
const path = require('path');

const getCurrentDateTime = () => {
  const now = new Date();
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  };
  return now.toLocaleDateString('fr-FR', options) + ' UTC';
};

const updateRoadmapFiles = () => {
  const currentDateTime = getCurrentDateTime();
  console.log(`🗓️ Mise à jour de la roadmap - ${currentDateTime}`);

  // Files to update
  const filesToUpdate = [
    {
      path: path.join(__dirname, '../ROADMAP.md'),
      pattern: /\*\*Dernière mise à jour\*\* : .+/g,
      replacement: `**Dernière mise à jour** : ${currentDateTime}`
    },
    {
      path: path.join(__dirname, '../public/roadmap.html'),
      pattern: /<strong>Dernière mise à jour :<\/strong> .+/g,
      replacement: `<strong>Dernière mise à jour :</strong> ${currentDateTime}`
    },
    {
      path: path.join(__dirname, '../src/components/RoadmapViewer.jsx'),
      pattern: /<strong>Dernière mise à jour :<\/strong> .+/g,
      replacement: `<strong>Dernière mise à jour :</strong> ${currentDateTime}`
    }
  ];

  let updatedFiles = 0;

  filesToUpdate.forEach(file => {
    if (fs.existsSync(file.path)) {
      try {
        let content = fs.readFileSync(file.path, 'utf8');
        
        if (file.pattern.test(content)) {
          content = content.replace(file.pattern, file.replacement);
          fs.writeFileSync(file.path, content, 'utf8');
          console.log(`✅ Mis à jour: ${path.basename(file.path)}`);
          updatedFiles++;
        } else {
          console.log(`⚠️  Pattern non trouvé dans: ${path.basename(file.path)}`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour de ${path.basename(file.path)}:`, error.message);
      }
    } else {
      console.log(`⚠️  Fichier non trouvé: ${file.path}`);
    }
  });

  console.log(`\n🎉 Mise à jour terminée! ${updatedFiles} fichier(s) mis à jour.`);
  
  // Update ROADMAP_MODULES.md timestamp as well
  const modulesPath = path.join(__dirname, '../ROADMAP_MODULES.md');
  if (fs.existsSync(modulesPath)) {
    try {
      let content = fs.readFileSync(modulesPath, 'utf8');
      const modulePattern = /Dernière MAJ : .+ GMT‑4 \(Guadeloupe\)/g;
      const now = new Date();
      // Convert to Guadeloupe time (GMT-4)
      const guadeloupeTime = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const moduleReplacement = `Dernière MAJ : ${guadeloupeTime.toLocaleDateString('fr-FR')} — ${guadeloupeTime.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})} GMT‑4 (Guadeloupe)`;
      
      if (modulePattern.test(content)) {
        content = content.replace(modulePattern, moduleReplacement);
        fs.writeFileSync(modulesPath, content, 'utf8');
        console.log(`✅ Mis à jour: ROADMAP_MODULES.md (heure Guadeloupe)`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la mise à jour de ROADMAP_MODULES.md:`, error.message);
    }
  }
};

// Run the update
updateRoadmapFiles();