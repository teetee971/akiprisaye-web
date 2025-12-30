-- Migration 001: Create Base Schema for A KI PRI SA YÉ
-- Description: Creates the foundational tables for the immutable price observation pipeline
-- Author: A KI PRI SA YÉ Team
-- Date: 2025-12-18

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- 1. TERRITORIES - Référentiel des territoires d'Outre-mer
-- =============================================================================

CREATE TABLE territories (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  country_code VARCHAR(2) DEFAULT 'FR',
  timezone VARCHAR(50),
  currency VARCHAR(3) DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE territories IS 'Référentiel des territoires français d''Outre-mer (DROM-COM)';
COMMENT ON COLUMN territories.code IS 'Code ISO 3166-2 sur 2 caractères (GP, MQ, RE, etc.)';
COMMENT ON COLUMN territories.timezone IS 'Fuseau horaire IANA (ex: America/Guadeloupe)';

-- Données de référence
INSERT INTO territories (code, name, region, timezone) VALUES
  ('GP', 'Guadeloupe', 'Antilles', 'America/Guadeloupe'),
  ('MQ', 'Martinique', 'Antilles', 'America/Martinique'),
  ('GF', 'Guyane', 'Amérique du Sud', 'America/Cayenne'),
  ('RE', 'La Réunion', 'Océan Indien', 'Indian/Reunion'),
  ('YT', 'Mayotte', 'Océan Indien', 'Indian/Mayotte'),
  ('PM', 'Saint-Pierre-et-Miquelon', 'Amérique du Nord', 'America/Miquelon'),
  ('BL', 'Saint-Barthélemy', 'Antilles', 'America/St_Barthelemy'),
  ('MF', 'Saint-Martin', 'Antilles', 'America/Marigot'),
  ('WF', 'Wallis-et-Futuna', 'Pacifique', 'Pacific/Wallis'),
  ('PF', 'Polynésie française', 'Pacifique', 'Pacific/Tahiti'),
  ('NC', 'Nouvelle-Calédonie', 'Pacifique', 'Pacific/Noumea'),
  ('TF', 'Terres australes et antarctiques françaises', 'Antarctique', 'Indian/Kerguelen');

-- =============================================================================
-- 2. PRODUCTS - Catalogue de produits
-- =============================================================================

CREATE TABLE products (
  ean VARCHAR(14) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  unit VARCHAR(10),
  package_quantity DECIMAL(10, 3),
  package_unit VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Catalogue de produits identifiés par code EAN';
COMMENT ON COLUMN products.ean IS 'Code-barres EAN-8 ou EAN-13';
COMMENT ON COLUMN products.unit IS 'Unité de vente (kg, L, unité, g, ml, cl)';
COMMENT ON COLUMN products.package_quantity IS 'Quantité dans l''emballage (ex: 750 pour Nutella 750g)';

-- Index pour recherche rapide
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('french', name));

-- =============================================================================
-- 3. STORES - Magasins et points de vente
-- =============================================================================

CREATE TABLE stores (
  store_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  chain VARCHAR(100),
  territory VARCHAR(2) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location GEOGRAPHY(POINT, 4326),
  address TEXT,
  postal_code VARCHAR(10),
  city VARCHAR(100),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (territory) REFERENCES territories(code)
);

COMMENT ON TABLE stores IS 'Magasins et points de vente dans les territoires d''Outre-mer';
COMMENT ON COLUMN stores.chain IS 'Chaîne/enseigne (Carrefour, Leader Price, etc.)';
COMMENT ON COLUMN stores.location IS 'Point géographique PostGIS pour requêtes spatiales';

-- Index pour recherche géographique et par territoire
CREATE INDEX idx_stores_territory ON stores(territory);
CREATE INDEX idx_stores_chain ON stores(chain);
CREATE INDEX idx_stores_location ON stores USING GIST(location);
CREATE INDEX idx_stores_active ON stores(active) WHERE active = TRUE;

-- Trigger pour synchroniser location avec lat/lng
CREATE OR REPLACE FUNCTION update_store_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_store_location
  BEFORE INSERT OR UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_store_location();

-- =============================================================================
-- 4. SOURCES - Référentiel des sources de données
-- =============================================================================

CREATE TABLE sources (
  source_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  description TEXT,
  url TEXT,
  reliability_score DECIMAL(3, 2) DEFAULT 1.00,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_source_type CHECK (type IN ('partner', 'api', 'citizen', 'ocr')),
  CONSTRAINT chk_reliability CHECK (reliability_score BETWEEN 0 AND 1)
);

COMMENT ON TABLE sources IS 'Référentiel des sources de données de prix';
COMMENT ON COLUMN sources.type IS 'Type de source: partner, api, citizen, ocr';
COMMENT ON COLUMN sources.reliability_score IS 'Score de fiabilité de 0.00 (faible) à 1.00 (élevé)';

-- Données de référence
INSERT INTO sources (source_id, name, type, description, reliability_score) VALUES
  ('off_api', 'Open Food Facts', 'api', 'Base de données collaborative de produits alimentaires', 0.90),
  ('partner_carrefour', 'Carrefour API', 'partner', 'Flux de prix officiel Carrefour', 1.00),
  ('partner_leaderprice', 'Leader Price API', 'partner', 'Flux de prix officiel Leader Price', 1.00),
  ('citizen_app', 'Application Citoyenne', 'citizen', 'Prix saisis manuellement par les citoyens', 0.70),
  ('ocr_receipts', 'OCR Tickets', 'ocr', 'Prix extraits des tickets de caisse par OCR', 0.80);

CREATE INDEX idx_sources_type ON sources(type);
CREATE INDEX idx_sources_active ON sources(active) WHERE active = TRUE;

-- =============================================================================
-- 5. CONFIDENCE_LEVELS - Niveaux de confiance
-- =============================================================================

CREATE TABLE confidence_levels (
  level VARCHAR(20) PRIMARY KEY,
  description TEXT NOT NULL,
  score DECIMAL(3, 2) NOT NULL,
  color_code VARCHAR(7),
  
  CONSTRAINT chk_confidence_score CHECK (score BETWEEN 0 AND 1)
);

COMMENT ON TABLE confidence_levels IS 'Définition des niveaux de confiance pour les observations de prix';
COMMENT ON COLUMN confidence_levels.score IS 'Score de confiance de 0.00 à 1.00';
COMMENT ON COLUMN confidence_levels.color_code IS 'Code couleur hexadécimal pour l''UI (#RRGGBB)';

-- Données de référence
INSERT INTO confidence_levels (level, description, score, color_code) VALUES
  ('OK', 'Donnée validée et conforme', 1.00, '#10B981'),
  ('Suspect', 'Donnée avec anomalie détectée', 0.50, '#F59E0B'),
  ('À confirmer', 'Donnée incomplète ou inhabituelle', 0.30, '#EF4444');

-- =============================================================================
-- 6. PRICE_OBSERVATIONS - Observations de prix (IMMUTABLE avec TimescaleDB)
-- =============================================================================

CREATE TABLE price_observations (
  id BIGSERIAL,
  ean VARCHAR(14) NOT NULL,
  store_id VARCHAR(50) NOT NULL,
  territory VARCHAR(2) NOT NULL,
  
  -- Prix
  price DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2),
  unit VARCHAR(10),
  quantity DECIMAL(10, 3),
  
  -- Source et confiance
  source VARCHAR(20) NOT NULL,
  confidence_level VARCHAR(20) NOT NULL DEFAULT 'À confirmer',
  
  -- Timestamps
  captured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Métadonnées source
  source_id VARCHAR(100),
  source_url TEXT,
  receipt_id VARCHAR(50),
  raw_data JSONB,
  
  -- Contraintes
  CONSTRAINT chk_price_positive CHECK (price > 0 AND price < 100000),
  CONSTRAINT chk_unit_price_positive CHECK (unit_price IS NULL OR unit_price > 0),
  CONSTRAINT chk_quantity_positive CHECK (quantity IS NULL OR quantity > 0),
  CONSTRAINT chk_unit_valid CHECK (unit IS NULL OR unit IN ('kg', 'L', 'unité', 'g', 'ml', 'cl')),
  CONSTRAINT chk_source_valid CHECK (source IN ('partner', 'ocr', 'citizen')),
  CONSTRAINT chk_confidence_valid CHECK (confidence_level IN ('OK', 'Suspect', 'À confirmer')),
  
  -- Foreign Keys
  FOREIGN KEY (ean) REFERENCES products(ean),
  FOREIGN KEY (store_id) REFERENCES stores(store_id),
  FOREIGN KEY (territory) REFERENCES territories(code),
  FOREIGN KEY (confidence_level) REFERENCES confidence_levels(level)
);

