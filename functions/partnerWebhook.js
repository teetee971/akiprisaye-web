/**
 * Firebase Cloud Function for Partner Webhook Integration
 * 
 * DEPLOYMENT:
 * 1. Set partner keys: firebase functions:config:set partners.keys="KEY1,KEY2,KEY3"
 * 2. Deploy: firebase deploy --only functions:partnerWebhook
 * 
 * USAGE:
 * Partners send POST requests to this endpoint with their API key
 * 
 * Example curl command:
 * curl -X POST https://YOUR-PROJECT.cloudfunctions.net/partnerWebhook \
 *   -H "x-partner-key: KEY1" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "store": "Carrefour Destrellan",
 *     "territory": "Guadeloupe",
 *     "title": "Panier Fruits Bio",
 *     "price": 6.50,
 *     "estimatedValue": 12.00,
 *     "stock": 15,
 *     "items": ["bananes", "tomates", "salade"],
 *     "pickupWindow": "17:00-19:00",
 *     "lat": 16.262,
 *     "lon": -61.583,
 *     "img": "/img/panie-fruits.jpg"
 *   }'
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Webhook endpoint for partner integrations
 * Allows stores to push basket updates directly
 */
exports.partnerWebhook = functions.https.onRequest(async (req, res) => {
  // Enable CORS for specific domains
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, x-partner-key');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate partner key
    const partnerKey = req.headers['x-partner-key'];
    const allowedKeys = functions.config().partners?.keys?.split(',') || [];

    if (!partnerKey || !allowedKeys.includes(partnerKey)) {
      console.warn('Invalid partner key attempted:', partnerKey);
      return res.status(403).json({ error: 'Invalid or missing partner key' });
    }

    // Validate payload
    const data = req.body;
    const requiredFields = ['store', 'territory', 'title', 'price', 'items'];
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields,
        requiredFields,
      });
    }

    // Validate items is an array
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return res.status(400).json({
        error: 'Items must be a non-empty array',
      });
    }

    // Prepare basket document
    const basketData = {
      store: data.store,
      territory: data.territory,
      title: data.title,
      price: parseFloat(data.price),
      estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : parseFloat(data.price) * 1.5,
      stock: data.stock || 10,
      items: data.items,
      pickupWindow: data.pickupWindow || '17:00-19:00',
      lat: data.lat || 0,
      lon: data.lon || 0,
      img: data.img || '/img/panie-default.jpg',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'partner-webhook',
      partnerKey: partnerKey.substring(0, 8) + '...', // Store partial key for audit
    };

    // Check if basket already exists (by store + title)
    const existingBasket = await admin
      .firestore()
      .collection('ti_panie')
      .where('store', '==', basketData.store)
      .where('title', '==', basketData.title)
      .limit(1)
      .get();

    let docRef;
    if (!existingBasket.empty) {
      // Update existing basket
      docRef = existingBasket.docs[0].ref;
      await docRef.update({
        ...basketData,
        createdAt: existingBasket.docs[0].data().createdAt, // Preserve original creation date
      });
    } else {
      // Create new basket
      docRef = await admin.firestore().collection('ti_panie').add(basketData);
    }

    // Log successful update
    console.log('Partner webhook processed:', {
      id: docRef.id,
      store: basketData.store,
      title: basketData.title,
      action: existingBasket.empty ? 'created' : 'updated',
    });

    return res.status(200).json({
      ok: true,
      id: docRef.id,
      action: existingBasket.empty ? 'created' : 'updated',
      message: 'Basket processed successfully',
    });
  } catch (error) {
    console.error('Error in partner webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * Get partner API stats (admin only)
 */
exports.getPartnerStats = functions.https.onCall(async (data, context) => {
  // Check admin
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  try {
    const snapshot = await admin
      .firestore()
      .collection('ti_panie')
      .where('source', '==', 'partner-webhook')
      .get();

    const stats = {
      total: snapshot.size,
      byStore: {},
    };

    snapshot.forEach((doc) => {
      const store = doc.data().store;
      stats.byStore[store] = (stats.byStore[store] || 0) + 1;
    });

    return stats;
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
