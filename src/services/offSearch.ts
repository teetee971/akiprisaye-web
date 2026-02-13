export type OffSearchItem = {
  source: 'open_food_facts';
  barcode: string | null;
  productName: string | null;
  brand: string | null;
  imageUrl: string | null;
  quantity: string | null;
  categories: string[];
};

export type OffSearchResponse = {
  q: string;
  lang: string;
  page: number;
  pageSize: number;
  count: number;
  products: OffSearchItem[];
  rawMeta: { page_count: number | null; count: number | null };
};

export async function fetchOffSearch(params: {
  q: string;
  page?: number;
  pageSize?: number;
  lang?: string;
}): Promise<OffSearchResponse> {
  const searchParams = new URLSearchParams({
    q: params.q,
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 12),
    lang: params.lang ?? 'fr',
  });

  const response = await fetch(`/api/off/search?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(`OFF search failed: ${response.status}`);
  }

  return response.json();
}
