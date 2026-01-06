type Row = {
  territoire: string;
  produit: string;
  timestamp: string;
  prix: number;
  currency: string;
  source: string;
};

const TERRITORIES = ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte'] as const;
const PRODUCTS = ['Riz 1kg', 'Lait UHT 1L', 'Pâtes 500g', 'Sucre 1kg'] as const;
const DAY_MS = 24 * 60 * 60 * 1000;
const SEASONAL_FACTOR = 0.4;
const PRICE_VARIATION = 0.05;

function generateRows(): Row[] {
  const rows: Row[] = [];
  const now = Date.now();
  const basePrices: Record<string, number> = {
    'Riz 1kg': 2.05,
    'Lait UHT 1L': 1.42,
    'Pâtes 500g': 1.18,
    'Sucre 1kg': 1.75,
  };

  TERRITORIES.forEach((territoire, territoryIndex) => {
    PRODUCTS.forEach((produit, productIndex) => {
      const base = basePrices[produit] ?? 1.5;
      for (let day = 0; day < 14; day++) {
        const date = new Date(now - day * DAY_MS);
        const factor = 1 + Math.sin((territoryIndex + productIndex + day) * SEASONAL_FACTOR) * PRICE_VARIATION;
        const price = Number((base * factor).toFixed(2));
        rows.push({
          territoire,
          produit,
          timestamp: date.toISOString(),
          prix: Math.max(price, 0.35),
          currency: 'EUR',
          source: 'Open-data communautaire (cache)',
        });
      }
    });
  });

  return rows.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function toCsv(rows: Row[]) {
  const header = 'territoire,produit,timestamp,prix,currency,source';
  const lines = rows.map((row) =>
    [
      row.territoire,
      row.produit,
      row.timestamp,
      row.prix.toFixed(2),
      row.currency,
      row.source.replace(/"/g, ''),
    ]
      .map((cell) => `"${cell}"`)
      .join(',')
  );
  return [header, ...lines].join('\n');
}

function toJsonl(rows: Row[]) {
  return rows.map((row) => JSON.stringify(row)).join('\n');
}

function metadata(rows: Row[]) {
  return {
    dataset_version: '2026.01',
    generated_at: new Date().toISOString(),
    license: 'ODbL-1.0',
    source: 'A KI PRI SA YÉ – Observatoire',
    rows: rows.length,
    coverage: {
      territories: TERRITORIES.length,
      products: PRODUCTS.length,
      window: {
        from: rows[0]?.timestamp ?? null,
        to: rows.at(-1)?.timestamp ?? null,
      },
    },
    endpoints: ['/open-data/prices.csv', '/open-data/prices.jsonl', '/open-data/metadata.json'],
    freshness: 'Cache statique open-data (pas de flux caisse en direct)',
  };
}

export async function onRequestGet(context: { request: Request }) {
  const { request } = context;
  const url = new URL(request.url);
  const resource = url.pathname.split('/').pop() ?? '';
  const rows = generateRows();

  if (resource === 'prices.csv') {
    return new Response(toCsv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  if (resource === 'prices.jsonl') {
    return new Response(toJsonl(rows), {
      headers: {
        'Content-Type': 'application/jsonl; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  if (resource === 'metadata.json') {
    return new Response(JSON.stringify(metadata(rows), null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  return new Response('Not found', { status: 404 });
}
