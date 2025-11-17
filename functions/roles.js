/**
 * Firebase Cloud Functions for Role Management
 * 
 * DEPLOYMENT:
 * 1. Install dependencies: cd functions && npm install firebase-functions firebase-admin
 * 2. Deploy: firebase deploy --only functions:setUserRole
 * 
 * USAGE:
 * Call from frontend using Firebase callable functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Set user role via custom claims
 * Only admins can call this function
 * 
 * @param {Object} data - { uid: string, role: string }
 * @param {Object} context - Firebase auth context
 * @returns {Object} { ok: boolean }
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Check if caller is authenticated and is admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to call this function',
    );
  }

  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set user roles',
    );
  }

  const { uid, role } = data;

  // Validate role
  const validRoles = ['admin', 'partner', 'editor', 'user'];
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Role must be one of: ${validRoles.join(', ')}`,
    );
  }

  try {
    // Set custom claims
    const claims = { [role]: true };
    await admin.auth().setCustomUserClaims(uid, claims);

    // Also save to Firestore for backup/querying
    await admin.firestore().collection('users').doc(uid).set(
      {
        role,
        roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        roleUpdatedBy: context.auth.uid,
      },
      { merge: true },
    );

    return { ok: true, message: `Role ${role} set successfully for user ${uid}` };
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Get user role (for debugging/admin purposes)
 * 
 * @param {Object} data - { uid: string }
 * @param {Object} context - Firebase auth context
 * @returns {Object} { role: string, claims: Object }
 */
exports.getUserRole = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated',
    );
  }

  // Only admins can query other users, users can query themselves
  const { uid } = data;
  if (context.auth.uid !== uid && !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Can only query your own role unless you are an admin',
    );
  }

  try {
    const user = await admin.auth().getUser(uid);
    const userDoc = await admin.firestore().collection('users').doc(uid).get();

    return {
      claims: user.customClaims || {},
      firestoreRole: userDoc.data()?.role || null,
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
