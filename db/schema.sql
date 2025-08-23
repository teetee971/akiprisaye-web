CREATE TABLE IF NOT EXISTS activations(
  id TEXT PRIMARY KEY, kind TEXT NOT NULL DEFAULT 'vnp',
  phone TEXT, platform TEXT, email TEXT, message TEXT, page TEXT, ip TEXT, ua TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS devices(
  token TEXT PRIMARY KEY, label TEXT, email TEXT, client_priv TEXT, client_pub TEXT, ip4 TEXT, created_at TEXT);
