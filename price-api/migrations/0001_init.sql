CREATE TABLE IF NOT EXISTS products (
  ean TEXT PRIMARY KEY,
  product_name TEXT,
  brand TEXT,
  quantity TEXT,
  ingredients_text TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS price_observations (
  id TEXT PRIMARY KEY,
  ean TEXT NOT NULL,
  territory TEXT NOT NULL CHECK (territory IN ('fr','gp','mq')),
  retailer TEXT NOT NULL,
  store_id TEXT,
  store_name TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  unit TEXT,
  observed_at TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 1.0,
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ean) REFERENCES products(ean)
);

CREATE INDEX IF NOT EXISTS idx_price_observations_lookup
ON price_observations(ean, territory, retailer);

CREATE INDEX IF NOT EXISTS idx_price_observations_observed_at
ON price_observations(observed_at);

CREATE TABLE IF NOT EXISTS price_aggregates (
  ean TEXT NOT NULL,
  territory TEXT NOT NULL,
  retailer TEXT NOT NULL,
  currency TEXT NOT NULL,
  unit TEXT,
  last_price_cents INTEGER,
  min_price_cents INTEGER,
  max_price_cents INTEGER,
  median_price_cents INTEGER,
  count_observations INTEGER NOT NULL DEFAULT 0,
  last_observed_at TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (ean, territory, retailer, currency, unit)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start TEXT NOT NULL
);
