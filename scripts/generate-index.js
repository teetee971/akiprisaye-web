#!/usr/bin/env node

/**
 * A KI PRI SA YÉ - Generate Observations Index
 * 
 * Scanne tous les fichiers d'observations et génère un index trié
 * Usage: node scripts/generate-index.js
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OBSERVATIONS_DIR = join(__dirname, '..', 'data', 'observations');
const INDEX_FILE = join(OBSERVATIONS_DIR, 'index.json');

async function generateIndex() {
  try {
    console.log('🔍 Scanning observations directory...');
    
    // Lire tous les fichiers du répertoire
    const files = await readdir(OBSERVATIONS_DIR);
    
    // Filtrer uniquement les fichiers .json (exclure index.json et .gitkeep)
    const observationFiles = files.filter(
      file => file.endsWith('.json') && file !== 'index.json'
    );
    
    console.log(`📄 Found ${observationFiles.length} observation file(s)`);
    
    // Charger toutes les observations
    const observations = [];
    
    for (const file of observationFiles) {
      try {
        const filePath = join(OBSERVATIONS_DIR, file);
        const content = await readFile(filePath, 'utf-8');
        const observation = JSON.parse(content);
        
        // Vérifier que l'observation a les champs requis
        if (!observation.id || !observation.created_at) {
          console.warn(`⚠️  Warning: ${file} missing required fields (id or created_at)`);
          continue;
        }
        
        observations.push(observation);
      } catch (error) {
        console.error(`❌ Error loading ${file}:`, error.message);
      }
    }
    
    console.log(`✅ Loaded ${observations.length} valid observation(s)`);
    
    // Trier par created_at (décroissant - plus récent en premier)
    observations.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    });
    
    // Écrire l'index
    await writeFile(INDEX_FILE, JSON.stringify(observations, null, 2), 'utf-8');
    
    console.log(`✨ Index generated successfully: ${INDEX_FILE}`);
    console.log(`📊 Total observations: ${observations.length}`);
    
    if (observations.length > 0) {
      console.log(`📅 Latest observation: ${observations[0].date} ${observations[0].heure}`);
      console.log(`🏪 Enseigne: ${observations[0].enseigne}`);
      console.log(`📍 Commune: ${observations[0].commune}`);
    }
    
  } catch (error) {
    console.error('❌ Error generating index:', error);
    process.exit(1);
  }
}

// Exécution
generateIndex();
