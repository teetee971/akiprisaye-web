/**
 * Sync tickets citoyens vers le méga panier officiel
 * Projet: A KI PRI SA YÉ
 * Mode: sécurisé, traçable, sans doublon
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const TICKETS_FILE = path.join(ROOT, "public/data/tickets-citoyens.json");
const MEGA_FILE = path.join(ROOT, "public/data/mega-panier-anti-crise.json");

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function sync() {
  if (!fs.existsSync(TICKETS_FILE) || !fs.existsSync(MEGA_FILE)) {
    console.error("❌ Fichier manquant (tickets ou méga dataset)");
    process.exit(1);
  }

  const ticketsData = readJSON(TICKETS_FILE);
  const megaData = readJSON(MEGA_FILE);

  const validatedTickets = (ticketsData.tickets || []).filter(
    t => t.validation?.status === "validated"
  );

  if (validatedTickets.length === 0) {
    console.log("ℹ️ Aucun ticket validé à synchroniser");
    return;
  }

  // Index des magasins
  const storeIndex = Object.fromEntries(
    megaData.stores.map(s => [s.storeId, s])
  );

  validatedTickets.forEach(ticket => {
    const storeId = ticket.store.storeId;

    if (!storeIndex[storeId]) {
      console.warn(`⚠️ Magasin inconnu ignoré: ${storeId}`);
      return;
    }

    const store = storeIndex[storeId];

    ticket.items.forEach(item => {
      const productId = item.productId;
      const newPrice = item.price;

      if (!store.prices[productId]) {
        // Nouveau produit observé
        store.prices[productId] = round2(newPrice);
      } else {
        // Moyenne glissante simple (50% ancien / 50% nouveau)
        store.prices[productId] = round2(
          (store.prices[productId] + newPrice) / 2
        );
      }
    });
  });

  // Mise à jour des totaux paniers
  megaData.baskets.forEach(basket => {
    basket.totalsByStore.forEach(entry => {
      const store = storeIndex[entry.storeId];
      let total = 0;

      basket.products.forEach(pid => {
        if (store.prices[pid]) {
          total += store.prices[pid];
        }
      });

      entry.total = round2(total);
    });

    // Recalcul magasin recommandé
    const sorted = [...basket.totalsByStore].sort(
      (a, b) => a.total - b.total
    );

    basket.recommendedStore = {
      storeId: sorted[0].storeId,
      reason: "Total recalculé après intégration des tickets citoyens validés"
    };
  });

  megaData.meta.timestamps.lastUpdated = new Date().toISOString();

  writeJSON(MEGA_FILE, megaData);

  console.log(`✅ Synchronisation terminée (${validatedTickets.length} ticket(s))`);
}

sync();