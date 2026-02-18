export type ProductCandidate = {
  id: string;
  source: 'openfoodfacts';
  ean?: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  quantity?: string;
  score: number;
};

const API_BASE = (import.meta.env.VITE_PRICE_API_URL as string | undefined) ?? '';

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function enrichReceiptItem(receiptItemId: string): Promise<ProductCandidate[]> {
  const payload = await request<{ candidates: ProductCandidate[] }>('/v1/enrich/off', {
    method: 'POST',
    body: JSON.stringify({ receiptItemId }),
  });

  return payload.candidates;
}

export async function getCandidates(receiptItemId: string): Promise<ProductCandidate[]> {
  const payload = await request<{ candidates: ProductCandidate[] }>(`/v1/enrich/candidates/${encodeURIComponent(receiptItemId)}`, {
    method: 'GET',
  });

  return payload.candidates;
}

export async function resolveCandidate(
  receiptItemId: string,
  params: { chosenEan?: string; chosenCandidateId?: string },
): Promise<void> {
  await request('/v1/enrich/resolve', {
    method: 'POST',
    body: JSON.stringify({
      receiptItemId,
      chosenEan: params.chosenEan,
      chosenCandidateId: params.chosenCandidateId,
    }),
  });
}

export async function resolveWithEan(receiptItemId: string, ean: string): Promise<void> {
  await resolveCandidate(receiptItemId, { chosenEan: ean });
}
