CREATE TABLE IF NOT EXISTS receipt_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('created', 'processing', 'completed', 'failed')),
  territory TEXT NOT NULL CHECK (territory IN ('fr', 'gp', 'mq')),
  created_at TEXT DEFAULT (datetime('now', 'utc'))
);

CREATE INDEX IF NOT EXISTS idx_receipt_jobs_status ON receipt_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipt_jobs_territory ON receipt_jobs(territory, created_at DESC);
