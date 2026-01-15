#!/usr/bin/env node
/**
 * Script de vérification de l'intégrité des données
 * Compare le hash calculé avec le hash de la preuve
 * 
 * Usage:
 *   node verifyData.mjs <data-file> <proof-file>
 * 
 * Exemple:
 *   node verifyData.mjs data/prix-gp-2026-01.json data/prix-gp-2026-01.proof.json
 */

import fs from 'fs';
import { generateVerificationReport } from './dataIntegrity.mjs';

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node verifyData.mjs <data-file> <proof-file>');
    console.error('');
    console.error('Exemple:');
    console.error('  node verifyData.mjs data/prix.json data/prix.proof.json');
    process.exit(1);
  }
  
  const [dataFile, proofFile] = args;
  
  // Lire les données
  console.log(`📖 Lecture des données: ${dataFile}`);
  if (!fs.existsSync(dataFile)) {
    console.error(`❌ Fichier introuvable: ${dataFile}`);
    process.exit(1);
  }
  
  const dataContent = fs.readFileSync(dataFile, 'utf8');
  const data = JSON.parse(dataContent);
  
  // Lire la preuve
  console.log(`📖 Lecture de la preuve: ${proofFile}`);
  if (!fs.existsSync(proofFile)) {
    console.error(`❌ Fichier de preuve introuvable: ${proofFile}`);
    process.exit(1);
  }
  
  const proofContent = fs.readFileSync(proofFile, 'utf8');
  const proof = JSON.parse(proofContent);
  
  // Vérifier l'intégrité
  console.log('');
  console.log('🔍 Vérification de l\'intégrité...');
  console.log('');
  
  const report = generateVerificationReport(data, proof);
  
  // Afficher le rapport
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Statut: ${report.message}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`Algorithme: ${report.algorithme}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log('');
  console.log(`Hash calculé: ${report.hashCalcule}`);
  console.log(`Hash attendu: ${report.hashAttendu}`);
  console.log('');
  
  if (report.metadata) {
    console.log('Métadonnées:');
    Object.entries(report.metadata).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        console.log(`  ${key}: ${value}`);
      }
    });
    console.log('');
  }
  
  if (!report.valide) {
    console.error('⚠️  ATTENTION: Les données ont été modifiées!');
    console.error('');
    console.error('Cela peut indiquer:');
    console.error('  - Une altération malveillante des données');
    console.error('  - Une corruption accidentelle du fichier');
    console.error('  - Une erreur de transmission');
    console.error('');
    console.error('Ne PAS utiliser ces données avant vérification manuelle.');
    process.exit(1);
  } else {
    console.log('✅ Données certifiées - Aucune modification détectée');
    console.log('');
    console.log('Ces données sont authentiques et peuvent être utilisées en toute confiance.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