COMMENT ON TABLE price_observations IS 'Historique IMMUTABLE (append-only) des observations de prix';
COMMENT ON COLUMN price_observations.captured_at IS 'Date et heure de capture du prix (pas de création du record)';
COMMENT ON COLUMN price_observations.source IS 'Type de source: partner, ocr, citizen';
COMMENT ON COLUMN price_observations.raw_data IS 'Données brutes JSON pour traçabilité complète';

-- Convertir en hypertable TimescaleDB (partitionnement automatique par temps)
SELECT create_hypertable('price_observations', 'captured_at', chunk_time_interval => INTERVAL '7 days');

-- Index pour requêtes fréquentes
CREATE INDEX idx_price_obs_ean_time ON price_observations(ean, captured_at DESC);
CREATE INDEX idx_price_obs_store_time ON price_observations(store_id, captured_at DESC);
CREATE INDEX idx_price_obs_territory_time ON price_observations(territory, captured_at DESC);
CREATE INDEX idx_price_obs_source ON price_observations(source);
CREATE INDEX idx_price_obs_confidence ON price_observations(confidence_level);
CREATE INDEX idx_price_obs_ean_store_time ON price_observations(ean, store_id, captured_at DESC);

-- Politique de rétention (optionnel - garder données 2 ans)
SELECT add_retention_policy('price_observations', INTERVAL '2 years');

