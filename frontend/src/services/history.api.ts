import { apiGet } from './api';
import type { HistoryPoint } from '../types/api';

interface HistoryResponse {
  history: HistoryPoint[];
}

export async function fetchHistoryApi(
  productId: string,
  territory: string,
  range: '7d' | '30d'
): Promise<HistoryPoint[]> {
  const qs = new URLSearchParams({ territory, range });
  const data = await apiGet<HistoryResponse>(
    `/api/products/${encodeURIComponent(productId)}/history?${qs.toString()}`
  );
  return data.history ?? [];
}
