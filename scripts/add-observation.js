#!/usr/bin/env node
/**
 * Add a new observation from a receipt ticket
 * Usage: node scripts/add-observation.js <path-to-json-file>
 * 
 * The input JSON should contain all required fields except 'id', 'created_at', and 'verifie'
 * which will be auto-generated.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validation functions (duplicated from observation.ts for standalone use without TypeScript compilation)
function validateProduct(product) {
  const errors = [];

  if (!product || typeof product !== 'object') {
    errors.push('Product must be an object');
    return errors;
  }

  if (typeof product.nom !== 'string' || product.nom.trim() === '') {
    errors.push('Product "nom" must be a non-empty string');
  }

  if (typeof product.quantite !== 'number' || product.quantite <= 0) {
    errors.push('Product "quantite" must be a positive number');
  }

  if (typeof product.prix_unitaire !== 'number' || product.prix_unitaire < 0) {
    errors.push('Product "prix_unitaire" must be a non-negative number');
  }

  if (typeof product.prix_total !== 'number' || product.prix_total < 0) {
    errors.push('Product "prix_total" must be a non-negative number');
  }

  if (typeof product.tva_pct !== 'number' || product.tva_pct < 0 || product.tva_pct > 100) {
    errors.push('Product "tva_pct" must be a number between 0 and 100');
  }

  if (product.categorie !== undefined && typeof product.categorie !== 'string') {
    errors.push('Product "categorie" must be a string if provided');
  }

  if (product.ean !== undefined && (typeof product.ean !== 'string' || !/^\d{8,13}$/.test(product.ean))) {
    errors.push('Product "ean" must be an 8-13 digit string if provided');
  }

  return errors;
}

function validateObservation(observation) {
  const errors = [];

  if (!observation || typeof observation !== 'object') {
    errors.push('Observation must be an object');
    return errors;
  }

  if (typeof observation.id !== 'string' || observation.id.trim() === '') {
    errors.push('Field "id" must be a non-empty string');
  }

  const validTerritories = [
    'Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte',
    'Saint-Pierre-et-Miquelon', 'Saint-Barthélemy', 'Saint-Martin',
    'Wallis-et-Futuna', 'Polynésie française', 'Nouvelle-Calédonie'
  ];

  if (typeof observation.territoire !== 'string' || !validTerritories.includes(observation.territoire)) {
    errors.push(`Field "territoire" must be one of: ${validTerritories.join(', ')}`);
  }

  if (typeof observation.commune !== 'string' || observation.commune.trim() === '') {
    errors.push('Field "commune" must be a non-empty string');
  }

  if (typeof observation.enseigne !== 'string' || observation.enseigne.trim() === '') {
    errors.push('Field "enseigne" must be a non-empty string');
  }

  if (observation.magasin_id !== undefined && typeof observation.magasin_id !== 'string') {
    errors.push('Field "magasin_id" must be a string if provided');
  }

  if (typeof observation.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(observation.date)) {
    errors.push('Field "date" must be in YYYY-MM-DD format');
  }

  if (typeof observation.heure !== 'string' || !/^\d{2}:\d{2}:\d{2}$/.test(observation.heure)) {
    errors.push('Field "heure" must be in HH:MM:SS format');
  }

  if (!Array.isArray(observation.produits) || observation.produits.length === 0) {
    errors.push('Field "produits" must be a non-empty array');
  } else {
    observation.produits.forEach((product, index) => {
      const productErrors = validateProduct(product);
      productErrors.forEach(err => {
        errors.push(`Product ${index + 1}: ${err}`);
      });
    });
  }

  if (typeof observation.total_ttc !== 'number' || observation.total_ttc <= 0) {
    errors.push('Field "total_ttc" must be a positive number');
  }

  if (observation.source !== 'ticket_caisse') {
    errors.push('Field "source" must be "ticket_caisse"');
  }

  if (observation.fiabilite !== 'preuve_physique') {
    errors.push('Field "fiabilite" must be "preuve_physique"');
  }

  if (typeof observation.verifie !== 'boolean') {
    errors.push('Field "verifie" must be a boolean');
  }

  if (typeof observation.created_at !== 'string' || isNaN(Date.parse(observation.created_at))) {
    errors.push('Field "created_at" must be a valid ISO 8601 timestamp');
  }

  if (observation.notes !== undefined && typeof observation.notes !== 'string') {
    errors.push('Field "notes" must be a string if provided');
  }

  return errors;
}

// Generate a unique ID
function generateId() {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
  const random = Math.random().toString(36).substring(2, 8); // Random string
  return `${date}-${time}-${random}`;
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Error: Missing input file path');
    console.error('Usage: node scripts/add-observation.js <path-to-json-file>');
    process.exit(1);
  }

  const inputFilePath = args[0];

  if (!existsSync(inputFilePath)) {
    console.error(`Error: File not found: ${inputFilePath}`);
    process.exit(1);
  }

  try {
    // Read and parse input
    const inputContent = readFileSync(inputFilePath, 'utf-8');
    const inputData = JSON.parse(inputContent);

    // Auto-generate missing fields
    if (!inputData.id) {
      inputData.id = generateId();
    }

    if (!inputData.created_at) {
      inputData.created_at = new Date().toISOString();
    }

    if (inputData.verifie === undefined) {
      inputData.verifie = false;
    }

    // Set required fields if missing
    if (!inputData.source) {
      inputData.source = 'ticket_caisse';
    }

    if (!inputData.fiabilite) {
      inputData.fiabilite = 'preuve_physique';
    }

    // Validate observation
    const errors = validateObservation(inputData);
    if (errors.length > 0) {
      console.error('Validation errors:');
      errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }

    // Create observations directory if it doesn't exist
    const observationsDir = join(__dirname, '..', 'data', 'observations');
    if (!existsSync(observationsDir)) {
      mkdirSync(observationsDir, { recursive: true });
    }

    // Write observation file
    const outputPath = join(observationsDir, `${inputData.id}.json`);
    writeFileSync(outputPath, JSON.stringify(inputData, null, 2), 'utf-8');
    console.log(`✓ Observation saved: ${outputPath}`);

    // Regenerate index
    console.log('Regenerating index...');
    execSync('node scripts/generate-index.js', { stdio: 'inherit' });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
