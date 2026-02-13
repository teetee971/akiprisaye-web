export async function fetchOffProduct(barcode: string) {
  const response = await fetch(`/api/off/product?barcode=${encodeURIComponent(barcode)}`);
  if (!response.ok) {
    throw new Error(`OFF proxy failed: ${response.status}`);
  }

  return response.json();
}
