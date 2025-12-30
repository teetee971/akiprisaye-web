import { useEffect, useState } from "react";

export default function ScanHistory() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("scan_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  function clearHistory() {
    if (confirm("Effacer tout l'historique ?")) {
      localStorage.removeItem("scan_history");
      setHistory([]);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-center text-green-400">
        🧾 Historique des Scans
      </h1>

      {history.length === 0 ? (
        <p className="text-center text-gray-400">
          Aucun scan enregistré pour le moment.
        </p>
      ) : (
        <div className="space-y-3">
          {history.map((item, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-3 text-sm">
              <p><b>EAN :</b> {item.ean}</p>
              <p><b>Produit :</b> {item.name}</p>
              <p><b>Prix :</b> {item.price}</p>
              <p><b>Magasin :</b> {item.store}</p>
              <p><b>Date :</b> {item.date}</p>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <button
          onClick={clearHistory}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg"
        >
          Effacer l'historique
        </button>
      )}
    </div>
  );
}
