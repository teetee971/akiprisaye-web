CREATE TABLE IF NOT EXISTS receipt_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('pending','partial','success','failed','confirmed')),
  territory TEXT NOT NULL CHECK (territory IN ('fr','gp','mq')),
  failure_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receipt_items (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  ean TEXT,
  label TEXT NOT NULL,
  qty REAL,
  unit TEXT,
  price_cents INTEGER NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES receipt_jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_job_id ON receipt_items(job_id);
