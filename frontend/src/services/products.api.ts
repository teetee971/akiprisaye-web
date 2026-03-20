import { apiGet } from './api';
import type { CompareProduct } from '../types/compare';

interface ProductsSearchResponse {
  products: CompareProduct[];
}

export async function fetchProductsApi(query: string): Promise<CompareProduct[]> {
  const qs = new URLSearchParams({ q: query });
  const data = await apiGet<ProductsSearchResponse>(`/api/products/search?${qs.toString()}`);
  return data.products ?? [];
}
