/**
 * Compare service — frontend API client (live only)
 */

import { liveApiFetchJson } from './liveApiClient';
import type { CompareParams, CompareResponse } from '../types/compare';

/**
 * Fetch comparison data from live API.
 * Throws when API is unavailable so callers can display a real error state.
 */
export async function fetchCompare(params: CompareParams): Promise<CompareResponse> {
  const qs = new URLSearchParams({
    query: params.query,
    territory: params.territory,
    ...(params.retailer ? { retailer: params.retailer } : {}),
  });

  return liveApiFetchJson<CompareResponse>(`/compare?${qs.toString()}`, {
    incidentReason: 'compare_api_unavailable',
    timeoutMs: 10000,
  });
}
