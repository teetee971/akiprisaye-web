import type { PriceSearchInput, TerritoryCode } from '../priceSearch/price.types';

const BARCODE_REGEX = /\b\d{8,14}\b/;

export function extractBarcode(text: string): string | undefined {
  const match = text.match(BARCODE_REGEX);
  return match?.[0];
}

export function buildPriceSearchInput(params: {
  barcode?: string;
  text?: string;
  brand?: string;
  category?: string;
  territory?: TerritoryCode;
}): PriceSearchInput {
  const barcode = params.barcode ?? (params.text ? extractBarcode(params.text) : undefined);
  const query = params.text?.trim();

  return {
    barcode,
    query: barcode ? undefined : query,
    brand: params.brand,
    category: params.category,
    territory: params.territory,
  };
}
