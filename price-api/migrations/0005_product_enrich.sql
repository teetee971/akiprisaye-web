CREATE TABLE IF NOT EXISTS product_candidates (
  id TEXT PRIMARY KEY,
  receipt_item_id TEXT NOT NULL,
  source TEXT NOT NULL,
  ean TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  quantity TEXT,
  score REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_product_candidates_receipt_item
ON product_candidates(receipt_item_id);

CREATE TABLE IF NOT EXISTS product_media_cache (
  ean TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  cached_at TEXT DEFAULT (datetime('now'))
);
