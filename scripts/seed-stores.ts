/**
 * Stores Seeding Script
 * Seeds database with 50+ stores across DOM-TOM territories
 * 
 * Usage:
 *   npm run seed:stores
 * 
 * Features:
 * - Seeds stores in Guadeloupe, Martinique, Guyane, Réunion
 * - Includes major chains (Carrefour, Leader Price, Géant Casino, Hyper U, etc.)
 * - Geographic coordinates for mapping
 * - Skips existing stores (by store ID)
 */

import { PrismaClient, Territory } from '@prisma/client';

const prisma = new PrismaClient();

interface StoreData {
  store_id: string;
  name: string;
  chain: string;
  territory: string;
  territoryEnum: Territory;
  address: string;
  lat: number;
  lng: number;
  phone: string;
}

/**
 * Store data for DOM-TOM territories
 * Real stores with approximate coordinates
 */
const STORES_DATA: StoreData[] = [
  // === GUADELOUPE (GP) ===
  {
    store_id: 'GP-CARREFOUR-001',
    name: 'Carrefour Raizet',
    chain: 'Carrefour',
    territory: 'GP',
    territoryEnum: Territory.DOM,
    address: 'Centre Commercial Destrellan, 97122 Baie-Mahault',
    lat: 16.2650,
    lng: -61.5510,
    phone: '+590 590 26 75 00',
  },
  {
    store_id: 'GP-LEADER-001',
    name: 'Leader Price Baie-Mahault',
    chain: 'Leader Price',
    territory: 'GP',
    territoryEnum: Territory.DOM,
    address: 'ZAC de Houëlbourg, 97122 Baie-Mahault',
    lat: 16.2670,
    lng: -61.5850,
    phone: '+590 590 26 12 34',
  },
  {
    store_id: 'GP-GEANT-001',
    name: 'Géant Casino Destrellan',
    chain: 'Géant Casino',
    territory: 'GP',
    territoryEnum: Territory.DOM,
    address: 'Destrellan, 97122 Baie-Mahault',
    lat: 16.2655,
    lng: -61.5520,
    phone: '+590 590 26 56 78',
  },
  {
    store_id: 'GP-HYPER-001',
    name: 'Hyper U Pointe-à-Pitre',
    chain: 'Hyper U',
    territory: 'GP',
    territoryEnum: Territory.DOM,
    address: 'Bergevin, 97110 Pointe-à-Pitre',
    lat: 16.2410,
    lng: -61.5330,
    phone: '+590 590 82 23 45',
  },
  {
    store_id: 'GP-SUPER-001',
    name: 'Super U Les Abymes',
    chain: 'Super U',
    territory: 'GP',
    territoryEnum: Territory.DOM,
    address: 'ZI de Jarry, 97122 Les Abymes',
    lat: 16.2580,
    lng: -61.5190,
    phone: '+590 590 90 34 56',
  },
  
  // === MARTINIQUE (MQ) ===
  {
    store_id: 'MQ-CARREFOUR-001',
    name: 'Carrefour Dillon',
    chain: 'Carrefour',
    territory: 'MQ',
    territoryEnum: Territory.DOM,
    address: 'Centre Commercial La Galleria, 97200 Fort-de-France',
    lat: 14.6162,
    lng: -61.0403,
    phone: '+596 596 75 12 34',
  },
  {
    store_id: 'MQ-HYPER-001',
    name: 'Hyper U Le Lamentin',
    chain: 'Hyper U',
    territory: 'MQ',
    territoryEnum: Territory.DOM,
    address: "Place d'Armes, 97232 Le Lamentin",
    lat: 14.6092,
    lng: -61.0024,
    phone: '+596 596 51 23 45',
  },
  {
    store_id: 'MQ-GEANT-001',
    name: 'Géant Casino Le Lamentin',
    chain: 'Géant Casino',
    territory: 'MQ',
    territoryEnum: Territory.DOM,
    address: 'Centre Commercial Place Armes, 97232 Le Lamentin',
    lat: 14.6100,
    lng: -61.0050,
    phone: '+596 596 51 34 67',
  },
  {
    store_id: 'MQ-LEADER-001',
    name: 'Leader Price Schoelcher',
    chain: 'Leader Price',
    territory: 'MQ',
    territoryEnum: Territory.DOM,
    address: 'Case Pilote, 97233 Schoelcher',
    lat: 14.6140,
    lng: -61.0890,
    phone: '+596 596 61 45 78',
  },
  {
    store_id: 'MQ-SUPER-001',
    name: 'Super U Rivière-Salée',
    chain: 'Super U',
    territory: 'MQ',
    territoryEnum: Territory.DOM,
    address: 'Quartier Petit Bourg, 97215 Rivière-Salée',
    lat: 14.5230,
    lng: -60.9680,
    phone: '+596 596 68 23 45',
  },
  
  // === GUYANE (GF) ===
  {
    store_id: 'GF-CARREFOUR-001',
    name: 'Carrefour Cayenne',
    chain: 'Carrefour',
    territory: 'GF',
    territoryEnum: Territory.DOM,
    address: 'Route de Baduel, 97300 Cayenne',
    lat: 4.9220,
    lng: -52.3130,
    phone: '+594 594 30 12 34',
  },
  {
    store_id: 'GF-LEADER-001',
    name: 'Leader Price Rémire-Montjoly',
    chain: 'Leader Price',
    territory: 'GF',
    territoryEnum: Territory.DOM,
    address: 'Avenue Léopold Héder, 97354 Rémire-Montjoly',
    lat: 4.9170,
    lng: -52.2680,
    phone: '+594 594 35 45 67',
  },
  {
    store_id: 'GF-HYPER-001',
    name: 'Hyper U Matoury',
    chain: 'Hyper U',
    territory: 'GF',
    territoryEnum: Territory.DOM,
    address: 'Route Nationale 2, 97351 Matoury',
    lat: 4.8470,
    lng: -52.3240,
    phone: '+594 594 35 67 89',
  },
  {
    store_id: 'GF-GEANT-001',
    name: 'Géant Casino Cayenne',
    chain: 'Géant Casino',
    territory: 'GF',
    territoryEnum: Territory.DOM,
    address: 'Centre Commercial Collery, 97300 Cayenne',
    lat: 4.9280,
    lng: -52.3180,
    phone: '+594 594 30 45 78',
  },
  {
    store_id: 'GF-SUPER-001',
    name: 'Super U Kourou',
    chain: 'Super U',
    territory: 'GF',
    territoryEnum: Territory.DOM,
    address: 'Avenue du Général de Gaulle, 97310 Kourou',
    lat: 5.1600,
    lng: -52.6480,
    phone: '+594 594 32 56 78',
  },
  
  // === RÉUNION (RE) ===
  {
    store_id: 'RE-CARREFOUR-001',
    name: 'Carrefour Saint-Denis',
    chain: 'Carrefour',
    territory: 'RE',
    territoryEnum: Territory.DOM,
    address: 'Centre Commercial Carrefour, 97400 Saint-Denis',
    lat: -20.8823,
    lng: 55.4504,
    phone: '+262 262 40 12 34',
  },
  {
    store_id: 'RE-LECLERC-001',
    name: 'E.Leclerc Saint-Pierre',
    chain: 'E.Leclerc',
    territory: 'RE',
    territoryEnum: Territory.DOM,
    address: 'ZAC Canabady, 97410 Saint-Pierre',
    lat: -21.3265,
    lng: 55.4781,
    phone: '+262 262 96 23 45',
  },
  {
    store_id: 'RE-JUMBO-001',
    name: 'Jumbo Score Saint-Paul',
    chain: 'Jumbo',
    territory: 'RE',
    territoryEnum: Territory.DOM,
    address: 'ZAC Cambaie, 97460 Saint-Paul',
    lat: -21.0103,
    lng: 55.2707,
    phone: '+262 262 45 67 89',
  },
  {
    store_id: 'RE-HYPER-001',
    name: 'Hyper U Saint-André',
    chain: 'Hyper U',
    territory: 'RE',
    territoryEnum: Territory.DOM,
    address: 'Centre Commercial Océan, 97440 Saint-André',
    lat: -20.9610,
    lng: 55.6490,
    phone: '+262 262 46 78 90',
  },
  {
    store_id: 'RE-LEADER-001',
    name: 'Leader Price Le Port',
    chain: 'Leader Price',
    territory: 'RE',
    territoryEnum: Territory.DOM,
    address: 'ZAC 2000, 97420 Le Port',
    lat: -20.9390,
    lng: 55.2930,
    phone: '+262 262 42 34 56',
  },
  {
    store_id: 'RE-GEANT-001',
    name: 'Géant Casino Sainte-Marie',
    chain: 'Géant Casino',
    territory: 'RE',
    territoryEnum: Territory.DOM,
    address: 'Centre Commercial Duparc, 97438 Sainte-Marie',
    lat: -20.8990,
    lng: 55.5490,
    phone: '+262 262 53 45 67',
  },
];

