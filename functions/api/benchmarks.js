import { json } from "./_utils";

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const territory = url.searchParams.get("territory") || "guadeloupe";

  // TODO: si tu as des benchmarks différents par territoire, remplace ci-dessous.
  const data = {
    territory,
    updatedAt: new Date().toISOString(),
    items: {
      lait:      { good: 1.0,  average: 1.35, unit: "€/L"  },
      sucre:     { good: 1.20, average: 1.90, unit: "€/kg" },
      eau:       { good: 0.35, average: 0.60, unit: "€/L"  },
      pates:     { good: 1.50, average: 2.30, unit: "€/kg" },
      riz:       { good: 2.60, average: 3.30, unit: "€/kg" }
    }
  };

  return json(data, { headers: { "cache-control": "public, max-age=300" } });
}
