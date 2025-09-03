const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// ==============================
// Fonction planifiée : updatePrices toutes les 30 minutes
// ==============================
exports.updatePrices = functions.pubsub
  .schedule("every 30 minutes")
  .onRun(async (context) => {
    console.log("⏱️ Mise à jour automatique des prix toutes les 30 minutes");
    try {
      const response = await axios.get(functions.config().prices.api_url);
      const products = response.data;

      const batch = db.batch();
      products.forEach((product) => {
        const ref = db.collection("products").doc(product.id.toString());
        batch.set(
          ref,
          {
            name: product.name,
            price: product.price,
            store: product.store,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      });

      await batch.commit();
      console.log("✅ Mise à jour réussie !");
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour :", error);
    }
    return null;
  });

// ==============================
// Fonction planifiée : nightlyRefresh à 3h du matin (UTC)
// ==============================
exports.nightlyRefresh = functions.pubsub
  .schedule("0 3 * * *")
  .onRun(async (context) => {
    console.log("🌙 Refresh complet des prix à 3h du matin");
    return null;
  });
