const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function pour attribuer le rôle admin à un utilisateur
 * Utilisation: https://your-project.cloudfunctions.net/setAdminRole?uid=USER_UID&admin=true
 * 
 * Sécurité: Cette fonction devrait être sécurisée en production
 * avec une vérification d'authentification appropriée
 */
exports.setAdminRole = functions.https.onRequest(async (req, res) => {
  // ATTENTION: En production, ajoutez une vérification d'authentification ici
  // Par exemple, vérifier que l'utilisateur qui fait la demande est déjà admin
  
  const { uid, admin: isAdmin } = req.query;
  
  if (!uid) {
    return res.status(400).json({ error: 'UID utilisateur requis' });
  }

  try {
    // Attribuer ou retirer le rôle admin
    await admin.auth().setCustomUserClaims(uid, { 
      admin: isAdmin === 'true' 
    });
    
    res.json({ 
      success: true, 
      message: `Rôle admin ${isAdmin === 'true' ? 'attribué' : 'retiré'} pour l'utilisateur ${uid}` 
    });
  } catch (error) {
    console.error('Erreur lors de l\'attribution du rôle admin:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * Cloud Function pour créer un utilisateur admin
 * Utilisation: POST avec { email, password } dans le body
 */
exports.createAdminUser = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    // Créer l'utilisateur
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: true
    });
    
    // Attribuer le rôle admin
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    res.json({ 
      success: true, 
      uid: userRecord.uid,
      email: userRecord.email,
      message: 'Utilisateur admin créé avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur admin:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cloud Function pour lister les utilisateurs admin
 */
exports.listAdminUsers = functions.https.onRequest(async (req, res) => {
  try {
    const listUsers = await admin.auth().listUsers();
    const adminUsers = [];
    
    for (const user of listUsers.users) {
      const customClaims = user.customClaims || {};
      if (customClaims.admin) {
        adminUsers.push({
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime
        });
      }
    }
    
    res.json({ adminUsers });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs admin:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * Trigger automatique pour détecter les nouveaux tickets
 * Se déclenche quand un nouveau document est ajouté à la collection tickets
 */
exports.onNewTicket = functions.firestore
  .document('tickets/{ticketId}')
  .onCreate(async (snap, context) => {
    const ticketData = snap.data();
    const ticketId = context.params.ticketId;
    
    console.log(`Nouveau ticket analysé: ${ticketId}`, {
      fileName: ticketData.fileName,
      productsCount: ticketData.extractedData?.products?.length || 0,
      pricesCount: ticketData.extractedData?.prices?.length || 0,
      total: ticketData.extractedData?.total
    });
    
    // Ici vous pourriez ajouter des notifications, analyses supplémentaires, etc.
    // Par exemple, envoyer un email de notification, analyser les tendances, etc.
    
    return null;
  });