const functions = require("firebase-functions");   // v6 => Cloud Functions 2nd gen (par défaut)
const admin = require("firebase-admin");

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.ean2nc8 = functions.https.onRequest(async (req, res) => {
  try {
    // Autorise CORS simple
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).send("");

    const ean = String(req.query.ean || "").trim();

    // TODO: remplace cette démo par ta vraie logique EAN -> NC8
    return res.json({
      ok: true,
      ean: ean || "inconnu",
      message: "Fonction ean2nc8 déployée ✅"
    });
  } catch (err) {
    res.status(500).json({ ok:false, error: err?.message || String(err) });
  }
});

/**
 * Cloud Function pour attribuer le rôle admin à un utilisateur
 * Sécurisé: vérification que l'utilisateur actuel est admin
 */
exports.setAdminRole = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Authorization,Content-Type");
  
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Token d'authentification requis" });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Vérifier que l'utilisateur actuel est admin
    if (!decodedToken.admin) {
      return res.status(403).json({ error: "Accès refusé: rôle admin requis" });
    }

    const { uid, admin: isAdmin } = req.body;
    
    if (!uid) {
      return res.status(400).json({ error: "UID utilisateur requis" });
    }

    await admin.auth().setCustomUserClaims(uid, { admin: isAdmin === true });
    
    res.json({ 
      success: true, 
      message: `Rôle admin ${isAdmin ? 'attribué' : 'retiré'} pour l'utilisateur ${uid}` 
    });
  } catch (error) {
    console.error("Erreur setAdminRole:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

/**
 * Cloud Function pour créer un utilisateur admin (fonction bootstrap)
 * ATTENTION: À sécuriser ou supprimer après la première utilisation
 */
exports.createFirstAdmin = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { email, password, secretKey } = req.body;
  
  // Sécurité basique - à remplacer par quelque chose de plus robuste
  if (secretKey !== "AKIPRISAYE_BOOTSTRAP_2025") {
    return res.status(403).json({ error: "Clé secrète invalide" });
  }

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: true
    });
    
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    res.json({ 
      success: true, 
      uid: userRecord.uid,
      email: userRecord.email,
      message: "Premier utilisateur admin créé avec succès" 
    });
  } catch (error) {
    console.error("Erreur createFirstAdmin:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Trigger pour les nouveaux tickets analysés
 */
exports.onNewTicket = functions.firestore
  .document('tickets/{ticketId}')
  .onCreate(async (snap, context) => {
    const ticketData = snap.data();
    const ticketId = context.params.ticketId;
    
    console.log(`📊 Nouveau ticket analysé: ${ticketId}`, {
      fileName: ticketData.fileName,
      productsCount: ticketData.extractedData?.products?.length || 0,
      pricesCount: ticketData.extractedData?.prices?.length || 0,
      total: ticketData.extractedData?.total
    });
    
    // Ici vous pourriez ajouter:
    // - Notifications par email
    // - Analyse de tendances
    // - Alertes sur les prix élevés
    // - Statistiques en temps réel
    
    return null;
  });
