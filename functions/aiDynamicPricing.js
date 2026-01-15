/**
 * Firebase Cloud Function for AI Dynamic Pricing
 * 
 * DEPLOYMENT:
 * 1. Install dependencies: npm install luxon
 * 2. Deploy: firebase deploy --only functions:aiDynamicPricing
 * 
 * SCHEDULE:
 * Runs every 6 hours to adjust basket prices based on:
 * - Current stock levels
 * - Forecast predictions
 * - Demand trends
 * 
 * ALGORITHM:
 * - If forecast < 3 units: Reduce price by 10% (clear stock)
 * - If forecast > 10 units: Increase price by 5% (high demand)
 * - Otherwise: Keep current price
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { DateTime } = require('luxon');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * AI Dynamic Pricing - Scheduled function
 * Adjusts basket prices based on forecast and stock levels
 */
exports.aiDynamicPricing = functions.pubsub
  .schedule('every 6 hours')
  .timeZone('America/Guadeloupe')
  .onRun(async (_context) => {
    const db = admin.firestore();
    
    console.log('Starting AI Dynamic Pricing job...');

    try {
      // Get all baskets
      const basketsSnapshot = await db.collection('ti_panie').get();
      
      if (basketsSnapshot.empty) {
        console.log('No baskets to process');
        return null;
      }

      let processedCount = 0;
      let adjustedCount = 0;
      const adjustments = [];

      // Process each basket
      for (const basketDoc of basketsSnapshot.docs) {
        const basket = basketDoc.data();
        processedCount++;

        // Skip if basket doesn't have necessary data
        if (!basket.price || !basket.store) {
          continue;
        }

        // Get forecast for this basket
        const forecastSnapshot = await db
          .collection('ti_panie_forecast')
          .where('store', '==', basket.store)
          .where('territory', '==', basket.territory)
          .orderBy('date', 'desc')
          .limit(1)
          .get();

        // Determine forecast value (fallback to current stock)
        const forecastValue = !forecastSnapshot.empty
          ? forecastSnapshot.docs[0].data().forecast
          : basket.stock || 5;

        // Calculate new price based on forecast
        let newPrice = basket.price;
        let adjustmentReason = 'no-change';

        if (forecastValue < 3) {
          // Low forecast - reduce price to clear stock
          newPrice = basket.price * 0.9;
          adjustmentReason = 'low-forecast-clearance';
        } else if (forecastValue > 10) {
          // High forecast/demand - increase price
          newPrice = basket.price * 1.05;
          adjustmentReason = 'high-demand';
        }

        // Only update if price changed significantly (> 0.01€)
        if (Math.abs(newPrice - basket.price) > 0.01) {
          const finalPrice = parseFloat(newPrice.toFixed(2));
          
          await basketDoc.ref.update({
            price: finalPrice,
            previousPrice: basket.price,
            aiAdjustedAt: DateTime.now().toISO(),
            aiAdjustmentReason: adjustmentReason,
            aiAdjustmentForecast: forecastValue,
          });

          adjustedCount++;
          adjustments.push({
            id: basketDoc.id,
            store: basket.store,
            title: basket.title || 'Untitled',
            oldPrice: basket.price,
            newPrice: finalPrice,
            reason: adjustmentReason,
            forecast: forecastValue,
          });

          console.log(`Adjusted ${basket.store}: ${basket.price}€ → ${finalPrice}€ (${adjustmentReason})`);
        }
      }

      // Log summary
      console.log('AI Dynamic Pricing completed:', {
        processed: processedCount,
        adjusted: adjustedCount,
        timestamp: DateTime.now().toISO(),
      });

      // Store job result in Firestore for admin dashboard
      await db.collection('ai_pricing_jobs').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        processedCount,
        adjustedCount,
        adjustments: adjustments.slice(0, 50), // Store first 50 adjustments
      });

      return { processed: processedCount, adjusted: adjustedCount };
    } catch (error) {
      console.error('Error in AI Dynamic Pricing:', error);
      
      // Log error to Firestore
      await db.collection('ai_pricing_jobs').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        error: error.message,
        status: 'failed',
      });

      throw error;
    }
  });

/**
 * Manual trigger for AI pricing (admin only)
 * Allows admins to run pricing update on demand
 */
exports.triggerAiPricing = functions.https.onCall(async (data, context) => {
  // Check admin
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  try {
    // Re-use the same logic as scheduled function
    const db = admin.firestore();
    const basketsSnapshot = await db.collection('ti_panie').get();
    
    let adjustedCount = 0;

    for (const basketDoc of basketsSnapshot.docs) {
      const basket = basketDoc.data();
      
      if (!basket.price || !basket.store) continue;

      const forecastSnapshot = await db
        .collection('ti_panie_forecast')
        .where('store', '==', basket.store)
        .where('territory', '==', basket.territory)
        .limit(1)
        .get();

      const forecastValue = !forecastSnapshot.empty
        ? forecastSnapshot.docs[0].data().forecast
        : basket.stock || 5;

      let newPrice = basket.price;
      let adjustmentReason = 'no-change';

      if (forecastValue < 3) {
        newPrice = basket.price * 0.9;
        adjustmentReason = 'low-forecast-clearance';
      } else if (forecastValue > 10) {
        newPrice = basket.price * 1.05;
        adjustmentReason = 'high-demand';
      }

      if (Math.abs(newPrice - basket.price) > 0.01) {
        await basketDoc.ref.update({
          price: parseFloat(newPrice.toFixed(2)),
          previousPrice: basket.price,
          aiAdjustedAt: DateTime.now().toISO(),
          aiAdjustmentReason: adjustmentReason,
          aiAdjustmentForecast: forecastValue,
        });
        adjustedCount++;
      }
    }

    return {
      ok: true,
      message: `Pricing updated for ${adjustedCount} baskets`,
      adjustedCount,
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
