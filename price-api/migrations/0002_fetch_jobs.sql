CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  base_url TEXT,
  auth_type TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  territory_scope TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fetch_jobs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id),
  territory TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  error TEXT
);

CREATE TABLE IF NOT EXISTS fetch_job_items (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES fetch_jobs(id),
  ean TEXT NOT NULL,
  retailer TEXT,
  status TEXT NOT NULL,
  raw_ref TEXT,
  raw_payload_json TEXT,
  observed_price_cents INTEGER,
  currency TEXT,
  unit TEXT,
  observed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_source_territory_time
  ON fetch_jobs (source_id, territory, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_items_job
  ON fetch_job_items (job_id);

CREATE INDEX IF NOT EXISTS idx_items_ean
  ON fetch_job_items (ean);