-- Politique de compression (compression automatique après 7 jours)
ALTER TABLE price_observations SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'ean, store_id, territory',
  timescaledb.compress_orderby = 'captured_at DESC'
);

SELECT add_compression_policy('price_observations', INTERVAL '7 days');

-- =============================================================================
-- 7. PRICE_FLAGS - Annotations et signalements
-- =============================================================================

CREATE TABLE price_flags (
  flag_id BIGSERIAL PRIMARY KEY,
  observation_id BIGINT NOT NULL,
  flag_type VARCHAR(50) NOT NULL,
  flag_reason TEXT,
  severity VARCHAR(20) NOT NULL DEFAULT 'info',
  flagged_at TIMESTAMPTZ DEFAULT NOW(),
  flagged_by VARCHAR(100) DEFAULT 'system',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(100),
  resolution_notes TEXT,
  
  CONSTRAINT chk_flag_type CHECK (flag_type IN (
    'anomaly_high', 'anomaly_low', 'duplicate', 'outdated', 
    'invalid_format', 'missing_data', 'suspicious_pattern'
  )),
  CONSTRAINT chk_severity CHECK (severity IN ('info', 'warning', 'critical')),
  
  FOREIGN KEY (observation_id) REFERENCES price_observations(id)
);

COMMENT ON TABLE price_flags IS 'Annotations et signalements sur les observations de prix (ne modifie pas les données)';
COMMENT ON COLUMN price_flags.flagged_by IS 'Identifiant de l''utilisateur ou "system" pour flags automatiques';

CREATE INDEX idx_flags_observation ON price_flags(observation_id);
CREATE INDEX idx_flags_unresolved ON price_flags(resolved, flagged_at DESC) WHERE NOT resolved;
CREATE INDEX idx_flags_type ON price_flags(flag_type);
CREATE INDEX idx_flags_severity ON price_flags(severity);

-- =============================================================================
-- 8. VIEWS - Vues pour simplifier les requêtes
-- =============================================================================

-- Vue des prix valides (OK uniquement, non flaggés comme invalides)
CREATE VIEW valid_price_observations AS
SELECT 
  po.*,
  p.name AS product_name,
  p.brand AS product_brand,
  p.category AS product_category,
  s.name AS store_name,
  s.chain AS store_chain,
  t.name AS territory_name,
  EXTRACT(EPOCH FROM (NOW() - po.captured_at))/3600 AS age_hours
FROM price_observations po
JOIN products p ON po.ean = p.ean
JOIN stores s ON po.store_id = s.store_id
JOIN territories t ON po.territory = t.code
WHERE po.confidence_level = 'OK'
  AND NOT EXISTS (
    SELECT 1 FROM price_flags pf 
    WHERE pf.observation_id = po.id 
      AND pf.flag_type = 'invalid_format' 
      AND pf.resolved = FALSE
  );

COMMENT ON VIEW valid_price_observations IS 'Vue des observations de prix validées et non flaggées';

-- Vue des prix les plus récents par produit/magasin
CREATE VIEW latest_prices AS
SELECT DISTINCT ON (po.ean, po.store_id)
  po.*,
  p.name AS product_name,
  p.brand AS product_brand,
  s.name AS store_name,
  s.territory AS territory
FROM price_observations po
JOIN products p ON po.ean = p.ean
JOIN stores s ON po.store_id = s.store_id
WHERE po.confidence_level = 'OK'
ORDER BY po.ean, po.store_id, po.captured_at DESC;

COMMENT ON VIEW latest_prices IS 'Prix les plus récents par produit et magasin (confidence = OK)';

-- =============================================================================
-- 9. FUNCTIONS - Fonctions utilitaires
-- =============================================================================

