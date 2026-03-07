 
import { useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Price = {
  id: string;
  amount: number;
  store: string;
  source: string;
  date: Timestamp;
};

type Product = {
  id: string;
  name: string;
  ean: string;
};

export default function Comparateur() {
  const [ean, setEan] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProduct = async () => {
    if (!ean) return;

    setLoading(true);
    setError(null);
    setProducts([]);
    setPrices([]);

    try {
      if (!db) {
        setError("Service non disponible.");
        setLoading(false);
        return;
      }
      // Recherche du produit
      const productQuery = query(
        collection(db, "products"),
        where("ean", "==", ean)
      );

      const productSnap = await getDocs(productQuery);

      const foundProducts: Product[] = productSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Product, "id">),
      }));

      setProducts(foundProducts);

      // Recherche des prix si produit trouvé
      if (foundProducts.length > 0) {
        const priceQuery = query(
          collection(db, "prices"),
          where("ean", "==", ean)
        );

        const priceSnap = await getDocs(priceQuery);

        const foundPrices: Price[] = priceSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Price, "id">),
        }));

        setPrices(foundPrices);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1rem", maxWidth: 600, margin: "0 auto" }}>
      <h2>Comparer les prix</h2>

      <input
        type="text"
        placeholder="Entrer ou scanner un EAN"
        value={ean}
        onChange={(e) => setEan(e.target.value)}
        style={{ width: "100%", padding: "0.75rem", marginBottom: "0.5rem" }}
      />

      <button
        onClick={searchProduct}
        style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem" }}
      >
        Rechercher
      </button>

      {loading && <p>Chargement…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {products.map((product) => (
        <div key={product.id} style={{ marginBottom: "1rem" }}>
          <strong>{product.name}</strong>
        </div>
      ))}

      {prices.map((price) => {
        const dateValue = (price as any).date;
        const parsedDate =
          dateValue instanceof Date
            ? dateValue
            : typeof dateValue === 'string'
              ? new Date(dateValue)
              : typeof dateValue?.toDate === 'function'
                ? dateValue.toDate()
                : undefined;
        const dateLabel = parsedDate ? parsedDate.toLocaleDateString() : '—';

        return (
        <div
          key={price.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          <div>💰 {price.amount} €</div>
          <div>🏬 {price.store}</div>
          <div>📅 {dateLabel}</div>
          <div>🔗 {price.source}</div>
        </div>
        );
      })}

      {!loading && prices.length === 0 && products.length > 0 && (
        <p>Aucun prix disponible pour ce produit.</p>
      )}
    </div>
  );
}
