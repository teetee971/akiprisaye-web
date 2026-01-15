/**
 * Firestore helper for Cloudflare Functions
 * 
 * IMPORTANT: This requires proper Firebase Admin SDK setup in Cloudflare environment.
 * Current implementation is a placeholder that needs to be replaced with one of:
 * 
 * 1. Firebase Admin SDK with service account credentials (recommended)
 * 2. Firestore REST API with authentication
 * 3. Cloud Functions proxy for Firestore operations
 * 
 * Setup instructions:
 * - Add FIREBASE_PROJECT_ID to Cloudflare environment variables
 * - Add Firebase service account credentials as secrets
 * - Install firebase-admin package if using Admin SDK
 */

/**
 * Initialize Firestore (admin)
 * 
 * TODO: Replace with actual Firestore initialization
 * Example with REST API:
 * 
 * const projectId = context.env.FIREBASE_PROJECT_ID;
 * const apiKey = context.env.FIREBASE_API_KEY;
 * const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
 */
export async function getFirestore() {
  // Placeholder that will be replaced with actual implementation
  // For now, operations will fall back gracefully
  const _projectId = process.env.FIREBASE_PROJECT_ID || 'akiprisaye-web';
  
  return {
    collection: (name) => ({
      add: async (_data) => {
        // TODO: Implement actual Firestore REST API call or Admin SDK
        // This placeholder allows the code to run without crashing
        // Operations will log fallback messages
        console.warn(`Firestore operation skipped (not configured): add to ${name}`);
        return { id: `temp_${Date.now()}` };
      },
    }),
  };
}

/**
 * Save contact message to Firestore
 * @param {Object} message - Contact message data
 * @returns {Promise<string>} Document ID
 */
export async function saveContactMessage(message) {
  const db = await getFirestore();
  
  const contactMessage = {
    ...message,
    createdAt: new Date().toISOString(),
    status: 'new',
  };
  
  try {
    const docRef = await db.collection('contact_messages').add(contactMessage);
    return docRef.id;
  } catch (error) {
    // Graceful fallback: log error and return temporary ID
    console.error(`Failed to save contact message: ${error.message}`);
    throw error;
  }
}

/**
 * Save receipt data to Firestore
 * @param {Object} receipt - Receipt data from OCR
 * @returns {Promise<string>} Document ID
 */
export async function saveReceipt(receipt) {
  const db = await getFirestore();
  
  const receiptDoc = {
    ...receipt,
    createdAt: new Date().toISOString(),
    verified: false,
    confidenceScore: receipt.confidence || 0,
  };
  
  try {
    const docRef = await db.collection('receipts').add(receiptDoc);
    return docRef.id;
  } catch (error) {
    // Graceful fallback: log error and return temporary ID
    console.error(`Failed to save receipt: ${error.message}`);
    throw error;
  }
}
