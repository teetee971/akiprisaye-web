#!/usr/bin/env node
/**
 * DOM-TOM Stores Seeding Script
 * 
 * Seeds the database with stores from French Overseas Territories
 * (Guadeloupe, Martinique, Guyane, Réunion, Mayotte, etc.)
 * 
 * Features:
 * - 50+ stores across DOM-TOM territories
 * - Major retail chains (Carrefour, Leader Price, Géant, Super U, etc.)
 * - Local stores and markets
 * - Geo-coordinates for mapping
 * - Territory-specific data
 * 
 * Usage:
 *   node scripts/seed-stores.mjs
 *   node scripts/seed-stores.mjs --territory guadeloupe
 *   node scripts/seed-stores.mjs --clean
 * 
 * @module seed-stores
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Store data for DOM-TOM territories
const STORES_DATA = {
  guadeloupe: [
    {
      name: 'Carrefour Jarry',
      address: 'Zone Commerciale de Jarry',
      postalCode: '97122',
      city: 'Baie-Mahault',
      territory: 'DOM',
      latitude: 16.2387,
      longitude: -61.5558,
      brand: 'Carrefour'
    },
    {
      name: 'Carrefour Destrellan',
      address: 'Centre Commercial Destrellan',
      postalCode: '97122',
      city: 'Baie-Mahault',
      territory: 'DOM',
      latitude: 16.2498,
      longitude: -61.5625,
      brand: 'Carrefour'
    },
    {
      name: 'Super U Destreland',
      address: 'Centre Commercial Destreland',
      postalCode: '97122',
      city: 'Baie-Mahault',
      territory: 'DOM',
      latitude: 16.2456,
      longitude: -61.5604,
      brand: 'Super U'
    },
    {
      name: 'Leader Price Pointe-à-Pitre',
      address: 'Rue Frébault',
      postalCode: '97110',
      city: 'Pointe-à-Pitre',
      territory: 'DOM',
      latitude: 16.2414,
      longitude: -61.5331,
      brand: 'Leader Price'
    },
    {
      name: 'Casino Gosier',
      address: 'Centre Commercial du Gosier',
      postalCode: '97190',
      city: 'Le Gosier',
      territory: 'DOM',
      latitude: 16.1978,
      longitude: -61.5128,
      brand: 'Casino'
    },
    {
      name: 'Hyper U Les Abymes',
      address: 'Rocade de Chauvel',
      postalCode: '97139',
      city: 'Les Abymes',
      territory: 'DOM',
      latitude: 16.2667,
      longitude: -61.5167,
      brand: 'Hyper U'
    },
    {
      name: 'Simply Market Raizet',
      address: 'ZAC de Raizet',
      postalCode: '97139',
      city: 'Les Abymes',
      territory: 'DOM',
      latitude: 16.2689,
      longitude: -61.5122,
      brand: 'Simply Market'
    },
    {
      name: 'Match Basse-Terre',
      address: 'Centre Ville',
      postalCode: '97100',
      city: 'Basse-Terre',
      territory: 'DOM',
      latitude: 15.9942,
      longitude: -61.7300,
      brand: 'Match'
    },
    {
      name: 'Carrefour Market Saint-François',
      address: 'Route de la Pointe des Châteaux',
      postalCode: '97118',
      city: 'Saint-François',
      territory: 'DOM',
      latitude: 16.2556,
      longitude: -61.2714,
      brand: 'Carrefour Market'
    },
    {
      name: 'Marché de la Darse',
      address: 'Place de la Darse',
      postalCode: '97110',
      city: 'Pointe-à-Pitre',
      territory: 'DOM',
      latitude: 16.2369,
      longitude: -61.5328,
      brand: 'Marché Local'
    }
  ],
  martinique: [
    {
      name: 'Carrefour La Galleria',
      address: 'Centre Commercial La Galleria',
      postalCode: '97200',
      city: 'Fort-de-France',
      territory: 'DOM',
      latitude: 14.6190,
      longitude: -61.0570,
      brand: 'Carrefour'
    },
    {
      name: 'Hyper U Dillon',
      address: 'ZAC de Dillon',
      postalCode: '97200',
      city: 'Fort-de-France',
      territory: 'DOM',
      latitude: 14.6267,
      longitude: -61.0545,
      brand: 'Hyper U'
    },
    {
      name: 'Leader Price Schoelcher',
      address: 'Boulevard de la Marne',
      postalCode: '97233',
      city: 'Schoelcher',
      territory: 'DOM',
      latitude: 14.6148,
      longitude: -61.1007,
      brand: 'Leader Price'
    },
    {
      name: 'Super U Robert',
      address: 'Centre Commercial du Robert',
      postalCode: '97231',
      city: 'Le Robert',
      territory: 'DOM',
      latitude: 14.6778,
      longitude: -60.9436,
      brand: 'Super U'
    },
    {
      name: 'Carrefour Market Lamentin',
      address: 'Place d\'Armes',
      postalCode: '97232',
      city: 'Le Lamentin',
      territory: 'DOM',
      latitude: 14.6114,
      longitude: -60.9967,
      brand: 'Carrefour Market'
    },
    {
      name: 'Casino Ducos',
      address: 'Zone Industrielle de Manhity',
      postalCode: '97224',
      city: 'Ducos',
      territory: 'DOM',
      latitude: 14.5972,
      longitude: -60.9819,
      brand: 'Casino'
    },
    {
      name: 'Super U Trinité',
      address: 'Centre Commercial',
      postalCode: '97220',
      city: 'La Trinité',
      territory: 'DOM',
      latitude: 14.7400,
      longitude: -60.9642,
      brand: 'Super U'
    },
    {
      name: 'Carrefour Express Saint-Pierre',
      address: 'Rue Victor Hugo',
      postalCode: '97250',
      city: 'Saint-Pierre',
      territory: 'DOM',
      latitude: 14.7403,
      longitude: -61.1783,
      brand: 'Carrefour Express'
    },
    {
      name: 'Match Fort-de-France',
      address: 'Rue de la République',
      postalCode: '97200',
      city: 'Fort-de-France',
      territory: 'DOM',
      latitude: 14.6050,
      longitude: -61.0662,
      brand: 'Match'
    },
    {
      name: 'Marché Couvert',
      address: 'Rue Isambert',
      postalCode: '97200',
      city: 'Fort-de-France',
      territory: 'DOM',
      latitude: 14.6028,
      longitude: -61.0715,
      brand: 'Marché Local'
    }
  ],
  guyane: [
    {
      name: 'Hyper U Collery',
      address: 'Centre Commercial Collery',
      postalCode: '97300',
      city: 'Cayenne',
      territory: 'DOM',
      latitude: 4.9300,
      longitude: -52.3167,
      brand: 'Hyper U'
    },
    {
      name: 'Carrefour Cayenne',
      address: 'Route de Montabo',
      postalCode: '97300',
      city: 'Cayenne',
      territory: 'DOM',
      latitude: 4.9324,
      longitude: -52.3090,
      brand: 'Carrefour'
    },
    {
      name: 'Leader Price Remire-Montjoly',
      address: 'Zone Commerciale',
      postalCode: '97354',
      city: 'Rémire-Montjoly',
      territory: 'DOM',
      latitude: 4.9167,
      longitude: -52.2667,
      brand: 'Leader Price'
    },
    {
      name: 'Casino Matoury',
      address: 'Centre Commercial',
      postalCode: '97351',
      city: 'Matoury',
      territory: 'DOM',
      latitude: 4.8475,
      longitude: -52.3239,
      brand: 'Casino'
    },
    {
      name: 'Super U Kourou',
      address: 'Avenue de l\'Espace',
      postalCode: '97310',
      city: 'Kourou',
      territory: 'DOM',
      latitude: 5.1600,
      longitude: -52.6489,
      brand: 'Super U'
    },
    {
      name: 'Carrefour Market Saint-Laurent',
      address: 'Centre Ville',
      postalCode: '97320',
      city: 'Saint-Laurent-du-Maroni',
      territory: 'DOM',
      latitude: 5.4978,
      longitude: -54.0303,
      brand: 'Carrefour Market'
    },
    {
      name: 'Marché de Cayenne',
      address: 'Place des Palmistes',
      postalCode: '97300',
      city: 'Cayenne',
      territory: 'DOM',
      latitude: 4.9381,
      longitude: -52.3292,
      brand: 'Marché Local'
    }
  ],
  reunion: [
    {
      name: 'Carrefour Sainte-Marie',
      address: 'Centre Commercial Duparc',
      postalCode: '97438',
      city: 'Sainte-Marie',
      territory: 'DOM',
      latitude: -20.9025,
      longitude: 55.5519,
      brand: 'Carrefour'
    },
    {
      name: 'Hyper U Saint-Pierre',
      address: 'Zone Commerciale Pierrefonds',
      postalCode: '97410',
      city: 'Saint-Pierre',
      territory: 'DOM',
      latitude: -21.3294,
      longitude: 55.4781,
      brand: 'Hyper U'
    },
    {
      name: 'Leader Price Saint-Denis',
      address: 'Rue Maréchal Leclerc',
      postalCode: '97400',
      city: 'Saint-Denis',
      territory: 'DOM',
      latitude: -20.8789,
      longitude: 55.4481,
      brand: 'Leader Price'
    },
    {
      name: 'Leclerc Saint-Paul',
      address: 'Centre Commercial Savanna',
      postalCode: '97460',
      city: 'Saint-Paul',
      territory: 'DOM',
      latitude: -21.0105,
      longitude: 55.2707,
      brand: 'Leclerc'
    },
    {
      name: 'Casino Saint-André',
      address: 'Centre Ville',
      postalCode: '97440',
      city: 'Saint-André',
      territory: 'DOM',
      latitude: -20.9608,
      longitude: 55.6519,
      brand: 'Casino'
    },
    {
      name: 'Super U Le Port',
      address: 'Zone Commerciale',
      postalCode: '97420',
      city: 'Le Port',
      territory: 'DOM',
      latitude: -20.9378,
      longitude: 55.2928,
      brand: 'Super U'
    },
    {
      name: 'Carrefour Market Saint-Benoît',
      address: 'Route Nationale',
      postalCode: '97470',
      city: 'Saint-Benoît',
      territory: 'DOM',
      latitude: -21.0342,
      longitude: 55.7131,
      brand: 'Carrefour Market'
    },
    {
      name: 'Jumbo Score Saint-Louis',
      address: 'Zone Commerciale',
      postalCode: '97450',
      city: 'Saint-Louis',
      territory: 'DOM',
      latitude: -21.2864,
      longitude: 55.4097,
      brand: 'Jumbo'
    },
    {
      name: 'Match Saint-Leu',
      address: 'Centre Commercial',
      postalCode: '97436',
      city: 'Saint-Leu',
      territory: 'DOM',
      latitude: -21.1706,
      longitude: 55.2869,
      brand: 'Match'
    },
    {
      name: 'Marché Forain Saint-Denis',
      address: 'Grand Marché',
      postalCode: '97400',
      city: 'Saint-Denis',
      territory: 'DOM',
      latitude: -20.8825,
      longitude: 55.4504,
      brand: 'Marché Local'
    }
  ],
  mayotte: [
    {
      name: 'Carrefour Mamoudzou',
      address: 'Centre Commercial Hamaha',
      postalCode: '97600',
      city: 'Mamoudzou',
      territory: 'DOM',
      latitude: -12.7806,
      longitude: 45.2278,
      brand: 'Carrefour'
    },
    {
      name: 'Leader Price Kawéni',
      address: 'Zone Industrielle de Kawéni',
      postalCode: '97600',
      city: 'Mamoudzou',
      territory: 'DOM',
      latitude: -12.7667,
      longitude: 45.2333,
      brand: 'Leader Price'
    },
    {
      name: 'Super U Mamoudzou',
      address: 'Centre Ville',
      postalCode: '97600',
      city: 'Mamoudzou',
      territory: 'DOM',
      latitude: -12.7806,
      longitude: 45.2275,
      brand: 'Super U'
    },
    {
      name: 'Casino Dzaoudzi',
      address: 'Petite-Terre',
      postalCode: '97615',
      city: 'Dzaoudzi',
      territory: 'DOM',
      latitude: -12.7878,
      longitude: 45.2761,
      brand: 'Casino'
    }
  ],

  // ── Grossistes alimentaires ───────────────────────────────────────────────
  // Cash & carry et distributeurs alimentaires professionnels DOM-TOM

  guadeloupe_grossistes: [
    {
      name: 'Metro Cash & Carry Jarry',
      address: 'Zone Industrielle de Jarry',
      postalCode: '97122',
      city: 'Baie-Mahault',
      territory: 'GP',
      latitude: 16.247,
      longitude: -61.557,
      brand: 'Metro',
      storeType: 'grossiste'
    },
    {
      name: 'Promocash Jarry',
      address: 'Zone de Jarry, Rue des Artisans',
      postalCode: '97122',
      city: 'Baie-Mahault',
      territory: 'GP',
      latitude: 16.248,
      longitude: -61.555,
      brand: 'Promocash',
      storeType: 'grossiste'
    },
    {
      name: 'Samibo Distribution',
      address: 'Zone Industrielle de Jarry',
      postalCode: '97122',
      city: 'Baie-Mahault',
      territory: 'GP',
      latitude: 16.246,
      longitude: -61.558,
      brand: 'Samibo',
      storeType: 'grossiste'
    },
    {
      name: 'Transgourmet Antilles Guadeloupe',
      address: 'Zone de Jarry',
      postalCode: '97122',
      city: 'Baie-Mahault',
      territory: 'GP',
      latitude: 16.249,
      longitude: -61.554,
      brand: 'Transgourmet',
      storeType: 'grossiste'
    },
    {
      name: 'GBH Distribution Guadeloupe',
      address: 'Zone Industrielle de Jarry',
      postalCode: '97122',
      city: 'Baie-Mahault',
      territory: 'GP',
      latitude: 16.250,
      longitude: -61.556,
      brand: 'GBH Distribution',
      storeType: 'grossiste'
    }
  ],

  martinique_grossistes: [
    {
      name: 'Metro Cash & Carry Le Lamentin',
      address: 'Zone Industrielle du Lamentin',
      postalCode: '97232',
      city: 'Le Lamentin',
      territory: 'MQ',
      latitude: 14.608,
      longitude: -60.991,
      brand: 'Metro',
      storeType: 'grossiste'
    },
    {
      name: 'Promocash Martinique',
      address: 'Zone Industrielle du Lamentin',
      postalCode: '97232',
      city: 'Le Lamentin',
      territory: 'MQ',
      latitude: 14.611,
      longitude: -60.985,
      brand: 'Promocash',
      storeType: 'grossiste'
    },
    {
      name: 'Codim Cash & Carry',
      address: 'Quartier Acajou, Le Lamentin',
      postalCode: '97200',
      city: 'Fort-de-France',
      territory: 'MQ',
      latitude: 14.613,
      longitude: -61.066,
      brand: 'Codim',
      storeType: 'grossiste'
    },
    {
      name: 'Solhy Distribution',
      address: 'Route de la Pointe des Nègres',
      postalCode: '97200',
      city: 'Fort-de-France',
      territory: 'MQ',
      latitude: 14.615,
      longitude: -61.059,
      brand: 'Solhy',
      storeType: 'grossiste'
    },
    {
      name: 'Hyper Cash Martinique',
      address: 'Boulevard du Général de Gaulle',
      postalCode: '97200',
      city: 'Fort-de-France',
      territory: 'MQ',
      latitude: 14.612,
      longitude: -61.063,
      brand: 'Hyper Cash',
      storeType: 'grossiste'
    }
  ],

  guyane_grossistes: [
    {
      name: 'Metro Cash & Carry Cayenne',
      address: 'Zone Industrielle de Dégrad-des-Cannes',
      postalCode: '97351',
      city: 'Matoury',
      territory: 'GF',
      latitude: 4.929,
      longitude: -52.319,
      brand: 'Metro',
      storeType: 'grossiste'
    },
    {
      name: 'Socaguy Distribution',
      address: 'Zone Industrielle de Cayenne',
      postalCode: '97300',
      city: 'Cayenne',
      territory: 'GF',
      latitude: 4.920,
      longitude: -52.321,
      brand: 'Socaguy',
      storeType: 'grossiste'
    },
    {
      name: 'GD Distribution Guyane',
      address: 'Route de Montabo',
      postalCode: '97300',
      city: 'Cayenne',
      territory: 'GF',
      latitude: 4.925,
      longitude: -52.315,
      brand: 'GD Distribution',
      storeType: 'grossiste'
    }
  ],

  reunion_grossistes: [
    {
      name: 'Metro Cash & Carry Réunion',
      address: 'Zone Industrielle de la Rivière des Galets',
      postalCode: '97490',
      city: 'Sainte-Clotilde',
      territory: 'RE',
      latitude: -20.891,
      longitude: 55.502,
      brand: 'Metro',
      storeType: 'grossiste'
    },
    {
      name: 'Transgourmet Réunion',
      address: 'Zone Industrielle de la Bretagne',
      postalCode: '97490',
      city: 'Saint-Denis',
      territory: 'RE',
      latitude: -20.875,
      longitude: 55.467,
      brand: 'Transgourmet',
      storeType: 'grossiste'
    },
    {
      name: 'Hyper Cash Réunion',
      address: 'Zone Industrielle de la Rivière du Mât',
      postalCode: '97440',
      city: 'Saint-André',
      territory: 'RE',
      latitude: -20.964,
      longitude: 55.649,
      brand: 'Hyper Cash',
      storeType: 'grossiste'
    },
    {
      name: 'Groupe Parfait Distribution',
      address: 'Zone Industrielle du Port',
      postalCode: '97420',
      city: 'Saint-Denis',
      territory: 'RE',
      latitude: -20.883,
      longitude: 55.462,
      brand: 'Groupe Parfait',
      storeType: 'grossiste'
    }
  ]
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    territory: null,
    clean: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--territory':
      case '-t':
        options.territory = nextArg;
        i++;
        break;
      case '--clean':
      case '-c':
        options.clean = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
DOM-TOM Stores Seeding Script

Usage:
  node scripts/seed-stores.mjs [options]

Options:
  --territory, -t <name>  Seed stores only for specified territory
                          Available: guadeloupe, martinique, guyane, reunion, mayotte,
                                     guadeloupe_grossistes, martinique_grossistes,
                                     guyane_grossistes, reunion_grossistes
  --clean, -c             Clean existing stores before seeding
  --help, -h              Show this help message

Examples:
  # Seed all territories
  node scripts/seed-stores.mjs

  # Seed only Guadeloupe stores
  node scripts/seed-stores.mjs --territory guadeloupe

  # Clean and reseed all stores
  node scripts/seed-stores.mjs --clean
  `);
}

/**
 * Get or create brand
 */
