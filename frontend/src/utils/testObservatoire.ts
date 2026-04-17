/**
 * Test utility to verify observatoire data loading and processing
 */

import {
  loadObservatoireData,
  calculateStatistics,
  calculatePriceChange,
  getDispersionByStore,
  exportToCSV,
} from '../services/observatoireDataLoader';

/**
 * Test the observatoire data loader
 */
export async function testObservatoireDataLoader() {
  console.log('🧪 Testing Observatoire Data Loader...\n');

  try {
    // Load data
    console.log('📥 Loading Guadeloupe data...');
    const snapshots = await loadObservatoireData('Guadeloupe');

    if (snapshots.length === 0) {
      console.error('❌ No data loaded');
      return false;
    }

    console.log(`✅ Loaded ${snapshots.length} snapshot(s)`);
    console.log(
      `   - Snapshot 1: ${snapshots[0].date_snapshot} (${snapshots[0].donnees.length} observations)`
    );
    if (snapshots.length > 1) {
      console.log(
        `   - Snapshot 2: ${snapshots[1].date_snapshot} (${snapshots[1].donnees.length} observations)`
      );
    }

    // Calculate statistics
    console.log('\n📊 Calculating statistics...');
    const stats = calculateStatistics(snapshots);
    console.log(`✅ Generated statistics for ${stats.length} products:`);
    stats.forEach((stat) => {
      console.log(
        `   - ${stat.productName}: ${stat.avgPrice}€ (min: ${stat.minPrice}€, max: ${stat.maxPrice}€)`
      );
    });

    // Calculate price changes if we have multiple snapshots
    if (snapshots.length >= 2) {
      console.log('\n📈 Calculating price changes...');
      const changes = calculatePriceChange(snapshots[0], snapshots[1]);
      console.log(`✅ Detected price changes for ${changes.size} products:`);
      changes.forEach((change, product) => {
        const direction = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
        console.log(`   ${direction} ${product}: ${change > 0 ? '+' : ''}${change}%`);
      });
    }

    // Calculate dispersion
    console.log('\n📊 Calculating price dispersion between stores...');
    const dispersion = getDispersionByStore(snapshots[0]);
    console.log(`✅ Dispersion data for ${dispersion.size} products:`);
    dispersion.forEach((disp, product) => {
      console.log(`   - ${product}: écart de ${disp.variance}€ (${disp.min}€ → ${disp.max}€)`);
    });

    // Test CSV export
    console.log('\n📄 Testing CSV export...');
    const csv = exportToCSV(stats);
    console.log(`✅ CSV generated (${csv.length} characters)`);
    console.log('   First lines:');
    console.log('   ' + csv.split('\n').slice(0, 3).join('\n   '));

    console.log('\n✅ All tests passed!\n');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

/**
 * Get summary for display in Observatory Dashboard
 */
export async function getObservatoireSummary(territory: string = 'Guadeloupe') {
  const snapshots = await loadObservatoireData(territory);

  if (snapshots.length === 0) {
    return {
      available: false,
      message: 'Aucune donnée disponible pour ce territoire',
    };
  }

  const stats = calculateStatistics(snapshots);
  const latestSnapshot = snapshots[snapshots.length - 1];

  // Calculate overall metrics
  const avgOverall = stats.reduce((sum, s) => sum + s.avgPrice, 0) / stats.length;
  const totalObservations = stats.reduce((sum, s) => sum + s.observations, 0);

  let priceEvolution = null;
  if (snapshots.length >= 2) {
    const changes = calculatePriceChange(snapshots[0], snapshots[1]);
    const avgChange = Array.from(changes.values()).reduce((sum, c) => sum + c, 0) / changes.size;
    priceEvolution = {
      percentage: Math.round(avgChange * 10) / 10,
      direction: avgChange > 0 ? 'hausse' : avgChange < 0 ? 'baisse' : 'stable',
    };
  }

  // Get dispersion info
  const dispersion = getDispersionByStore(latestSnapshot);
  const avgDispersion =
    Array.from(dispersion.values()).reduce((sum, d) => sum + d.variance, 0) / dispersion.size;

  return {
    available: true,
    territory: latestSnapshot.territoire,
    lastUpdate: latestSnapshot.date_snapshot,
    productsTracked: stats.length,
    totalObservations,
    avgPrice: Math.round(avgOverall * 100) / 100,
    priceEvolution,
    avgDispersion: Math.round(avgDispersion * 100) / 100,
    stats,
  };
}
