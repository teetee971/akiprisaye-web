/**
 * Script de Validation des Données
 * 
 * Valide que tous les fichiers JSON de données respectent les règles strictes:
 * - Champs obligatoires présents
 * - Aucune valeur numérique sans source
 * - Format dates ISO valide
 * - URLs sources valides
 * - Statut cohérent avec valeurs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Codes de sortie
const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;

// Compteurs
let filesChecked = 0;
let filesValid = 0;
let filesFailed = 0;
let totalErrors = 0;

/**
 * Valide le format d'une date ISO
 */
function isValidISODate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}/);
}

/**
 * Valide le format d'une URL
 */
function isValidURL(urlString) {
  if (!urlString) return false;
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Valide un fichier de données
 */
function validateDataFile(filePath) {
  console.log(`\n📄 Validation: ${filePath}`);
  filesChecked++;

  const errors = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // 1. Vérifier champs obligatoires de base
    const requiredFields = ['territoire', 'organisme_source', 'donnees'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`❌ Champ obligatoire manquant: ${field}`);
      }
    }

    // 2. Vérifier URL source si présente
    if (data.url_source && !isValidURL(data.url_source)) {
      errors.push(`❌ URL source invalide: ${data.url_source}`);
    }

    // 3. Vérifier date de publication si présente
    if (data.date_publication && data.date_publication !== null && !isValidISODate(data.date_publication)) {
      errors.push(`❌ Date publication invalide: ${data.date_publication}`);
    }

    // 4. Valider chaque donnée
    if (Array.isArray(data.donnees)) {
      data.donnees.forEach((item, index) => {
        const itemPath = `donnees[${index}]`;

        // Vérifier champs obligatoires de la donnée
        if (!item.intitule && !item.intitule_officiel) {
          errors.push(`❌ ${itemPath}: Intitulé manquant`);
        }

        if (!item.unite) {
          errors.push(`⚠️  ${itemPath}: Unité non spécifiée (recommandé)`);
        }

        // RÈGLE CRITIQUE: Si valeur numérique présente, DOIT avoir source et statut valide
        if (item.valeur !== null && item.valeur !== undefined) {
          if (!item.statut || item.statut === 'non_disponible') {
            errors.push(`❌ ${itemPath}: Valeur présente mais statut "non_disponible" - INCOHÉRENCE`);
          }

          if (!item.source && !item.source_exacte && !data.organisme_source) {
            errors.push(`❌ ${itemPath}: Valeur numérique sans source - INTERDIT`);
          }

          if (item.date_observation && !isValidISODate(item.date_observation)) {
            errors.push(`❌ ${itemPath}: Date observation invalide`);
          }
        }

        // RÈGLE: Si statut "non_disponible", valeur DOIT être null
        if (item.statut === 'non_disponible' && item.valeur !== null) {
          errors.push(`❌ ${itemPath}: Statut "non_disponible" mais valeur présente - DOIT être null`);
        }

        // Vérifier cohérence des sources
        if (item.lien_direct && !isValidURL(item.lien_direct)) {
          errors.push(`❌ ${itemPath}: Lien direct invalide`);
        }
      });
    } else {
      errors.push('❌ "donnees" doit être un tableau');
    }

    // 5. Vérifier métadonnées Open Data
    if (data.statut_global && data.statut_global !== 'EN_ATTENTE_DONNEES_OFFICIELLES' && data.statut_global !== 'OFFICIEL') {
      errors.push(`⚠️  Statut global inconnu: ${data.statut_global}`);
    }

    if (data.licence && !data.licence.includes('Open Data') && !data.licence.includes('Données publiques')) {
      errors.push(`⚠️  Licence non standard: ${data.licence}`);
    }

  } catch (error) {
    errors.push(`❌ Erreur de parsing JSON: ${error.message}`);
  }

  // Afficher résultat
  if (errors.length === 0) {
    console.log('✅ Fichier valide');
    filesValid++;
  } else {
    console.log(`❌ ${errors.length} erreur(s) trouvée(s):`);
    errors.forEach(err => console.log(`   ${err}`));
    filesFailed++;
    totalErrors += errors.length;
  }

  return errors.length === 0;
}

/**
 * Trouve récursivement tous les fichiers JSON de données
 */
function findDataFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorer node_modules, dist, .git
      if (!['node_modules', 'dist', '.git', 'public'].includes(file)) {
        findDataFiles(filePath, fileList);
      }
    } else if (file.endsWith('.json') && !file.includes('package')) {
      // Vérifier si c'est dans src/data/
      if (filePath.includes('src/data/') || filePath.includes('src\\data\\')) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Main
 */
async function main() {
  console.log('🔍 A KI PRI SA YÉ - Validation des Données\n');
  console.log('📋 RÈGLES STRICTES:');
  console.log('   1. Aucune valeur numérique sans source');
  console.log('   2. Si statut="non_disponible", valeur DOIT être null');
  console.log('   3. Dates au format ISO (YYYY-MM-DD)');
  console.log('   4. URLs sources valides (https://)');
  console.log('   5. Champs obligatoires présents\n');

  const dataDir = path.join(__dirname, '..', 'src', 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.error('❌ Répertoire src/data/ introuvable');
    process.exit(EXIT_FAILURE);
  }

  const dataFiles = findDataFiles(dataDir);

  if (dataFiles.length === 0) {
    console.log('⚠️  Aucun fichier JSON trouvé dans src/data/');
    process.exit(EXIT_SUCCESS);
  }

  console.log(`📂 ${dataFiles.length} fichier(s) de données trouvé(s)\n`);

  // Valider chaque fichier
  dataFiles.forEach(validateDataFile);

  // Rapport final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT FINAL');
  console.log('='.repeat(60));
  console.log(`Fichiers vérifiés: ${filesChecked}`);
  console.log(`Fichiers valides:  ${filesValid} ✅`);
  console.log(`Fichiers invalides: ${filesFailed} ❌`);
  console.log(`Erreurs totales:   ${totalErrors}`);
  console.log('='.repeat(60));

  if (filesFailed > 0) {
    console.log('\n❌ VALIDATION ÉCHOUÉE');
    console.log('   Corrigez les erreurs avant de déployer.');
    process.exit(EXIT_FAILURE);
  } else {
    console.log('\n✅ VALIDATION RÉUSSIE');
    console.log('   Toutes les données respectent les règles strictes.');
    process.exit(EXIT_SUCCESS);
  }
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateDataFile, isValidISODate, isValidURL };
