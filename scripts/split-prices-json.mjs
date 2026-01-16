#!/usr/bin/env node

/**
 * Split expanded-prices.json by Territory
 * 
 * This script optimizes the 2.3MB expanded-prices.json file by splitting it
 * into smaller territory-specific files (~190KB each).
 * 
 * Strategy:
 * 1. Read expanded-prices.json and stores-database.json
 * 2. Group observations by territory (via storeId -> store.territory)
 * 3. Create one JSON file per territory
 * 4. Generate territories-index.json with metadata
 * 5. Report statistics and size reduction
 */

import { readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TERRITORY_FILENAMES } from '../src/config/territoryFilenames.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const DATA_DIR = join(ROOT_DIR, 'public', 'data');
const TERRITORIES_DIR = join(DATA_DIR, 'territories');

/**
 * Format bytes to human readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Main split function
 */
async function splitPricesJson() {
  console.log('🚀 Starting split-prices-json script...\n');

  // Step 1: Read source files
  console.log('📖 Reading source files...');
  const expandedPricesPath = join(DATA_DIR, 'expanded-prices.json');
  const storesDatabasePath = join(DATA_DIR, 'stores-database.json');

  let expandedPrices;
  let storesDatabase;

  try {
    expandedPrices = JSON.parse(readFileSync(expandedPricesPath, 'utf-8'));
    console.log(`  ✓ Read expanded-prices.json (${formatBytes(statSync(expandedPricesPath).size)})`);
  } catch (error) {
    console.error(`  ✗ Failed to read expanded-prices.json: ${error.message}`);
    process.exit(1);
  }

  try {
    storesDatabase = JSON.parse(readFileSync(storesDatabasePath, 'utf-8'));
    console.log(`  ✓ Read stores-database.json`);
  } catch (error) {
    console.error(`  ✗ Failed to read stores-database.json: ${error.message}`);
    process.exit(1);
  }

  // Step 2: Create territory lookup map from stores
  console.log('\n🗺️  Building territory lookup map...');
  const storeToTerritory = new Map();
  storesDatabase.stores.forEach(store => {
    storeToTerritory.set(store.id, store.territory);
  });
  console.log(`  ✓ Mapped ${storeToTerritory.size} stores to territories`);

  // Step 3: Group observations by territory
  console.log('\n📊 Grouping observations by territory...');
  const observationsByTerritory = new Map();
  const territoryCounts = {};

  expandedPrices.observations.forEach(observation => {
    const territory = storeToTerritory.get(observation.storeId);
    if (!territory) {
      // Skip observations with unknown store/territory
      return;
    }

    if (!observationsByTerritory.has(territory)) {
      observationsByTerritory.set(territory, []);
      territoryCounts[territory] = 0;
    }

    observationsByTerritory.get(territory).push(observation);
    territoryCounts[territory]++;
  });

  console.log(`  ✓ Found ${observationsByTerritory.size} territories:`);
  Object.keys(territoryCounts).sort().forEach(territory => {
    console.log(`    - ${territory}: ${territoryCounts[territory]} observations`);
  });

  // Step 4: Create output directory
  console.log('\n📁 Creating output directory...');
  try {
    mkdirSync(TERRITORIES_DIR, { recursive: true });
    console.log(`  ✓ Created ${TERRITORIES_DIR}`);
  } catch (error) {
    console.log(`  ℹ Directory already exists: ${TERRITORIES_DIR}`);
  }

  // Step 5: Write territory-specific files
  console.log('\n💾 Writing territory-specific files...');
  const territoryFiles = [];
  const originalSize = statSync(expandedPricesPath).size;
  let totalSplitSize = 0;

  for (const [territoryCode, observations] of observationsByTerritory.entries()) {
    const territoryData = {
      metadata: {
        ...expandedPrices.metadata,
        territory: territoryCode,
        territories: [territoryCode],
        observationCount: observations.length,
        generatedAt: new Date().toISOString(),
        version: expandedPrices.metadata.version,
        source: 'split from expanded-prices.json'
      },
      products: expandedPrices.products, // Same products for all territories
      observations: observations
    };

    // Get filename from shared config
    const filename = TERRITORY_FILENAMES[territoryCode];
    if (!filename) {
      console.warn(`  ⚠ No filename mapping for territory ${territoryCode}, skipping...`);
      continue;
    }

    const filepath = join(TERRITORIES_DIR, filename);

    // Write minified JSON (no whitespace)
    writeFileSync(filepath, JSON.stringify(territoryData));

    const fileSize = statSync(filepath).size;
    totalSplitSize += fileSize;

    // Extract territory name from filename (remove .json extension)
    const territoryName = filename.replace('.json', '');

    territoryFiles.push({
      code: territoryCode,
      name: territoryName,
      filename: filename,
      observationCount: observations.length,
      productCount: expandedPrices.products.length,
      size: fileSize,
      sizeFormatted: formatBytes(fileSize)
    });

    console.log(`  ✓ ${filename} (${formatBytes(fileSize)}, ${observations.length} observations)`);
  }

  // Step 6: Create territories-index.json
  console.log('\n📋 Creating territories-index.json...');
  const indexData = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    territories: territoryFiles.map(t => ({
      code: t.code,
      name: t.name,
      filename: t.filename,
      observationCount: t.observationCount,
      productCount: t.productCount,
      size: t.size
    })),
    statistics: {
      totalTerritories: territoryFiles.length,
      totalProducts: expandedPrices.products.length,
      totalObservations: expandedPrices.observations.length,
      originalFileSize: originalSize,
      totalSplitSize: totalSplitSize,
      averageTerritorySize: Math.round(totalSplitSize / territoryFiles.length),
      sizeReduction: {
        bytes: originalSize - totalSplitSize,
        percentage: Math.round(((originalSize - totalSplitSize) / originalSize) * 10000) / 100
      }
    }
  };

  const indexPath = join(DATA_DIR, 'territories-index.json');
  writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
  const indexSize = statSync(indexPath).size;
  console.log(`  ✓ Created territories-index.json (${formatBytes(indexSize)})`);

  // Step 7: Report statistics
  console.log('\n📈 Summary Statistics:');
  console.log(`  Original file:        ${formatBytes(originalSize)}`);
  console.log(`  Total split files:    ${formatBytes(totalSplitSize)}`);
  console.log(`  Average per territory: ${formatBytes(indexData.statistics.averageTerritorySize)}`);
  console.log(`  Size reduction:       ${formatBytes(indexData.statistics.sizeReduction.bytes)} (${indexData.statistics.sizeReduction.percentage}%)`);
  console.log(`  Territories created:  ${territoryFiles.length}`);
  console.log(`  Index file:           ${formatBytes(indexSize)}`);
  console.log(`\n  ℹ️  Note: Total split size includes duplicate product data across territories`);
  console.log(`     Actual bandwidth saved per request = ${formatBytes(originalSize - indexData.statistics.averageTerritorySize - indexSize)} (-${Math.round(((originalSize - indexData.statistics.averageTerritorySize - indexSize) / originalSize) * 100)}%)`);

  console.log('\n✅ Split complete! Files created in public/data/territories/');
  console.log(`\n💡 Expected impact:`);
  console.log(`  - Initial load: ${formatBytes(originalSize)} → ${formatBytes(indexData.statistics.averageTerritorySize + indexSize)} per territory`);
  console.log(`  - LCP improvement: ~6.1s → ~1.2-2.0s (estimated)`);
  console.log(`  - Mobile Performance Score: 74 → 82-88/100 (estimated)`);
}

// Run the script
splitPricesJson().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
