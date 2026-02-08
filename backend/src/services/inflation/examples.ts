/**
 * Inflation Services Examples
 * 
 * This file demonstrates how to use the inflation dashboard services.
 * Run with: npx tsx src/services/inflation/examples.ts
 */

import {
  // Price Index
  calculatePriceIndex,
  savePriceIndex,
  calculateAllIndices,
  
  // Metro Comparison
  getMetroComparison,
  getAllMetroComparisons,
  getMetroGapTrend,
  
  // Category Analysis
  getCategoryInflation,
  getAllCategoriesInflation,
  getCategoryExtremes,
  
  // Top Movers
  getTopMovers,
  getPriceAlerts,
  
  // History
  getInflationHistory,
  getInflationForecast,
  
  // Export
  exportInflationData,
  
  // Press Kit
  generatePressKit,
  savePressKit,
} from './index.js';

/**
 * Example 1: Calculate price indices for all territories
 */
async function example1_calculateIndices() {
  console.log('\n=== Example 1: Calculate Price Indices ===');
  
  const period = '2026-02';
  const indices = await calculateAllIndices(period);
  
  console.log(`Calculated ${indices.length} indices for ${period}`);
  indices.forEach(index => {
    console.log(`${index.territory}: ${index.indexValue} (${index.yearlyChange >= 0 ? '+' : ''}${index.yearlyChange}%)`);
  });
}

/**
 * Example 2: Compare with metropolitan France
 */
async function example2_metroComparison() {
  console.log('\n=== Example 2: Metro Comparison ===');
  
  const comparison = await getMetroComparison('GP', '2026-02');
  
  console.log(`Territory: ${comparison.territoryName}`);
  console.log(`DOM Index: ${comparison.domIndex}`);
  console.log(`Metro Index: ${comparison.metroIndex}`);
  console.log(`Price Gap: ${comparison.overallGap}%`);
  console.log(`Basket Price Gap: ${comparison.basketPriceGap}€`);
  
  console.log('\nTop 3 categories with biggest gaps:');
  comparison.categoryComparison.slice(0, 3).forEach(cat => {
    console.log(`  ${cat.categoryName}: +${cat.gap}% (${cat.gapAmount}€)`);
  });
}

/**
 * Example 3: Analyze categories
 */
async function example3_categoryAnalysis() {
  console.log('\n=== Example 3: Category Analysis ===');
  
  const categories = await getAllCategoriesInflation('MQ', '2026-02');
  
  console.log(`Found ${categories.length} categories`);
  console.log('\nCategories by inflation:');
  categories.forEach(cat => {
    console.log(`  ${cat.icon} ${cat.categoryName}: ${cat.yearlyChange >= 0 ? '+' : ''}${cat.yearlyChange}%`);
  });
  
  const extremes = await getCategoryExtremes('MQ', '2026-02');
  console.log('\nExtremes:');
  console.log(`  Highest: ${extremes.highest?.categoryName} (${extremes.highest?.yearlyChange}%)`);
  console.log(`  Lowest: ${extremes.lowest?.categoryName} (${extremes.lowest?.yearlyChange}%)`);
}

/**
 * Example 4: Track top movers
 */
async function example4_topMovers() {
  console.log('\n=== Example 4: Top Price Movers ===');
  
  const movers = await getTopMovers('RE', '2026-02', 5);
  
  console.log('Top 5 Price Increases:');
  movers.topIncreases.forEach((mover, i) => {
    console.log(`  ${i + 1}. ${mover.productName}: ${mover.oldPrice}€ → ${mover.newPrice}€ (+${mover.change}%)`);
  });
  
  console.log('\nTop 5 Price Decreases:');
  movers.topDecreases.forEach((mover, i) => {
    console.log(`  ${i + 1}. ${mover.productName}: ${mover.oldPrice}€ → ${mover.newPrice}€ (${mover.change}%)`);
  });
  
  // Get price alerts (changes > 10%)
  const alerts = await getPriceAlerts('RE', '2026-02', 10);
  console.log(`\nPrice Alerts (>10%): ${alerts.length} products`);
}

/**
 * Example 5: Historical data and forecasts
 */
async function example5_history() {
  console.log('\n=== Example 5: Historical Data & Forecasts ===');
  
  const history = await getInflationHistory('GF', '2025-06', '2026-02');
  
  console.log(`Territory: ${history.territoryName}`);
  console.log(`Period: ${history.startPeriod} to ${history.endPeriod}`);
  console.log(`Average Inflation: ${history.averageInflation}%`);
  console.log(`Range: ${history.minInflation}% to ${history.maxInflation}%`);
  console.log(`Trend: ${history.trend}`);
  
  console.log('\nLast 3 months:');
  history.dataPoints.slice(-3).forEach(point => {
    console.log(`  ${point.period}: ${point.yearlyChange}%`);
  });
  
  // Generate 3-month forecast
  const forecast = await getInflationForecast('GF', '2026-02', 3);
  console.log('\n3-Month Forecast:');
  forecast.forecasts.forEach(f => {
    console.log(`  ${f.period}: ${f.predictedInflation}% (confidence: ${f.confidence}%)`);
  });
}

/**
 * Example 6: Export data
 */
async function example6_export() {
  console.log('\n=== Example 6: Export Data ===');
  
  // Export as JSON
  const jsonExport = await exportInflationData({
    format: 'json',
    type: 'indices',
    period: '2026-02',
  });
  console.log(`JSON Export: ${jsonExport.filename} (${jsonExport.data.toString().length} bytes)`);
  
  // Export as CSV
  const csvExport = await exportInflationData({
    format: 'csv',
    type: 'metro-comparison',
    territory: 'YT',
    period: '2026-02',
  });
  console.log(`CSV Export: ${csvExport.filename} (${csvExport.data.toString().length} bytes)`);
  
  // Export as XLSX
  const xlsxExport = await exportInflationData({
    format: 'xlsx',
    type: 'full-report',
    territory: 'GP',
    period: '2026-02',
  });
  console.log(`XLSX Export: ${xlsxExport.filename} (${(xlsxExport.data as Buffer).length} bytes)`);
}

/**
 * Example 7: Generate press kit
 */
async function example7_pressKit() {
  console.log('\n=== Example 7: Press Kit Generation ===');
  
  const pressKit = await generatePressKit('2026-02');
  
  console.log(`Title: ${pressKit.title}`);
  console.log(`Subtitle: ${pressKit.subtitle}`);
  console.log(`Generated: ${pressKit.generatedAt.toISOString()}`);
  
  console.log(`\nHighlights (${pressKit.highlights.length}):`);
  pressKit.highlights.forEach(h => {
    console.log(`  [${h.severity.toUpperCase()}] ${h.title}: ${h.value} - ${h.context}`);
  });
  
  console.log(`\nSections (${pressKit.sections.length}):`);
  pressKit.sections.forEach(s => {
    console.log(`  - ${s.title}`);
    console.log(`    ${s.summary}`);
  });
  
  // Save to database
  await savePressKit(pressKit);
  console.log('\nPress kit saved to database');
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await example1_calculateIndices();
    await example2_metroComparison();
    await example3_categoryAnalysis();
    await example4_topMovers();
    await example5_history();
    await example6_export();
    await example7_pressKit();
    
    console.log('\n=== All examples completed successfully! ===\n');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
// To run: npx tsx src/services/inflation/examples.ts
if (require.main === module || (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('examples.ts'))) {
  runAllExamples();
}

export {
  example1_calculateIndices,
  example2_metroComparison,
  example3_categoryAnalysis,
  example4_topMovers,
  example5_history,
  example6_export,
  example7_pressKit,
};
