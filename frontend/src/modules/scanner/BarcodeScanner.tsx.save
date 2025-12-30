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

    // Sauvegarde locale dans l'historique
    const existing = JSON.parse(localStorage.getItem("scan_history") || "[]");
    localStorage.setItem("scan_history", JSON.stringify([product, ...existing].slice(0, 50)));

    setProductInfo(product);
  } catch (err) {
    setError("Erreur lors du chargement des données de prix");
  } finally {
    setLoading(false);
  }
}
