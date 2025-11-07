#!/usr/bin/env node

/**
 * Asset Check Script
 * Validates that all images referenced in HTML files exist
 */

const fs = require('fs');
const path = require('path');

const errors = [];

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
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
  console.log(`\nChecking ${htmlPath}...`);
  
  if (!fileExists(htmlPath)) {
    errors.push(`HTML file not found: ${htmlPath}`);
    return;
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
      ? path.join(baseDir, url)
      : path.join(htmlDir, url);
    
    if (!fileExists(assetPath)) {
      errors.push(`Missing background image in ${htmlPath}: ${url} (resolved: ${assetPath})`);
      console.error(`  ✗ Missing: ${url}`);
    } else {
      console.log(`  ✓ Found: ${url}`);
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
      ? path.join(baseDir, url)
      : path.join(htmlDir, url);
    
    if (!fileExists(assetPath)) {
      errors.push(`Missing image in ${htmlPath}: ${url} (resolved: ${assetPath})`);
      console.error(`  ✗ Missing: ${url}`);
    } else {
      console.log(`  ✓ Found: ${url}`);
    }
  });
}

// Main execution
const repoRoot = path.join(__dirname, '..');

console.log('Asset Check - Validating image references');
console.log('==========================================');

// Check root index.html
validateHtmlFile(path.join(repoRoot, 'index.html'), repoRoot);

// Check public/index.html
validateHtmlFile(path.join(repoRoot, 'public', 'index.html'), repoRoot);

// Report results
console.log('\n==========================================');
if (errors.length === 0) {
  console.log('✓ All asset references are valid!');
  process.exit(0);
} else {
  console.error(`\n✗ Found ${errors.length} missing asset(s):`);
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
}
