PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS price_observations (
  id TEXT PRIMARY KEY,
  ean TEXT NOT NULL,
  territory TEXT NOT NULL,
  retailer TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  unit TEXT NULL,
  price_per_unit_cents INTEGER NULL,
  observed_at TEXT NOT NULL,
  source TEXT NOT NULL,
  store_ref TEXT NULL,
  metadata_json TEXT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_obs_ean_terr_retailer_time
ON price_observations (ean, territory, retailer, observed_at DESC);

CREATE TABLE IF NOT EXISTS price_aggregates (
  key TEXT PRIMARY KEY,
  ean TEXT NOT NULL,
  territory TEXT NOT NULL,
  retailer TEXT NOT NULL,
  last_price_cents INTEGER NULL,
  last_observed_at TEXT NULL,
  min_price_cents INTEGER NULL,
  max_price_cents INTEGER NULL,
  median_price_cents INTEGER NULL,
  count_obs INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_aggr_ean_terr
ON price_aggregates (ean, territory);