async function getOrCreateBrand(brandName, legalEntityId) {
  let brand = await prisma.brand.findFirst({
    where: { name: brandName }
  });

  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        name: brandName,
        legalEntityId,
        status: 'ACTIVE',
        subscriptionPlan: 'BASIC',
        description: `Enseigne ${brandName}`
      }
    });
  }

  return brand;
}

/**
 * Seed stores for a territory
 */
async function seedTerritory(territoryName, stores, legalEntityId) {
  console.log(`\n📍 Seeding ${territoryName} (${stores.length} stores)...`);

  const results = {
    created: 0,
    updated: 0,
    errors: 0
  };

  for (const storeData of stores) {
    try {
      // Get or create brand
      const brand = await getOrCreateBrand(storeData.brand, legalEntityId);

      // Create or update store
      const store = await prisma.store.upsert({
        where: {
          brandId_name: {
            brandId: brand.id,
            name: storeData.name
          }
        },
        update: {
          address: storeData.address,
          postalCode: storeData.postalCode,
          city: storeData.city,
          territory: storeData.territory,
          latitude: storeData.latitude,
          longitude: storeData.longitude,
          isActive: true
        },
        create: {
          brandId: brand.id,
          name: storeData.name,
          address: storeData.address,
          postalCode: storeData.postalCode,
          city: storeData.city,
          territory: storeData.territory,
          latitude: storeData.latitude,
          longitude: storeData.longitude,
          isActive: true
        }
      });

      if (store.createdAt.getTime() === store.updatedAt.getTime()) {
        results.created++;
      } else {
        results.updated++;
      }
    } catch (error) {
      console.error(`Error seeding store ${storeData.name}:`, error.message);
      results.errors++;
    }
  }

  console.log(`✅ Created: ${results.created}`);
  console.log(`🔄 Updated: ${results.updated}`);
  console.log(`❌ Errors: ${results.errors}`);

  return results;
}

