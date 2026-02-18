CREATE TABLE IF NOT EXISTS receipt_jobs (
  id TEXT PRIMARY KEY,
  territory TEXT NOT NULL CHECK (territory IN ('fr','gp','mq')),
  status TEXT NOT NULL CHECK (status IN ('queued','running','success','partial','failed')),
  created_at TEXT NOT NULL,
  completed_at TEXT,
  images_count INTEGER NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('receipt','invoice','quote')),
  retailer TEXT,
  store_name TEXT,
  observed_at TEXT,
  totals_json TEXT,
  pii_redaction_json TEXT,
  confidence REAL NOT NULL DEFAULT 0,
  error TEXT
);

CREATE TABLE IF NOT EXISTS receipt_images (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES receipt_jobs(id)
);

CREATE TABLE IF NOT EXISTS receipt_items (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  line_index INTEGER NOT NULL,
  product_label TEXT NOT NULL,
  quantity REAL,
  unit_price_cents INTEGER,
  line_total_cents INTEGER,
  ean TEXT,
  brand TEXT,
  category TEXT,
  confidence REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (job_id) REFERENCES receipt_jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_receipt_jobs_status ON receipt_jobs(status);
CREATE INDEX IF NOT EXISTS idx_receipt_jobs_territory ON receipt_jobs(territory);
CREATE INDEX IF NOT EXISTS idx_receipt_jobs_created_at ON receipt_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_receipt_images_job_id ON receipt_images(job_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_job_id ON receipt_items(job_id);
