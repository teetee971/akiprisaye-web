/**
 * Script de Validation des Données Observatoire
 * 
 * Valide que les fichiers JSON de l'observatoire respectent le schéma canonique:
 * - Champs obligatoires présents
 * - Format dates ISO valide
 * - Prix valides (positifs)
 * - Catégories valides
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

// Catégories valides
const VALID_CATEGORIES = [
  'Produits laitiers',
  'Fruits et légumes',
  'Viandes et poissons',
  'Épicerie',
  'Boissons',
  'Hygiène et beauté',
  'Entretien',
  'Bébé',
  'Autres'
];

// Territoires valides
const VALID_TERRITORIES = [
  'Guadeloupe',
  'Martinique',
  'Guyane',
  'La Réunion',
  'Mayotte',
  'Saint-Pierre-et-Miquelon',
  'Saint-Barthélemy',
  'Saint-Martin',
  'Wallis-et-Futuna',
  'Polynésie française',
  'Nouvelle-Calédonie',
  'Terres australes et antarctiques françaises',
  'Hexagone'
];

// Sources valides
const VALID_SOURCES = [
  'releve_citoyen',
  'ticket_scan',
  'donnee_ouverte',
  'releve_terrain',
  'api_publique'
];

// Niveaux de qualité valides
const VALID_QUALITY = ['verifie', 'probable', 'a_verifier'];

/**
 * Valide le format d'une date ISO
 */
function isValidISODate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}/);
}

/**
 * Valide un fichier de données observatoire
 */
function validateObservatoireFile(filePath) {
  console.log(`\n📄 Validation: ${filePath}`);
  filesChecked++;

  const errors = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // 1. Vérifier champs obligatoires de base
    const requiredFields = ['territoire', 'date_snapshot', 'source', 'qualite', 'donnees'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`❌ Champ obligatoire manquant: ${field}`);
      }
    }

    // 2. Valider territoire
    if (data.territoire && !VALID_TERRITORIES.includes(data.territoire)) {
      errors.push(`❌ Territoire invalide: ${data.territoire}`);
    }

    // 3. Valider date snapshot
    if (data.date_snapshot && !isValidISODate(data.date_snapshot)) {
      errors.push(`❌ Date snapshot invalide: ${data.date_snapshot} (format attendu: YYYY-MM-DD)`);
    }

    // 4. Valider source
    if (data.source && !VALID_SOURCES.includes(data.source)) {
      errors.push(`❌ Source invalide: ${data.source}`);
    }

    // 5. Valider qualité
    if (data.qualite && !VALID_QUALITY.includes(data.qualite)) {
      errors.push(`❌ Qualité invalide: ${data.qualite}`);
    }

    // 6. Valider chaque donnée
    if (Array.isArray(data.donnees)) {
      if (data.donnees.length === 0) {
        errors.push(`⚠️  Aucune donnée dans le tableau`);
      }

      data.donnees.forEach((item, index) => {
        const itemPath = `donnees[${index}]`;

        // Champs obligatoires
        if (!item.produit || item.produit.trim() === '') {
          errors.push(`❌ ${itemPath}: Produit manquant ou vide`);
        }

        if (!item.categorie) {
          errors.push(`❌ ${itemPath}: Catégorie manquante`);
        } else if (!VALID_CATEGORIES.includes(item.categorie)) {
          errors.push(`❌ ${itemPath}: Catégorie invalide: ${item.categorie}`);
        }

        if (!item.unite || item.unite.trim() === '') {
          errors.push(`❌ ${itemPath}: Unité manquante`);
        }

        if (item.prix === null || item.prix === undefined) {
          errors.push(`❌ ${itemPath}: Prix manquant`);
        } else if (typeof item.prix !== 'number') {
          errors.push(`❌ ${itemPath}: Prix doit être un nombre`);
        } else if (item.prix < 0) {
          errors.push(`❌ ${itemPath}: Prix négatif non autorisé`);
        } else if (item.prix > 10000) {
          errors.push(`⚠️  ${itemPath}: Prix très élevé (${item.prix}€) - vérifier`);
        }

        // Champs optionnels mais recommandés
        if (!item.commune) {
          errors.push(`⚠️  ${itemPath}: Commune non spécifiée (recommandé)`);
        }

        if (!item.enseigne) {
          errors.push(`⚠️  ${itemPath}: Enseigne non spécifiée (recommandé)`);
        }

        // Validation EAN si présent
        if (item.ean && !/^\d{8,13}$/.test(item.ean)) {
          errors.push(`❌ ${itemPath}: Code EAN invalide: ${item.ean} (doit être 8-13 chiffres)`);
        }
      });
    } else {
      errors.push('❌ "donnees" doit être un tableau');
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
 * Main
 */
async function main() {
  console.log('🔍 A KI PRI SA YÉ - Validation des Données Observatoire\n');
  console.log('📋 RÈGLES DE VALIDATION:');
  console.log('   1. Champs obligatoires: territoire, date_snapshot, source, qualite, donnees');
  console.log('   2. Dates au format ISO (YYYY-MM-DD)');
  console.log('   3. Prix valides (positifs)');
  console.log('   4. Catégories valides');
  console.log('   5. Territoires valides\n');

  const observatoireDir = path.join(__dirname, '..', 'data', 'observatoire');
  
  if (!fs.existsSync(observatoireDir)) {
    console.error('❌ Répertoire data/observatoire/ introuvable');
    process.exit(EXIT_FAILURE);
  }

  // Trouver tous les fichiers JSON dans data/observatoire/
  const files = fs.readdirSync(observatoireDir);
  const jsonFiles = files.filter(f => f.endsWith('.json')).map(f => path.join(observatoireDir, f));

  if (jsonFiles.length === 0) {
    console.log('⚠️  Aucun fichier JSON trouvé dans data/observatoire/');
    process.exit(EXIT_SUCCESS);
  }

  console.log(`📂 ${jsonFiles.length} fichier(s) trouvé(s)\n`);

  // Valider chaque fichier
  jsonFiles.forEach(validateObservatoireFile);

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
    console.log('   Toutes les données Observatoire sont valides.');
    process.exit(EXIT_SUCCESS);
  }
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateObservatoireFile, isValidISODate };
