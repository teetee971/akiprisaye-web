# Product Image Lookup — Cloudflare Worker

## Overview

This Cloudflare Worker provides a **free, serverless endpoint** that automatically associates
product images to receipt line items.  
Given a raw product label extracted from a receipt (e.g. `SUCRE BLANC 1KG CRF`), it returns
the best matching image URL from open data sources — no barcode / EAN required.

> **Google Images scraping is not used.**  
> All image sources are public APIs with permissive reuse policies (OpenFoodFacts CC-BY-SA,
> Wikimedia Commons free licences).

---

## Endpoint

```
GET /api/product-image
```

### Query parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `q`       | ✅       | —       | Raw product label from the receipt (max 200 chars) |
| `lang`    | ❌       | `fr`    | Preferred language for OpenFoodFacts results |
| `limit`   | ❌       | `1`     | Max results to consider per source (1–5) |

### Example request

```bash
curl "https://<worker>.workers.dev/api/product-image?q=SUCRE+BLANC+1KG+CRF"
```

### Response (JSON)

```json
{
  "query":          "SUCRE BLANC 1KG CRF",
  "normalizedQuery": "sucre blanc 1kg",
  "imageUrl":       "https://images.openfoodfacts.org/images/products/…/front_fr.jpg",
  "source":         "openfoodfacts",
  "confidence":     0.7,
  "cached":         false
}
```

| Field             | Type               | Description |
|-------------------|--------------------|-------------|
| `query`           | `string`           | Raw input as provided |
| `normalizedQuery` | `string`           | Cleaned query used for searching & caching |
| `imageUrl`        | `string \| null`   | Best image URL found, or `null` |
| `source`          | `openfoodfacts \| wikimedia \| none` | Which source provided the image |
| `confidence`      | `number` (0–1)     | Heuristic quality score |
| `cached`          | `boolean`          | `true` if served from Cloudflare Cache API |

---

## How it works

### 1. Query normalisation

The raw label is normalised before any lookup:

1. Lower-case and trim.
2. Strip diacritics (NFD decomposition).
3. Remove common store-name tokens (see list below).
4. Remove all punctuation except alphanumerics, spaces, and dots inside quantity expressions (e.g. `1.5l`).
5. Collapse whitespace.

**Store tokens stripped:**  
`carrefour`, `crf`, `super u`, `hyper u`, `leader price`, `intermarche`, `leclerc`,
`aldi`, `lidl`, `casino`, `franprix`, `monoprix`, `simply`, `netto`, `bi1`, `match`,
`cora`, `spar`, `ecomarche`, `g20`, `vival`, `maxi`

### 2. Cloudflare Cache API

Results are cached for **1 hour** keyed on the normalised query + lang + limit.  
Cache hits return `cached: true` and incur zero upstream API calls.

### 3. OpenFoodFacts (primary)

Text search via the public OpenFoodFacts search API (no key required):

```
https://world.openfoodfacts.org/cgi/search.pl?search_terms=<normalizedQuery>&…
```

Confidence score: **0.7** (text match, not barcode).

### 4. Wikimedia Commons (fallback)

If OpenFoodFacts returns no image, the worker searches Wikimedia Commons for
`<normalizedQuery> produit packaging`:

```
https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&…
```

Confidence score: **0.4** (generic image, may not exactly match the product).

### 5. None fallback

If both sources fail, `imageUrl` is `null` and `source` is `"none"`.
The frontend should display a local placeholder (e.g. `/assets/placeholders/placeholder-default.svg`).

---

## Rate limiting & abuse protection

| Mechanism | Detail |
|-----------|--------|
| `q` length cap | Requests with `q` longer than 200 characters are rejected (400) |
| Empty query guard | Empty or whitespace-only `q` returns 400 |
| Optional bearer token | Set `API_TOKEN` Wrangler secret to require `Authorization: Bearer <token>` |
| Cloudflare free-plan limits | Workers Free: 100 000 requests/day — sufficient for personal/small team use |

---

## CORS

All responses include:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Limitations

- **Text search is imprecise**: without a barcode, matches are best-effort.  
  Store-brand products (e.g. `PRODUIT BLANC CRF`) may return generic images.
- **Language bias**: OpenFoodFacts has better coverage for French products (`lang=fr`).
- **Wikimedia images**: may show a food ingredient photo rather than the exact packaging.
- **No image storage**: the worker returns a remote URL. If the upstream image is deleted,
  `imageUrl` will become a broken link.

---

## Deployment

### Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) ≥ 4
- A Cloudflare account (free tier is sufficient)

### Local development

```bash
cd workers/product-image
npm install
npm run dev
# Worker available at http://localhost:8787/api/product-image?q=test
```

### Deploy to Cloudflare Workers

```bash
cd workers/product-image

# First deploy (prompts for account confirmation)
npm run deploy
```

Or via CI (GitHub Actions) using `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets:

```yaml
- name: Deploy product-image worker
  run: npx wrangler deploy
  working-directory: workers/product-image
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Optional: require an API token

```bash
cd workers/product-image
npx wrangler secret put API_TOKEN
# Enter the desired token when prompted
```

Then every request must include `Authorization: Bearer <token>`.

---

## Tests

```bash
cd workers/product-image
npm test          # vitest unit tests
npm run typecheck # TypeScript type check
```

---

## File structure

```
workers/product-image/
├── src/
│   ├── index.ts        # Main Worker handler
│   └── normalizer.ts   # Query normalisation logic
├── tests/
│   ├── index.test.ts       # Worker integration tests (mocked fetch)
│   └── normalizer.test.ts  # Normaliser unit tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── wrangler.toml
```
