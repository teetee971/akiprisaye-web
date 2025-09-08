export async function fetchProducts() {
  const r = await fetch('/data/products.json', { cache: 'no-store' });
  if (!r.ok) throw new Error('Impossible de récupérer les produits');
  return r.json();
}
