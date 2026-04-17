import { apiGet } from './api';
import type { CompareResponse, CompareParams } from '../types/compare';

export async function fetchCompareApi(
  query: string,
  territory: string,
  retailer?: string
): Promise<CompareResponse> {
  const params: CompareParams = { query, territory, retailer };
  const qs = new URLSearchParams({ query, territory });
  if (retailer) qs.set('retailer', retailer);
  // suppress unused var warning
  void params;
  return apiGet<CompareResponse>(`/api/compare?${qs.toString()}`);
}
