/**
 * Firebase Cloud Function for AI Market Insights
 * 
 * DEPLOYMENT:
 * 1. Install dependencies: npm install luxon
 * 2. Deploy: firebase deploy --only functions:aiMarketInsights
 * 
 * SCHEDULE:
 * Runs daily at midnight Paris time to calculate:
 * - Price differences between DOM (Overseas) and Hexagon (mainland France)
 * - "Cost of Living" index by territory
 * - Category-specific price gaps
 * - Economic alerts
 * 
 * DATA SOURCES:
 * - ti_panie: DOM prices (actual baskets)
 * - ti_panie_ref: Reference prices from mainland France
 * 
 * OUTPUT:
 * - market_insights/latest: Latest analysis results
 * - market_insights/{date}: Historical snapshots
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { DateTime } = require('luxon');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * AI Market Insights - Daily analysis
 * Calculates price differences and cost of living index
 */
exports.aiMarketInsights = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('Europe/Paris')
  .onRun(async (_context) => {
    const db = admin.firestore();
    
    console.log('Starting AI Market Insights analysis...');

    try {
      // Fetch DOM (overseas territories) prices
      const domSnapshot = await db.collection('ti_panie').get();
      
      // Fetch reference prices from mainland France
      // Note: ti_panie_ref collection should be populated with reference prices
      const hexSnapshot = await db.collection('ti_panie_ref').get();

      if (domSnapshot.empty) {
        console.log('No DOM prices available');
        return null;
      }

      const domData = domSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const hexData = hexSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Group by category and calculate differences
      const byCategory = {};
      const byTerritory = {};

      for (const product of domData) {
        // Find matching reference product from mainland
        const reference = hexData.find(
          (r) => r.title === product.title || r.category === product.category,
        );

        const category = product.category || 'Autres';
        const territory = product.territory || 'Unknown';

        // Initialize category if needed
        if (!byCategory[category]) {
          byCategory[category] = { diffSum: 0, count: 0, products: [] };
        }

        // Initialize territory if needed
        if (!byTerritory[territory]) {
          byTerritory[territory] = { diffSum: 0, count: 0 };
        }

        // Calculate price difference if reference exists
        if (reference && reference.price && product.price) {
          const priceDiff = ((product.price - reference.price) / reference.price) * 100;
          
          byCategory[category].diffSum += priceDiff;
          byCategory[category].count++;
          byCategory[category].products.push({
            title: product.title,
            domPrice: product.price,
            hexPrice: reference.price,
            diff: priceDiff,
          });

          byTerritory[territory].diffSum += priceDiff;
          byTerritory[territory].count++;
        }
      }

      // Calculate averages by category
      const categoryResults = Object.entries(byCategory).map(([cat, data]) => ({
        category: cat,
        avgDiff: data.count > 0 ? data.diffSum / data.count : 0,
        productCount: data.count,
        topGaps: data.products
          .sort((a, b) => b.diff - a.diff)
          .slice(0, 5) // Top 5 products with highest price gap
          .map((p) => ({
            title: p.title,
            diff: parseFloat(p.diff.toFixed(2)),
            domPrice: p.domPrice,
            hexPrice: p.hexPrice,
          })),
      }));

      // Calculate averages by territory
      const territoryResults = Object.entries(byTerritory).map(([terr, data]) => ({
        territory: terr,
        avgDiff: data.count > 0 ? data.diffSum / data.count : 0,
        productCount: data.count,
      }));

      // Calculate global index (weighted average)
      const globalIndex =
        categoryResults.length > 0
          ? categoryResults.reduce((sum, cat) => sum + cat.avgDiff, 0) / categoryResults.length
          : 0;

      // Generate alert level
      let alert, alertLevel;
      if (globalIndex > 30) {
        alert = '🔴 Niveau très élevé de vie chère détecté';
        alertLevel = 'critical';
      } else if (globalIndex > 15) {
        alert = '🟠 Niveau modéré de vie chère';
        alertLevel = 'moderate';
      } else {
        alert = '🟢 Niveau de vie chère maîtrisé';
        alertLevel = 'good';
      }

      // Generate AI recommendations
      const recommendations = [];
      
      if (globalIndex > 30) {
        recommendations.push(
          'Les produits alimentaires et ménagers présentent une forte inflation locale.',
          'Renforcez les partenariats anti-gaspillage et Ti-Panié solidaire.',
          'Alertez les consommateurs sur les écarts de prix importants.',
        );
      } else if (globalIndex > 15) {
        recommendations.push(
          'Les écarts restent modérés mais constants.',
          'Optimisez la logistique locale et le regroupement des commandes.',
          'Surveillez les catégories à forte variation.',
        );
      } else {
        recommendations.push(
          'Les prix sont globalement stables.',
          'Continuez le suivi IA et la veille tarifaire.',
          'Maintenez la qualité des partenariats locaux.',
        );
      }

      // Prepare insights document
      const insights = {
        date: DateTime.now().toISO(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        globalIndex: parseFloat(globalIndex.toFixed(2)),
        alert,
        alertLevel,
        recommendations,
        byCategory: categoryResults,
        byTerritory: territoryResults,
        metadata: {
          domProductsCount: domData.length,
          hexProductsCount: hexData.length,
          categoriesAnalyzed: categoryResults.length,
          territoriesAnalyzed: territoryResults.length,
        },
      };

      // Save latest insights
      await db.collection('market_insights').doc('latest').set(insights);

      // Save historical snapshot
      const dateKey = DateTime.now().toFormat('yyyy-MM-dd');
      await db.collection('market_insights').doc(dateKey).set(insights);

      console.log('AI Market Insights completed:', {
        globalIndex: insights.globalIndex,
        alert: insights.alert,
        categories: categoryResults.length,
        territories: territoryResults.length,
      });

      return insights;
    } catch (error) {
      console.error('Error in AI Market Insights:', error);
      
      // Log error
      await db.collection('market_insights').doc('latest').set(
        {
          error: error.message,
          errorTimestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'failed',
        },
        { merge: true },
      );

      throw error;
    }
  });

/**
 * Manual trigger for market insights (admin only)
 */
exports.triggerMarketInsights = functions.https.onCall(async (data, context) => {
  // Check admin
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  try {
    // Trigger the scheduled function logic
    // (In production, you'd extract the logic to a shared function)
    const db = admin.firestore();
    
    // Simplified version - just return latest data or trigger new analysis
    const latestDoc = await db.collection('market_insights').doc('latest').get();
    
    if (latestDoc.exists()) {
      return {
        ok: true,
        message: 'Latest insights retrieved',
        data: latestDoc.data(),
      };
    }

    return {
      ok: false,
      message: 'No insights available. Scheduled function will run daily.',
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Get historical insights (admin only)
 */
exports.getInsightsHistory = functions.https.onCall(async (data, context) => {
  // Check admin
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  try {
    const { days = 30 } = data;
    const db = admin.firestore();

    const snapshot = await db
      .collection('market_insights')
      .orderBy('timestamp', 'desc')
      .limit(days)
      .get();

    const history = snapshot.docs
      .filter((doc) => doc.id !== 'latest') // Exclude the 'latest' document
      .map((doc) => ({
        date: doc.id,
        ...doc.data(),
      }));

    return { ok: true, history };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
