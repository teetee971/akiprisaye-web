#!/usr/bin/env node

/**
 * A KI PRI SA YÉ - Add Observation
 * 
 * Ajoute une nouvelle observation depuis un fichier JSON
 * Usage: node scripts/add-observation.js <input-file.json>
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OBSERVATIONS_DIR = join(__dirname, '..', 'data', 'observations');

/**
 * Validation simple sans dépendances externes
 * Réplique la logique de validation de src/schemas/observation.ts
 */
function validateObservation(obj) {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    errors.push('L\'observation doit être un objet');
    return errors;
  }

  // Territoire
  const territoiresValides = [
    'Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte',
    'Saint-Pierre-et-Miquelon', 'Saint-Barthélemy', 'Saint-Martin',
    'Wallis-et-Futuna', 'Polynésie française', 'Nouvelle-Calédonie',
    'Terres australes et antarctiques françaises', 'Hexagone'
  ];
  if (!territoiresValides.includes(obj.territoire)) {
    errors.push(`Le champ "territoire" doit être l'un des suivants: ${territoiresValides.join(', ')}`);
  }

  // Commune
  if (typeof obj.commune !== 'string' || obj.commune.trim().length === 0) {
    errors.push('Le champ "commune" est requis et doit être une chaîne non vide');
  }

  // Enseigne
  if (typeof obj.enseigne !== 'string' || obj.enseigne.trim().length === 0) {
    errors.push('Le champ "enseigne" est requis et doit être une chaîne non vide');
  }

  // Date (format YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (typeof obj.date !== 'string' || !dateRegex.test(obj.date)) {
    errors.push('Le champ "date" doit être au format YYYY-MM-DD');
  }

  // Heure (format HH:MM:SS)
  const heureRegex = /^\d{2}:\d{2}:\d{2}$/;
  if (typeof obj.heure !== 'string' || !heureRegex.test(obj.heure)) {
    errors.push('Le champ "heure" doit être au format HH:MM:SS');
  }

  // Produits
  if (!Array.isArray(obj.produits) || obj.produits.length === 0) {
    errors.push('Le champ "produits" doit être un tableau non vide');
  } else {
    obj.produits.forEach((produit, index) => {
      if (typeof produit !== 'object') {
        errors.push(`Le produit à l'index ${index} doit être un objet`);
        return;
      }

      if (typeof produit.nom !== 'string' || produit.nom.trim().length === 0) {
        errors.push(`Le produit à l'index ${index} doit avoir un "nom" (chaîne non vide)`);
      }

      if (typeof produit.quantite !== 'number' || produit.quantite <= 0) {
        errors.push(`Le produit à l'index ${index} doit avoir une "quantite" positive`);
      }

      if (typeof produit.prix_unitaire !== 'number' || produit.prix_unitaire < 0) {
        errors.push(`Le produit à l'index ${index} doit avoir un "prix_unitaire" >= 0`);
      }

      if (typeof produit.prix_total !== 'number' || produit.prix_total < 0) {
        errors.push(`Le produit à l'index ${index} doit avoir un "prix_total" >= 0`);
      }
    });
  }

  // Total TTC
  if (typeof obj.total_ttc !== 'number' || obj.total_ttc < 0) {
    errors.push('Le champ "total_ttc" doit être un nombre >= 0');
  }

  return errors;
}

/**
 * Normalise une chaîne pour l'utiliser dans un ID
 * @param {string} str - Chaîne à normaliser
 * @returns {string} Chaîne normalisée
 */
function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Génère un ID unique basé sur date + commune + enseigne + magasin + timestamp
 */
function generateId(observation) {
  const date = observation.date;
  const commune = normalizeString(observation.commune);
  const enseigne = normalizeString(observation.enseigne);
  const magasinPart = observation.magasin_id ? `-${observation.magasin_id}` : '';
  
  // Ajouter un timestamp court pour éviter les collisions
  const timestamp = Date.now().toString(36).slice(-4);
  
  return `${date}-${commune}-${enseigne}${magasinPart}-${timestamp}`;
}

/**
 * Régénère l'index en appelant le script generate-index.js
 */
function regenerateIndex() {
  return new Promise((resolve, reject) => {
    const generateScript = join(__dirname, 'generate-index.js');
    const child = spawn('node', [generateScript], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`generate-index.js exited with code ${code}`));
      }
    });
  });
}

async function addObservation() {
  try {
    // Vérifier l'argument fichier
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('❌ Usage: node scripts/add-observation.js <input-file.json>');
      process.exit(1);
    }

    const inputFile = args[0];
    console.log(`📂 Reading input file: ${inputFile}`);

    // Charger le fichier JSON
    const content = await readFile(inputFile, 'utf-8');
    const data = JSON.parse(content);

    // Valider l'observation
    console.log('🔍 Validating observation...');
    const errors = validateObservation(data);
    
    if (errors.length > 0) {
      console.error('❌ Validation errors:');
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }

    console.log('✅ Validation passed');

    // Générer ID si absent
    if (!data.id) {
      data.id = generateId(data);
      console.log(`🆔 Generated ID: ${data.id}`);
    }

    // Ajouter created_at si absent
    if (!data.created_at) {
      data.created_at = new Date().toISOString();
      console.log(`⏰ Generated created_at: ${data.created_at}`);
    }

    // S'assurer que source et fiabilité sont corrects
    data.source = 'ticket_caisse';
    data.fiabilite = 'preuve_physique';

    // S'assurer que verifie est false par défaut
    if (data.verifie === undefined) {
      data.verifie = false;
    }

    // Écrire le fichier d'observation
    const outputFile = join(OBSERVATIONS_DIR, `${data.id}.json`);
    await writeFile(outputFile, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`✨ Observation saved: ${outputFile}`);

    // Régénérer l'index
    console.log('📊 Regenerating index...');
    await regenerateIndex();

    console.log('');
    console.log('✅ Success! Observation added and index updated.');
    console.log('📍 Details:');
    console.log(`   - ID: ${data.id}`);
    console.log(`   - Date: ${data.date} ${data.heure}`);
    console.log(`   - Commune: ${data.commune}`);
    console.log(`   - Enseigne: ${data.enseigne}`);
    console.log(`   - Products: ${data.produits.length}`);
    console.log(`   - Total TTC: ${data.total_ttc}€`);

  } catch (error) {
    console.error('❌ Error adding observation:', error.message);
    process.exit(1);
  }
}

// Exécution
addObservation();
