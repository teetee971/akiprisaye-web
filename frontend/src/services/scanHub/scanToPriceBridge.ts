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
  storeId?: string;
  serviceMode?: 'inStore' | 'drive' | 'delivery';
}): PriceSearchInput {
  const barcode = params.barcode ?? (params.text ? extractBarcode(params.text) : undefined);
  const query = params.text?.trim() || undefined;

  const brand = params.brand?.trim() || undefined;
  const category = params.category?.trim() || undefined;
  const territory = params.territory;
  const storeId = params.storeId?.trim() || undefined;
  const serviceMode = params.serviceMode;
  const metadata: Record<string, string> = {};

  return {
    ...(barcode ? { barcode } : {}),
    ...(query ? { query } : {}),
    ...(brand ? { brand } : {}),
    ...(category ? { category } : {}),
    ...(territory ? { territory } : {}),
    ...(storeId ? { storeId } : {}),
    ...(serviceMode ? { serviceMode } : {}),
    metadata,
  };
}
