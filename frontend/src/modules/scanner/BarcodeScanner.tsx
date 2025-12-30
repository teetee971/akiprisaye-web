import { db } from "../../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { saveScanOffline } from "../../utils/offlineSync";

async function fetchPriceByEAN(ean: string) {
  try {
    setLoading(true);
    setProductInfo(null);
    const res = await fetch(`/data/prices.json`, { cache: "no-store" });
    const data = await res.json();
    const found = data.find((p: any) => p.ean === ean);
    const product = found ?? { name: "Produit inconnu", price: "N/A", store: "Non répertorié" };
    product.ean = ean;
    product.date = new Date().toLocaleString();

    // 🔹 Sauvegarde locale dans l'historique
    const existing = JSON.parse(localStorage.getItem("scan_history") || "[]");
    localStorage.setItem("scan_history", JSON.stringify([product, ...existing].slice(0, 50)));

    // 🔹 Sauvegarde Firestore (cloud)
    await addDoc(collection(db, "scan_history"), {
      ean: product.ean,
      name: product.name,
      price: product.price,
      store: product.store,
      date: serverTimestamp(),
    });

    setProductInfo(product);
  } catch (err) {
    console.error(err);
    setError("⚠️ Erreur réseau — données enregistrées hors ligne");

    // 🔸 Sauvegarde locale différée (mode hors-ligne)
    await saveScanOffline({
      ean,
      name: "Produit scanné hors-ligne",
      price: "N/A",
      store: "Non disponible",
      date: new Date().toLocaleString(),
    });
  } finally {
    setLoading(false);
  }
}
