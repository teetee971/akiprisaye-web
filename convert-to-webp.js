#!/usr/bin/env node

/**
 * Image Optimization Script for A KI PRI SA YÉ
 * Converts PNG/JPG images to WebP format for better performance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const publicDir = path.join(__dirname, 'public');
const supportedFormats = ['.png', '.jpg', '.jpeg'];

// Function to convert image to WebP
function convertToWebP(inputPath, outputPath) {
  try {
    console.log(`Converting: ${inputPath} -> ${outputPath}`);
    execSync(`cwebp -q 85 "${inputPath}" -o "${outputPath}"`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Failed to convert ${inputPath}:`, error.message);
    return false;
  }
}

// Function to find and convert images
function findAndConvertImages(directory) {
  const items = fs.readdirSync(directory);
  
  items.forEach(item => {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findAndConvertImages(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (supportedFormats.includes(ext)) {
        const webpPath = fullPath.replace(ext, '.webp');
        
        // Only convert if WebP doesn't exist or is older
        if (!fs.existsSync(webpPath) || 
            fs.statSync(fullPath).mtime > fs.statSync(webpPath).mtime) {
          convertToWebP(fullPath, webpPath);
        } else {
          console.log(`WebP already exists: ${webpPath}`);
        }
      }
    }
  });
}

// Main execution
console.log('🖼️  Starting image optimization...\n');

if (fs.existsSync(publicDir)) {
  findAndConvertImages(publicDir);
} else {
  console.error('Public directory not found!');
  process.exit(1);
}

console.log('\n✅ Image optimization completed!');
console.log('\n📋 Optimizations applied:');
console.log('  • Converted images to WebP format');
console.log('  • Maintained original images for fallback');
console.log('  • Quality set to 85% for optimal size/quality balance');