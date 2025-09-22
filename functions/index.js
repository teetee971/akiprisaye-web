const functions = require("firebase-functions");   // v6 => Cloud Functions 2nd gen (par défaut)
const admin = require("firebase-admin");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Fonction EAN vers NC8 (existante)
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

// Nouvelle fonction pour déployer une IA
exports.deployAI = functions.https.onCall(async (data, context) => {
  try {
    const { aiSpec } = data;
    
    // Validation des données
    if (!aiSpec || !aiSpec.name || !aiSpec.type) {
      throw new functions.https.HttpsError('invalid-argument', 'Spécification IA invalide');
    }

    // Validation de sécurité
    const activeAIs = await db.collection('activeAIs').get();
    if (activeAIs.size >= 10) {
      throw new functions.https.HttpsError('resource-exhausted', 'Limite maximale d\'IA atteinte');
    }

    // Types autorisés
    const allowedTypes = ['analysis', 'optimization', 'monitoring', 'prediction', 'security'];
    if (!allowedTypes.includes(aiSpec.type)) {
      throw new functions.https.HttpsError('invalid-argument', 'Type d\'IA non autorisé');
    }

    // Création de l'instance IA
    const aiInstance = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: aiSpec.name,
      type: aiSpec.type,
      capabilities: aiSpec.capabilities || [],
      territory: aiSpec.territory || 'general',
      status: 'deploying',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      deployedBy: context.auth?.uid || 'system',
      resources: {
        cpu: aiSpec.resources?.cpu || 'low',
        memory: aiSpec.resources?.memory || '512MB',
        storage: aiSpec.resources?.storage || '1GB'
      },
      communication: {
        apiEndpoint: null,
        topics: aiSpec.communication?.topics || [],
        protocols: ['REST', 'WebSocket']
      }
    };

    // Enregistrement en base
    await db.collection('activeAIs').doc(aiInstance.id).set(aiInstance);

    // Simulation du déploiement (remplacer par vraie logique)
    const deploymentResult = await simulateDeployment(aiInstance);

    if (deploymentResult.success) {
      // Mise à jour du statut
      await db.collection('activeAIs').doc(aiInstance.id).update({
        status: 'active',
        'communication.apiEndpoint': deploymentResult.endpoint,
        deployedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Log d'audit
      await logAuditEvent('AI_DEPLOYED', aiInstance.id, {
        spec: aiSpec,
        endpoint: deploymentResult.endpoint
      });

      return {
        success: true,
        aiInstance: {
          ...aiInstance,
          status: 'active',
          communication: {
            ...aiInstance.communication,
            apiEndpoint: deploymentResult.endpoint
          }
        }
      };
    } else {
      await db.collection('activeAIs').doc(aiInstance.id).update({
        status: 'error',
        error: deploymentResult.error
      });
      
      throw new functions.https.HttpsError('internal', deploymentResult.error);
    }

  } catch (error) {
    console.error('Erreur déploiement IA:', error);
    throw error;
  }
});

// Fonction pour supprimer une IA
exports.removeAI = functions.https.onCall(async (data, context) => {
  try {
    const { aiId } = data;
    
    if (!aiId) {
      throw new functions.https.HttpsError('invalid-argument', 'ID IA requis');
    }

    // Vérification existence
    const aiDoc = await db.collection('activeAIs').doc(aiId).get();
    if (!aiDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'IA non trouvée');
    }

    // Suppression
    await db.collection('activeAIs').doc(aiId).delete();

    // Log d'audit
    await logAuditEvent('AI_REMOVED', aiId, {
      removedBy: context.auth?.uid || 'system',
      reason: 'user_request'
    });

    return { success: true };

  } catch (error) {
    console.error('Erreur suppression IA:', error);
    throw error;
  }
});

// Fonction pour faciliter la communication entre IA
exports.facilitateAICommunication = functions.https.onCall(async (data, context) => {
  try {
    const { fromAI, toAI, message } = data;
    
    if (!fromAI || !toAI || !message) {
      throw new functions.https.HttpsError('invalid-argument', 'Paramètres de communication manquants');
    }

    // Vérification existence des IA
    const [fromDoc, toDoc] = await Promise.all([
      db.collection('activeAIs').doc(fromAI).get(),
      db.collection('activeAIs').doc(toAI).get()
    ]);

    if (!fromDoc.exists || !toDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'IA source ou destination non trouvée');
    }

    // Création du message inter-IA
    const interAIMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: fromAI,
      to: toAI,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      payload: message,
      type: message.type || 'data_exchange',
      territory: fromDoc.data().territory
    };

    // Enregistrement du message
    await db.collection('aiMessages').doc(interAIMessage.id).set(interAIMessage);

    // Log de communication
    await db.collection('aiCommunicationLog').doc(interAIMessage.id).set({
      ...interAIMessage,
      logged: true
    });

    return { success: true, messageId: interAIMessage.id };

  } catch (error) {
    console.error('Erreur communication IA:', error);
    throw error;
  }
});

