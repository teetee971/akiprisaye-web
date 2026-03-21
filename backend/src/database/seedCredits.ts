/**
 * Script de seed pour le système de crédits
 * A KI PRI SA YÉ - Version 1.0.0
 * 
 * Initialise:
 * - Offres marketplace par défaut
 * - Configuration badges
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding credits system data...');

  // Note: marketplace offers seed skipped — DEFAULT_MARKETPLACE_OFFERS uses a legacy interface
  // that does not match the current Prisma marketplaceOffer schema (sellerId, productId, title, price, quantity).
  // Seed marketplace offers manually via the admin API or a dedicated migration script.
  console.log('ℹ️  Marketplace offers seed skipped (schema mismatch — use admin API to seed offers)');

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
