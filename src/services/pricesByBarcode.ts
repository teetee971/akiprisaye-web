export interface PriceStats {
  min: number | null;
  max: number | null;
  median: number | null;
}

export interface PriceComparison {
  franceMedian: number;
  territoryMedian: number;
  ratio: number;
  percentDifference: number;
}

export interface PricesByBarcodeResponse {
  status: 'OK' | 'NO_DATA' | 'PARTIAL' | 'UNAVAILABLE';
  barcode: string;
  territory: string | null;
  maxAgeDays: number;
  product: unknown;
  stats: PriceStats;
  comparison: PriceComparison | null;
  observationCount: number;
  observations: Array<Record<string, unknown>>;
}

export async function fetchPricesByBarcode(params: {
  barcode: string;
  territory?: string;
  maxAgeDays?: number;
}): Promise<PricesByBarcodeResponse> {
  const searchParams = new URLSearchParams({ barcode: params.barcode });
  if (params.territory) {
    searchParams.set('territory', params.territory);
  }
  if (typeof params.maxAgeDays === 'number') {
    searchParams.set('maxAgeDays', String(params.maxAgeDays));
  }

  const response = await fetch(`/api/prices/by-barcode?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(`Prices by barcode failed: ${response.status}`);
  }

  return response.json() as Promise<PricesByBarcodeResponse>;
}