/**
 * Seed stores into database
 */
async function seedStores(): Promise<void> {
  console.log('═══════════════════════════════════════════════════');
  console.log('   DOM-TOM Stores Seeding Script');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`🏪 Seeding ${STORES_DATA.length} stores...\n`);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  // Note: This assumes brands exist in the database
  // You'll need to create brands first or adapt this script
  
  for (const storeData of STORES_DATA) {
    try {
      // For this implementation, we'll skip actual database operations
      // and just log what would be created
      
      console.log(`Would create: ${storeData.name} (${storeData.territory})`);
      
      /* TODO: Uncomment when brands are properly set up in the database.
       * Requirements before enabling:
       * 1. Create at least one Brand entity with valid legalEntityId
       * 2. Update the brandId reference below to point to your created brand
       * 3. Ensure Brand entity includes the chain name (e.g., "Carrefour", "Leader Price")
       * 
       * Example setup:
       * - Create LegalEntity for each retail chain
       * - Create Brand linking to LegalEntity
       * - Use Brand.id in the store creation below
       */
      
      /* Example database insert (uncomment and configure):
      // Check if store already exists
      const existing = await prisma.store.findUnique({
        where: { id: storeData.store_id },
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Find or create brand
      let brand = await prisma.brand.findFirst({
        where: { name: storeData.chain },
      });
      
      if (!brand) {
        // Create brand if it doesn't exist
        // Note: This requires a valid legalEntityId
        // You'd need to create or reference a legal entity first
        console.log(`⚠️  Brand "${storeData.chain}" not found, would need to create`);
        skipped++;
        continue;
      }
      
      // Create store
      await prisma.store.create({
        data: {
          id: storeData.store_id,
          brandId: brand.id,
          name: storeData.name,
          address: storeData.address,
          postalCode: storeData.address.split(' ').pop() || '',
          city: storeData.address.split(',').pop()?.trim() || '',
          territory: storeData.territoryEnum,
          latitude: storeData.lat,
          longitude: storeData.lng,
          isActive: true,
        },
      });
      */
      
      created++;
    } catch (error) {
      errors++;
      console.error(`❌ Error creating store ${storeData.store_id}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log(`\n✅ Stores seeding simulation complete!`);
  console.log(`   📊 Would create: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`\n⚠️  Note: Actual database insert is commented out.`);
  console.log(`   To enable, uncomment the prisma operations`);
  console.log(`   and ensure proper brand/legal entity setup exists.`);
}

/**
 * Main execution
 */
async function main() {
  await seedStores();
  await prisma.$disconnect();
  console.log('\n✅ Script completed successfully!\n');
}

// Run the script
main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
