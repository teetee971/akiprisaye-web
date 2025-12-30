import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Stocke temporairement les scans hors-ligne et les synchronise au retour du réseau
 */
export async function saveScanOffline(product: any) {
  try {
    const offline = JSON.parse(localStorage.getItem("offline_scans") || "[]");
    localStorage.setItem("offline_scans", JSON.stringify([product, ...offline]));
  } catch (err) {
    console.error("Erreur lors de la sauvegarde hors-ligne :", err);
  }
}

export async function syncOfflineScans() {
  try {
    const offline = JSON.parse(localStorage.getItem("offline_scans") || "[]");
    if (offline.length === 0) return;

    console.log(`🔄 Synchronisation de ${offline.length} scans hors-ligne...`);
    for (const product of offline) {
      await addDoc(collection(db, "scan_history"), {
        ...product,
        date: serverTimestamp(),
        synced: true,
      });
    }

    localStorage.removeItem("offline_scans");
    console.log("✅ Synchronisation terminée avec Firestore !");
  } catch (err) {
    console.error("Erreur lors de la synchronisation :", err);
  }
}

// 🔁 Détection du retour de réseau
window.addEventListener("online", () => {
  console.log("🌐 Réseau détecté — synchronisation des données...");
  syncOfflineScans();
});