-- Fonction pour obtenir le meilleur prix actuel d'un produit
CREATE OR REPLACE FUNCTION get_best_price(product_ean VARCHAR(14), territory_code VARCHAR(2) DEFAULT NULL)
RETURNS TABLE (
  store_id VARCHAR(50),
  store_name VARCHAR(255),
  price DECIMAL(10, 2),
  captured_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.store_id,
    lp.store_name,
    lp.price,
    lp.captured_at
  FROM latest_prices lp
  WHERE lp.ean = product_ean
    AND (territory_code IS NULL OR lp.territory = territory_code)
  ORDER BY lp.price ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_best_price IS 'Retourne le meilleur prix actuel pour un produit donné';

-- Fonction pour détecter les anomalies de prix
CREATE OR REPLACE FUNCTION detect_price_anomalies(product_ean VARCHAR(14), new_price DECIMAL(10, 2))
RETURNS TABLE (
  is_anomaly BOOLEAN,
  anomaly_type VARCHAR(20),
  median_price DECIMAL(10, 2),
  deviation_percent DECIMAL(5, 2)
) AS $$
DECLARE
  v_median DECIMAL(10, 2);
  v_deviation DECIMAL(5, 2);
BEGIN
  -- Calculer le prix médian des 30 derniers jours
  SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)
  INTO v_median
  FROM price_observations
  WHERE ean = product_ean
    AND captured_at >= NOW() - INTERVAL '30 days'
    AND confidence_level = 'OK';
  
  -- Si pas de médian, pas d'anomalie détectable
  IF v_median IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::VARCHAR(20), NULL::DECIMAL(10, 2), NULL::DECIMAL(5, 2);
    RETURN;
  END IF;
  
  -- Calculer la déviation en pourcentage
  v_deviation := ((new_price - v_median) / v_median) * 100;
  
  -- Détecter anomalie (>50% d'écart)
  IF ABS(v_deviation) > 50 THEN
    IF v_deviation > 0 THEN
      RETURN QUERY SELECT TRUE, 'anomaly_high'::VARCHAR(20), v_median, v_deviation;
    ELSE
      RETURN QUERY SELECT TRUE, 'anomaly_low'::VARCHAR(20), v_median, v_deviation;
    END IF;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::VARCHAR(20), v_median, v_deviation;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_price_anomalies IS 'Détecte si un nouveau prix est anormalement haut ou bas';

-- =============================================================================
-- 10. TRIGGERS - Validation automatique
-- =============================================================================

-- Trigger pour auto-flagging des anomalies
CREATE OR REPLACE FUNCTION auto_flag_anomalies()
RETURNS TRIGGER AS $$
DECLARE
  v_anomaly RECORD;
BEGIN
  -- Détecter anomalie
  SELECT * INTO v_anomaly
  FROM detect_price_anomalies(NEW.ean, NEW.price);
  
  -- Si anomalie détectée, créer un flag
  IF v_anomaly.is_anomaly THEN
    INSERT INTO price_flags (observation_id, flag_type, flag_reason, severity)
    VALUES (
      NEW.id,
      v_anomaly.anomaly_type,
      format('Prix %.2f€ dévie de %.1f%% par rapport à la médiane (%.2f€)', 
             NEW.price, v_anomaly.deviation_percent, v_anomaly.median_price),
      'warning'
    );
    
    -- Marquer l'observation comme Suspect
    NEW.confidence_level := 'Suspect';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_flag_anomalies
  BEFORE INSERT ON price_observations
  FOR EACH ROW
  EXECUTE FUNCTION auto_flag_anomalies();

COMMENT ON TRIGGER trg_auto_flag_anomalies ON price_observations IS 'Détecte et flagge automatiquement les anomalies de prix';

-- =============================================================================
-- 11. PERMISSIONS - Lecture seule pour applications
-- =============================================================================

-- Créer un rôle lecture seule pour l'application
CREATE ROLE app_readonly;
GRANT CONNECT ON DATABASE postgres TO app_readonly;
GRANT USAGE ON SCHEMA public TO app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO app_readonly;

-- Créer un rôle écriture pour les collecteurs
CREATE ROLE app_collector;
GRANT app_readonly TO app_collector;
GRANT INSERT ON price_observations TO app_collector;
GRANT INSERT ON price_flags TO app_collector;

COMMENT ON ROLE app_readonly IS 'Rôle lecture seule pour les APIs et modules métier';
COMMENT ON ROLE app_collector IS 'Rôle pour les services de collecte de prix (insert only)';

-- =============================================================================
-- Migration completed successfully
-- =============================================================================
