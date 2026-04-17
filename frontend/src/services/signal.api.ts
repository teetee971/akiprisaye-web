import { apiGet } from './api';
import type { SignalResult } from '../types/api';

export async function fetchSignalApi(productId: string, territory: string): Promise<SignalResult> {
  const qs = new URLSearchParams({ territory });
  return apiGet<SignalResult>(
    `/api/products/${encodeURIComponent(productId)}/signal?${qs.toString()}`
  );
}