// Fonction de surveillance automatique (déclenchée périodiquement)
exports.monitorAndAutoDeployAI = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  try {
    console.log('Démarrage surveillance automatique IA');

    // Collecte des métriques
    const metrics = await collectSystemMetrics();
    
    // Analyse des besoins
    const deploymentNeeds = analyzeDeploymentNeeds(metrics);
    
    for (const need of deploymentNeeds) {
      // Vérification si ce type d'IA n'existe pas déjà
      const existingAI = await db.collection('activeAIs')
        .where('type', '==', need.type)
        .where('status', '==', 'active')
        .get();
        
      if (existingAI.empty) {
        console.log(`Déploiement automatique d'une IA ${need.type} détecté comme nécessaire`);
        
        // Déploiement automatique
        const autoSpec = {
          name: need.name,
          type: need.type,
          capabilities: need.capabilities,
          territory: 'general',
          autoDeployed: true,
          reason: need.reason
        };

        // Utilise la même logique que deployAI mais en interne
        await autoDeployAI(autoSpec);
      }
    }

    console.log('Surveillance automatique IA terminée');
    return null;

  } catch (error) {
    console.error('Erreur surveillance automatique IA:', error);
    return null;
  }
});

// Fonctions utilitaires
async function simulateDeployment(aiInstance) {
  // Simulation du déploiement - remplacer par vraie logique
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        endpoint: `https://ai-${aiInstance.id}.akiprisaye.app/api`
      });
    }, 1000);
  });
}

async function logAuditEvent(eventType, aiId, details) {
  const auditEvent = {
    type: eventType,
    aiId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    details,
    territory: 'general' // Remplacer par détection réelle
  };

  await db.collection('aiAuditLog').add(auditEvent);
}

async function collectSystemMetrics() {
  // Simulation de collecte de métriques
  return {
    responseTime: Math.random() * 3000,
    errorRate: Math.random() * 0.1,
    activeUsers: Math.floor(Math.random() * 1000),
    cpuUsage: Math.random(),
    memoryUsage: Math.random()
  };
}

function analyzeDeploymentNeeds(metrics) {
  const needs = [];

  if (metrics.responseTime > 2000) {
    needs.push({
      name: 'Optimiseur Performance Auto',
      type: 'optimization',
      capabilities: ['response_optimization', 'cache_management'],
      reason: 'Performance dégradée détectée'
    });
  }

  if (metrics.errorRate > 0.05) {
    needs.push({
      name: 'Moniteur Erreurs Auto',
      type: 'monitoring',
      capabilities: ['error_analysis', 'auto_recovery'],
      reason: 'Taux d\'erreur élevé détecté'
    });
  }

  return needs;
}

async function autoDeployAI(aiSpec) {
  const aiInstance = {
    id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: aiSpec.name,
    type: aiSpec.type,
    capabilities: aiSpec.capabilities || [],
    territory: aiSpec.territory || 'general',
    status: 'deploying',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    deployedBy: 'system',
    autoDeployed: true,
    reason: aiSpec.reason,
    resources: {
      cpu: 'low',
      memory: '512MB',
      storage: '1GB'
    },
    communication: {
      apiEndpoint: null,
      topics: [],
      protocols: ['REST', 'WebSocket']
    }
  };

  await db.collection('activeAIs').doc(aiInstance.id).set(aiInstance);

  const deploymentResult = await simulateDeployment(aiInstance);

  if (deploymentResult.success) {
    await db.collection('activeAIs').doc(aiInstance.id).update({
      status: 'active',
      'communication.apiEndpoint': deploymentResult.endpoint,
      deployedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await logAuditEvent('AI_AUTO_DEPLOYED', aiInstance.id, {
      spec: aiSpec,
      endpoint: deploymentResult.endpoint
    });
  }

  return aiInstance;
}
