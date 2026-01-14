/**
 * Script de seed pour le système de crédits
 * A KI PRI SA YÉ - Version 1.0.0
 * 
 * Initialise:
 * - Offres marketplace par défaut
 * - Configuration badges
 */

import { PrismaClient } from '@prisma/client';
import { DEFAULT_MARKETPLACE_OFFERS } from '../config/marketplaceOffers.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding credits system data...');

  // Seed marketplace offers
  console.log('📦 Seeding marketplace offers...');
  
  for (const offer of DEFAULT_MARKETPLACE_OFFERS) {
    await prisma.marketplaceOffer.upsert({
      where: {
        // Use a compound key based on type and name
        id: `${offer.type}-${offer.name}`.toLowerCase().replace(/\s+/g, '-'),
      },
      update: {
        ...offer,
        type: offer.type.toUpperCase() as any,
      },
      create: {
        id: `${offer.type}-${offer.name}`.toLowerCase().replace(/\s+/g, '-'),
        ...offer,
        type: offer.type.toUpperCase() as any,
      },
    });
  }
  
  console.log(`✅ Seeded ${DEFAULT_MARKETPLACE_OFFERS.length} marketplace offers`);
  
  // Log summary
  const offersCount = await prisma.marketplaceOffer.count();
  console.log(`\n📊 Database summary:`);
  console.log(`   - Marketplace offers: ${offersCount}`);
  
  console.log('\n✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
