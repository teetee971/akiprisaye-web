#!/usr/bin/env node
/**
 * Script de signature des datasets publics
 * Génère une preuve d'intégrité cryptographique
 * 
 * Usage:
 *   node signData.mjs <input-file> <output-proof-file> [metadata]
 * 
 * Exemple:
 *   node signData.mjs data/prix-gp-2026-01.json data/prix-gp-2026-01.proof.json '{"territoire":"Guadeloupe","periode":"2026-01"}'
 */

import fs from 'fs';
import path from 'path';
import { generateProof } from './dataIntegrity.mjs';

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node signData.mjs <input-file> <output-proof-file> [metadata-json]');
    console.error('');
    console.error('Exemple:');
    console.error('  node signData.mjs data/prix.json data/prix.proof.json \'{"territoire":"Guadeloupe"}\'');
    process.exit(1);
  }
  
  const [inputFile, outputFile, metadataJson] = args;
  
  // Lire les données
  console.log(`📖 Lecture des données: ${inputFile}`);
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Fichier introuvable: ${inputFile}`);
    process.exit(1);
  }
  
  const dataContent = fs.readFileSync(inputFile, 'utf8');
  const data = JSON.parse(dataContent);
  
  // Parser les métadonnées
  let metadata = {};
  if (metadataJson) {
    try {
      metadata = JSON.parse(metadataJson);
    } catch {
      console.error(`❌ Métadonnées JSON invalides: ${metadataJson}`);
      process.exit(1);
    }
  }
  
  // Extraire le nom du fichier comme nom du dataset
  if (!metadata.nom) {
    metadata.nom = path.basename(inputFile, path.extname(inputFile));
  }
  
  // Générer la preuve
  console.log(`🔐 Génération de la preuve d'intégrité...`);
  const proof = generateProof(data, metadata);
  
  // Sauvegarder la preuve
  const proofContent = JSON.stringify(proof, null, 2);
  fs.writeFileSync(outputFile, proofContent, 'utf8');
  
  console.log(`✅ Preuve générée avec succès`);
  console.log(`📄 Hash: ${proof.hash}`);
  console.log(`⏰ Timestamp: ${proof.timestamp}`);
  console.log(`💾 Fichier de preuve: ${outputFile}`);
  
  // Afficher des informations utiles
  if (metadata.territoire) {
    console.log(`🗺️  Territoire: ${metadata.territoire}`);
  }
  if (metadata.periode) {
    console.log(`📅 Période: ${metadata.periode}`);
  }
  
  console.log('');
  console.log('Pour vérifier l\'intégrité des données:');
  console.log(`  node verifyData.mjs ${inputFile} ${outputFile}`);
}

main().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
