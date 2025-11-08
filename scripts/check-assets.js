#!/usr/bin/env node
/**
 * Comprehensive Asset Integrity Checker
 * Combines critical asset existence checks with HTML image reference validation
 * Merged from PR #299 and PR #300
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
  'public/service-worker.js',
];

// Optional assets (warnings only)
const OPTIONAL_ASSETS = [
  'functions/api/prices.js',
  'src/data/firestorePrices.js',
];

// File reference checks
const FILE_REFERENCES = [
  {
    file: 'comparateur.html',
    shouldContain: ['comparateur-fetch.js'],
    description: 'comparateur.html should reference comparateur-fetch.js',
  },
  {
    file: 'index.html',
    shouldContain: ['KI PRI SA YÉ'],
    description: 'index.html should contain expected content',
  },
];

// HTML files to validate for image references
const HTML_FILES_TO_VALIDATE = [
  'index.html',
  'public/index.html',
];

let hasErrors = false;
let hasWarnings = false;
const errors = [];

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (_err) {
    return false;
  }
}

/**
 * Extract background-image URLs from CSS content
 */
function extractBackgroundImages(content) {
  const regex = /background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/gi;
  const matches = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

/**
 * Extract img src URLs from HTML content
 */
function extractImgSrcs(content) {
  const regex = /<img[^>]+src=['"]([^'"]+)['"]/gi;
  const matches = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

/**
 * Validate assets in a HTML file
 */
function validateHtmlFile(htmlPath, baseDir) {
  if (!fileExists(htmlPath)) {
    return; // Skip if file doesn't exist (already reported in critical assets)
  }
  
  const content = fs.readFileSync(htmlPath, 'utf8');
  const htmlDir = path.dirname(htmlPath);
  
  // Check background images
  const bgImages = extractBackgroundImages(content);
  bgImages.forEach(url => {
    // Skip external URLs and data URLs
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return;
    }
    
    // Resolve relative path
    const assetPath = url.startsWith('/') 
      ? path.join(baseDir, url.slice(1))
      : path.join(htmlDir, url);
    
    if (!fileExists(assetPath)) {
      errors.push(`Missing background image in ${htmlPath}: ${url}`);
      console.log(`  ❌ Missing background: ${url}`);
      hasErrors = true;
    } else {
      console.log(`  ✅ Found background: ${url}`);
    }
  });
  
  // Check img src
  const imgSrcs = extractImgSrcs(content);
  imgSrcs.forEach(url => {
    // Skip external URLs and data URLs
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return;
    }
    
    // Resolve relative path
    const assetPath = url.startsWith('/') 
      ? path.join(baseDir, url.slice(1))
      : path.join(htmlDir, url);
    
    if (!fileExists(assetPath)) {
      errors.push(`Missing image in ${htmlPath}: ${url}`);
      console.log(`  ❌ Missing image: ${url}`);
      hasErrors = true;
    } else {
      console.log(`  ✅ Found image: ${url}`);
    }
  });
}

// Main execution
const repoRoot = process.cwd();

console.log('🔍 Comprehensive Asset Integrity Check\n');
console.log('='.repeat(60));

// Check critical assets
console.log('\n📋 Checking critical assets...\n');
CRITICAL_ASSETS.forEach(asset => {
  const assetPath = path.join(repoRoot, asset);
  if (fileExists(assetPath)) {
    console.log(`✅ ${asset}`);
  } else {
    console.log(`❌ ${asset} - NOT FOUND`);
    hasErrors = true;
    errors.push(`Critical asset missing: ${asset}`);
  }
});

// Check optional assets
console.log('\n📋 Checking optional assets...\n');
OPTIONAL_ASSETS.forEach(asset => {
  const assetPath = path.join(repoRoot, asset);
  if (fileExists(assetPath)) {
    console.log(`✅ ${asset}`);
  } else {
    console.log(`⚠️  ${asset} - NOT FOUND (optional)`);
    hasWarnings = true;
  }
});

// Check file references
console.log('\n📋 Checking file content references...\n');
FILE_REFERENCES.forEach(check => {
  const filePath = path.join(repoRoot, check.file);
  
  if (!fileExists(filePath)) {
    console.log(`❌ ${check.description} - File not found: ${check.file}`);
    hasErrors = true;
    errors.push(`Reference check failed: ${check.file} not found`);
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const missing = check.shouldContain.filter(ref => !content.includes(ref));
    
    if (missing.length > 0) {
      console.log(`❌ ${check.description}`);
      console.log(`   Missing references: ${missing.join(', ')}`);
      hasErrors = true;
      errors.push(`${check.description} - missing: ${missing.join(', ')}`);
    } else {
      console.log(`✅ ${check.description}`);
    }
  } catch (error) {
    console.log(`❌ ${check.description} - Error reading file: ${error.message}`);
    hasErrors = true;
    errors.push(`Error reading ${check.file}: ${error.message}`);
  }
});

// Validate HTML image references
console.log('\n📋 Validating HTML image references...\n');
HTML_FILES_TO_VALIDATE.forEach(htmlFile => {
  const htmlPath = path.join(repoRoot, htmlFile);
  console.log(`Checking ${htmlFile}...`);
  validateHtmlFile(htmlPath, repoRoot);
});

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('\n❌ Asset integrity check FAILED');
  console.log(`\nFound ${errors.length} error(s):`);
  errors.forEach(err => console.log(`  - ${err}`));
  console.log('\nPlease fix the errors above before deploying.\n');
  process.exit(EXIT_FAILURE);
} else if (hasWarnings) {
  console.log('\n⚠️  Asset integrity check passed with warnings');
  console.log('Some optional assets are missing but the site should work.\n');
  process.exit(EXIT_SUCCESS);
} else {
  console.log('\n✅ All asset integrity checks passed!\n');
  process.exit(EXIT_SUCCESS);
}
