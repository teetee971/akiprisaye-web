-- Schéma D1 pour l'observatoire vivant (historique des prix)
CREATE TABLE IF NOT EXISTS prices (
  id TEXT PRIMARY KEY,
  territoire TEXT,
  produit TEXT,
  prix REAL,
  devise TEXT,
  source_type TEXT,     -- institutionnel | commercial
  source_name TEXT,
  timestamp DATETIME
);

-- Index pour accélérer les requêtes par territoire / produit / période récente
CREATE INDEX IF NOT EXISTS idx_prices_territoire_produit_time
  ON prices (territoire, produit, timestamp);
