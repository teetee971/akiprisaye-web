#!/usr/bin/env node
/**
 * Generate index.json from all observation files
 * Scans data/observations/*.json (excluding index.json) and creates a sorted index
 * Also syncs to public/data/observations for static serving
 * 
 * Usage: node scripts/generate-index.js
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function main() {
  const observationsDir = join(__dirname, '..', 'data', 'observations');

  if (!existsSync(observationsDir)) {
    console.error(`Error: Directory not found: ${observationsDir}`);
    process.exit(1);
  }

  try {
    // Read all JSON files except index.json
    const files = readdirSync(observationsDir)
      .filter(file => file.endsWith('.json') && file !== 'index.json');

    console.log(`Found ${files.length} observation file(s)`);

    // Load and parse all observations
    const observations = [];
    for (const file of files) {
      try {
        const filePath = join(observationsDir, file);
        const content = readFileSync(filePath, 'utf-8');
        const observation = JSON.parse(content);
        
        // Ensure observation has required fields for indexing
        if (observation.id && observation.created_at) {
          observations.push(observation);
        } else {
          console.warn(`Warning: Skipping ${file} - missing id or created_at`);
        }
      } catch (error) {
        console.warn(`Warning: Failed to parse ${file}: ${error.message}`);
      }
    }

    // Sort by created_at descending (most recent first)
    observations.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    });

    // Write index file
    const indexPath = join(observationsDir, 'index.json');
    writeFileSync(indexPath, JSON.stringify(observations, null, 2), 'utf-8');

    console.log(`✓ Index generated with ${observations.length} observation(s): ${indexPath}`);

    // Sync to public/data/observations for static serving
    const publicObsDir = join(__dirname, '..', 'public', 'data', 'observations');
    if (!existsSync(publicObsDir)) {
      mkdirSync(publicObsDir, { recursive: true });
    }

    // Copy index
    const publicIndexPath = join(publicObsDir, 'index.json');
    copyFileSync(indexPath, publicIndexPath);

    // Copy all observation files
    for (const file of files) {
      const srcPath = join(observationsDir, file);
      const destPath = join(publicObsDir, file);
      copyFileSync(srcPath, destPath);
    }

    console.log(`✓ Synced to public/data/observations (${files.length} file(s))`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
