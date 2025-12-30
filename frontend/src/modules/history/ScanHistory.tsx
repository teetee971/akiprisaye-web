import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export default function ScanHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);

      try {
        // 🔹 Récupération locale
        const local = JSON.parse(localStorage.getItem("scan_history") || "[]");

        // 🔹 Récupération Firestore (Cloud)
        const q = query(collection(db, "scan_history"), orderBy("date", "desc"));
        const snap = await getDocs(q);
        const cloud = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          source: "cloud",
        }));

        // 🔹 Fusion (local + cloud sans doublons)
        const combined = [...cloud, ...local].filter(
          (v, i, a) =>
            a.findIndex((t) => t.ean === v.ean && t.date === v.date) === i
        );

        setHistory(combined);
      } catch (err) {
        console.error("Erreur de chargement de l'historique :", err);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-center text-green-400">
        🧾 Historique des Scans (Local + Cloud)
      </h1>

      {loading ? (
        <p className="text-center text-gray-400">Chargement des données...</p>
      ) : history.length === 0 ? (
        <p className="text-center text-gray-400">
          Aucun scan enregistré pour le moment.
        </p>
      ) : (
        history.map((item, i) => (
          <div
            key={i}
            className="bg-gray-800 rounded-lg p-3 text-sm border border-gray-700"
          >
            <p>
              <b>EAN :</b> {item.ean}
            </p>
            <p>
              <b>Produit :</b> {item.name}
            </p>
            <p>
              <b>Prix :</b> {item.price}
            </p>
            <p>
              <b>Magasin :</b> {item.store}
            </p>
            <p>
              <b>Date :</b>{" "}
              {item.date?.toDate
                ? item.date.toDate().toLocaleString()
                : item.date}
            </p>
            <p className="text-xs text-gray-500 italic">
              Source : {item.source === "cloud" ? "☁️ Cloud" : "📱 Local"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
