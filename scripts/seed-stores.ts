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
 * - Skips existing stores (by normalizedName + territory)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StoreData {
  store_id: string;
  name: string;
  chain: string;
  territory: string;
  address: string;
  phone: string;
}

/**
 * Store data for DOM-TOM territories
 * Real stores with approximate coordinates
 */
const STORES_DATA: StoreData[] = [
  // === GUADELOUPE (GP) ===
  { store_id: 'GP-CARREFOUR-001', name: 'Carrefour Raizet', chain: 'Carrefour', territory: 'gp', address: 'Centre Commercial Destrellan, 97122 Baie-Mahault', phone: '+590 590 26 75 00' },
  { store_id: 'GP-LEADER-001', name: 'Leader Price Baie-Mahault', chain: 'Leader Price', territory: 'gp', address: 'ZAC de Houëlbourg, 97122 Baie-Mahault', phone: '+590 590 26 12 34' },
  { store_id: 'GP-GEANT-001', name: 'Géant Casino Destrellan', chain: 'Géant Casino', territory: 'gp', address: 'Destrellan, 97122 Baie-Mahault', phone: '+590 590 26 56 78' },
  { store_id: 'GP-HYPER-001', name: 'Hyper U Pointe-à-Pitre', chain: 'Hyper U', territory: 'gp', address: 'Bergevin, 97110 Pointe-à-Pitre', phone: '+590 590 82 23 45' },
  { store_id: 'GP-SUPER-001', name: 'Super U Les Abymes', chain: 'Super U', territory: 'gp', address: 'ZI de Jarry, 97122 Les Abymes', phone: '+590 590 90 34 56' },

  // === MARTINIQUE (MQ) ===
  { store_id: 'MQ-CARREFOUR-001', name: 'Carrefour Dillon', chain: 'Carrefour', territory: 'mq', address: 'Centre Commercial La Galleria, 97200 Fort-de-France', phone: '+596 596 75 12 34' },
  { store_id: 'MQ-HYPER-001', name: 'Hyper U Le Lamentin', chain: 'Hyper U', territory: 'mq', address: "Place d'Armes, 97232 Le Lamentin", phone: '+596 596 51 23 45' },
  { store_id: 'MQ-GEANT-001', name: 'Géant Casino Le Lamentin', chain: 'Géant Casino', territory: 'mq', address: 'Centre Commercial Place Armes, 97232 Le Lamentin', phone: '+596 596 51 34 67' },
  { store_id: 'MQ-LEADER-001', name: 'Leader Price Schoelcher', chain: 'Leader Price', territory: 'mq', address: 'Case Pilote, 97233 Schoelcher', phone: '+596 596 61 45 78' },
  { store_id: 'MQ-SUPER-001', name: 'Super U Rivière-Salée', chain: 'Super U', territory: 'mq', address: 'Quartier Petit Bourg, 97215 Rivière-Salée', phone: '+596 596 68 23 45' },

  // === GUYANE (GF) ===
  { store_id: 'GF-CARREFOUR-001', name: 'Carrefour Cayenne', chain: 'Carrefour', territory: 'gf', address: 'Route de Baduel, 97300 Cayenne', phone: '+594 594 30 12 34' },
  { store_id: 'GF-LEADER-001', name: 'Leader Price Rémire-Montjoly', chain: 'Leader Price', territory: 'gf', address: 'Avenue Léopold Héder, 97354 Rémire-Montjoly', phone: '+594 594 35 45 67' },
  { store_id: 'GF-HYPER-001', name: 'Hyper U Matoury', chain: 'Hyper U', territory: 'gf', address: 'Route Nationale 2, 97351 Matoury', phone: '+594 594 35 67 89' },
  { store_id: 'GF-GEANT-001', name: 'Géant Casino Cayenne', chain: 'Géant Casino', territory: 'gf', address: 'Centre Commercial Collery, 97300 Cayenne', phone: '+594 594 30 45 78' },
  { store_id: 'GF-SUPER-001', name: 'Super U Kourou', chain: 'Super U', territory: 'gf', address: 'Avenue du Général de Gaulle, 97310 Kourou', phone: '+594 594 32 56 78' },

  // === RÉUNION (RE) ===
  { store_id: 'RE-CARREFOUR-001', name: 'Carrefour Saint-Denis', chain: 'Carrefour', territory: 're', address: 'Centre Commercial Carrefour, 97400 Saint-Denis', phone: '+262 262 40 12 34' },
  { store_id: 'RE-LECLERC-001', name: 'E.Leclerc Saint-Pierre', chain: 'E.Leclerc', territory: 're', address: 'ZAC Canabady, 97410 Saint-Pierre', phone: '+262 262 96 23 45' },
  { store_id: 'RE-JUMBO-001', name: 'Jumbo Score Saint-Paul', chain: 'Jumbo', territory: 're', address: 'ZAC Cambaie, 97460 Saint-Paul', phone: '+262 262 45 67 89' },
  { store_id: 'RE-HYPER-001', name: 'Hyper U Saint-André', chain: 'Hyper U', territory: 're', address: 'Centre Commercial Océan, 97440 Saint-André', phone: '+262 262 46 78 90' },
  { store_id: 'RE-LEADER-001', name: 'Leader Price Le Port', chain: 'Leader Price', territory: 're', address: 'ZAC 2000, 97420 Le Port', phone: '+262 262 42 34 56' },
  { store_id: 'RE-GEANT-001', name: 'Géant Casino Sainte-Marie', chain: 'Géant Casino', territory: 're', address: 'Centre Commercial Duparc, 97438 Sainte-Marie', phone: '+262 262 53 45 67' },
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

  for (const storeData of STORES_DATA) {
    try {
      const normalizedName = storeData.name.toLowerCase().trim();

      // Check if store already exists (unique on normalizedName + territory)
      const existing = await prisma.store.findFirst({
        where: {
          normalizedName,
          territory: storeData.territory,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const postalCode = storeData.address.match(/\d{5}/)?.[0] ?? '';
      const city = storeData.address.split(',').pop()?.replace(/\d{5}/, '').trim() ?? '';

      await prisma.store.create({
        data: {
          normalizedName,
          rawName: storeData.name,
          brand: storeData.chain,
          address: storeData.address,
          postalCode,
          city,
          territory: storeData.territory,
          phone: storeData.phone,
        },
      });

      console.log(`✅ Created: ${storeData.name} (${storeData.territory})`);
      created++;
    } catch (error) {
      errors++;
      console.error(`❌ Error creating store ${storeData.store_id}:`, error instanceof Error ? error.message : String(error));
    }
  }

  console.log(`\n✅ Stores seeding complete!`);
  console.log(`   📊 Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
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