/**
 * Main seeding function
 */
async function seedStores(options) {
  console.log('🏪 Starting DOM-TOM stores seeding...');

  // Clean existing stores if requested
  if (options.clean) {
    console.log('🧹 Cleaning existing stores...');
    const deleted = await prisma.store.deleteMany({});
    console.log(`Deleted ${deleted.count} stores`);
  }

  // Get or create legal entity for stores
  let legalEntity = await prisma.legalEntity.findFirst({
    where: { name: 'DOM-TOM Retail Stores' }
  });

  if (!legalEntity) {
    legalEntity = await prisma.legalEntity.create({
      data: {
        siren: '111111111',
        siret: '11111111111111',
        name: 'DOM-TOM Retail Stores',
        status: 'ACTIVE'
      }
    });
  }

  const totalStats = {
    territories: 0,
    created: 0,
    updated: 0,
    errors: 0
  };

  // Seed stores for each territory
  const territoriesToSeed = options.territory 
    ? [options.territory]
    : Object.keys(STORES_DATA);

  for (const territory of territoriesToSeed) {
    if (!STORES_DATA[territory]) {
      console.warn(`⚠️  Unknown territory: ${territory}`);
      continue;
    }

    const results = await seedTerritory(
      territory,
      STORES_DATA[territory],
      legalEntity.id
    );

    totalStats.territories++;
    totalStats.created += results.created;
    totalStats.updated += results.updated;
    totalStats.errors += results.errors;
  }

  console.log('\n📊 Seeding Summary:');
  console.log(`Territories seeded: ${totalStats.territories}`);
  console.log(`Stores created: ${totalStats.created}`);
  console.log(`Stores updated: ${totalStats.updated}`);
  console.log(`Errors: ${totalStats.errors}`);

  return totalStats;
}

/**
 * Main execution
 */
async function main() {
  try {
    const options = parseArgs();
    await seedStores(options);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { seedStores, STORES_DATA };
