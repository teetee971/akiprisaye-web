#!/usr/bin/env node
/**
 * Asset Integrity Checker
 * Verifies that critical assets exist and are properly referenced
 */

const fs = require('fs');
const path = require('path');

// Exit codes
const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;

// Critical assets to check
const CRITICAL_ASSETS = [
  'index.html',
  'comparateur.html',
  'comparateur-fetch.js',
  'upload-ticket.html',
  'firebase-config.js',
  'manifest.json',
  'service-worker.js'
];

// Optional assets (warnings only)
const OPTIONAL_ASSETS = [
  'functions/api/prices.js',
  'src/data/firestorePrices.js'
];

// File reference checks
const FILE_REFERENCES = [
  {
    file: 'comparateur.html',
    shouldContain: ['comparateur-fetch.js'],
    description: 'comparateur.html should reference comparateur-fetch.js'
  },
  {
    file: 'index.html',
    shouldContain: ['KI PRI SA YÉ', 'service-worker.js'],
    description: 'index.html should contain expected content'
  }
];

let hasErrors = false;
let hasWarnings = false;

console.log('🔍 Asset Integrity Check\n');
console.log('='.repeat(50));

// Check critical assets
console.log('\n📋 Checking critical assets...\n');
CRITICAL_ASSETS.forEach(asset => {
  const assetPath = path.join(process.cwd(), asset);
  if (fs.existsSync(assetPath)) {
    console.log(`✅ ${asset}`);
  } else {
    console.log(`❌ ${asset} - NOT FOUND`);
    hasErrors = true;
  }
});

// Check optional assets
console.log('\n📋 Checking optional assets...\n');
OPTIONAL_ASSETS.forEach(asset => {
  const assetPath = path.join(process.cwd(), asset);
  if (fs.existsSync(assetPath)) {
    console.log(`✅ ${asset}`);
  } else {
    console.log(`⚠️  ${asset} - NOT FOUND (optional)`);
    hasWarnings = true;
  }
});

// Check file references
console.log('\n📋 Checking file references...\n');
FILE_REFERENCES.forEach(check => {
  const filePath = path.join(process.cwd(), check.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${check.description} - File not found: ${check.file}`);
    hasErrors = true;
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const missing = check.shouldContain.filter(ref => !content.includes(ref));
    
    if (missing.length > 0) {
      console.log(`❌ ${check.description}`);
      console.log(`   Missing references: ${missing.join(', ')}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${check.description}`);
    }
  } catch (error) {
    console.log(`❌ ${check.description} - Error reading file: ${error.message}`);
    hasErrors = true;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('\n❌ Asset integrity check FAILED');
  console.log('Please fix the errors above before deploying.\n');
  process.exit(EXIT_FAILURE);
} else if (hasWarnings) {
  console.log('\n⚠️  Asset integrity check passed with warnings');
  console.log('Some optional assets are missing but the site should work.\n');
  process.exit(EXIT_SUCCESS);
} else {
  console.log('\n✅ All asset integrity checks passed!\n');
  process.exit(EXIT_SUCCESS);
}
