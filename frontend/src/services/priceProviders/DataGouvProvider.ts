import type { ProductPrice } from '../../types/ProductPrice';
import type { PriceProvider } from './PriceProvider';

const DATA_GOUV_DATASETS_ENDPOINT = 'https://www.data.gouv.fr/api/1/datasets/';
const REQUEST_TIMEOUT_MS = 6500;

interface DataGouvDatasetResource {
  id: string;
  title?: string;
  format?: string;
  url?: string;
  latest?: string;
  schema?: { name?: string } | null;
}

interface DataGouvDataset {
  id: string;
  title?: string;
  resources?: DataGouvDatasetResource[];
}

interface DataGouvSearchResponse {
  data?: DataGouvDataset[];
}

type JsonRecord = Record<string, unknown>;

const REGION_MATCHERS: Array<{ region: 'DOM'; keywords: string[] }> = [
  {
    region: 'DOM',
    keywords: ['martinique', 'guadeloupe', 'reunion', 'guyane', 'mayotte', 'dom'],
  },
];

const normalizeText = (value: string): string =>
  value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const detectRegion = (title?: string): 'FR' | 'DOM' => {
  const normalized = normalizeText(title ?? '');
  if (
    REGION_MATCHERS.some(({ keywords }) => keywords.some((keyword) => normalized.includes(keyword)))
  ) {
    return 'DOM';
  }
  return 'FR';
};

const parseNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').replace(/\s/g, '');
    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const extractString = (record: JsonRecord, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

const extractNumber = (record: JsonRecord, keys: string[]): number | undefined => {
  for (const key of keys) {
    const value = parseNumber(record[key]);
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
};

const extractRecords = (payload: unknown): JsonRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter(
      (entry): entry is JsonRecord => typeof entry === 'object' && entry !== null
    );
  }
  if (payload && typeof payload === 'object') {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) {
      return data.filter(
        (entry): entry is JsonRecord => typeof entry === 'object' && entry !== null
      );
    }
  }
  return [];
};

const fetchWithTimeout = async (url: string, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
};

const resolveResourceUrl = (resource: DataGouvDatasetResource): string | undefined =>
  resource.latest ?? resource.url;

const isJsonFormat = (format?: string): boolean => {
  if (!format) {
    return false;
  }
  return ['json', 'geojson', 'jsonl'].includes(format.toLowerCase());
};

const buildProductPrices = (
  records: JsonRecord[],
  datasetTitle: string | undefined,
  region: 'FR' | 'DOM'
): ProductPrice[] => {
  const updatedAt = new Date().toISOString();

  return records
    .map((record): ProductPrice | null => {
      const name = extractString(record, [
        'produit',
        'libelle',
        'designation',
        'nom',
        'product',
        'item',
      ]);
      if (!name) {
        return null;
      }

      const price = extractNumber(record, ['prix', 'price', 'prix_unitaire', 'montant']);
      const minPrice = extractNumber(record, ['prix_min', 'min_price', 'price_min']);
      const maxPrice = extractNumber(record, ['prix_max', 'max_price', 'price_max']);

      const priceRange =
        minPrice !== undefined && maxPrice !== undefined
          ? ([minPrice, maxPrice] as [number, number])
          : undefined;

      if (price === undefined && !priceRange) {
        return null;
      }

      const source: ProductPrice['source'] = price ? 'datagouv' : 'estimate';
      const confidence: ProductPrice['confidence'] = price ? 'high' : 'medium';

      return {
        id: `${source}-${name}-${datasetTitle ?? 'dataset'}`,
        name,
        price,
        priceRange,
        currency: 'EUR',
        store: datasetTitle,
        region,
        lastUpdated: updatedAt,
        source,
        confidence,
      };
    })
    .filter((product): product is ProductPrice => Boolean(product));
};

export class DataGouvProvider implements PriceProvider {
  async search(query: string): Promise<ProductPrice[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return [];
    }

    const url = new URL(DATA_GOUV_DATASETS_ENDPOINT);
    url.searchParams.set('q', trimmed);
    url.searchParams.set('page_size', '4');

    const response = await fetchWithTimeout(url.toString(), REQUEST_TIMEOUT_MS);
    if (!response.ok) {
      throw new Error('datagouv_unavailable');
    }

    const payload = (await response.json()) as DataGouvSearchResponse;
    const datasets = payload.data ?? [];

    for (const dataset of datasets) {
      const resources = (dataset.resources ?? []).filter((resource) =>
        isJsonFormat(resource.format)
      );
      for (const resource of resources) {
        const resourceUrl = resolveResourceUrl(resource);
        if (!resourceUrl) {
          continue;
        }
        try {
          const resourceResponse = await fetchWithTimeout(resourceUrl, REQUEST_TIMEOUT_MS);
          if (!resourceResponse.ok) {
            continue;
          }
          const resourcePayload = (await resourceResponse.json()) as unknown;
          const records = extractRecords(resourcePayload);
          const products = buildProductPrices(records, dataset.title, detectRegion(dataset.title));
          if (products.length > 0) {
            return products;
          }
        } catch {
          continue;
        }
      }
    }

    return [];
  }
}
