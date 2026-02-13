export async function fetchOpenPricesByBarcode(params: {
  barcode: string;
  territory?: string;
  pageSize?: number;
}) {
  const searchParams = new URLSearchParams({
    barcode: params.barcode,
    pageSize: String(params.pageSize ?? 30),
  });

  if (params.territory) {
    searchParams.set('territory', params.territory);
  }

  const response = await fetch(`/api/open-prices/by-barcode?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(`Open Prices proxy failed: ${response.status}`);
  }

  return response.json();
}
