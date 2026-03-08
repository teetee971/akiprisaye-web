-- Receipt Import Module — Migration SQL
-- Ajoute les tables nécessaires au pipeline d'ingestion de tickets OCR

-- stores
CREATE TABLE IF NOT EXISTS "stores" (
  "id"             TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "rawName"        TEXT,
  "brand"          TEXT,
  "company"        TEXT,
  "siret"          TEXT,
  "phone"          TEXT,
  "address"        TEXT,
  "postalCode"     TEXT,
  "city"           TEXT,
  "territory"      TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "stores_normalizedName_territory_key"
  ON "stores"("normalizedName", "territory");
CREATE INDEX IF NOT EXISTS "stores_territory_idx" ON "stores"("territory");
CREATE INDEX IF NOT EXISTS "stores_normalizedName_idx" ON "stores"("normalizedName");

-- receipts
CREATE TABLE IF NOT EXISTS "receipts" (
  "id"              TEXT NOT NULL,
  "source"          TEXT NOT NULL DEFAULT 'ocr_ticket',
  "storeId"         TEXT NOT NULL,
  "territory"       TEXT NOT NULL,
  "receiptDate"     TIMESTAMP(3) NOT NULL,
  "receiptTime"     TEXT,
  "currency"        TEXT NOT NULL DEFAULT 'EUR',
  "itemsCount"      INTEGER,
  "linesCount"      INTEGER,
  "subtotalHt"      DOUBLE PRECISION,
  "totalTtc"        DOUBLE PRECISION NOT NULL,
  "rawOcrText"      TEXT,
  "confidenceScore" INTEGER NOT NULL DEFAULT 0,
  "needsReview"     BOOLEAN NOT NULL DEFAULT false,
  "checksum"        TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "receipts_checksum_key" ON "receipts"("checksum") WHERE "checksum" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "receipts_storeId_idx"    ON "receipts"("storeId");
CREATE INDEX IF NOT EXISTS "receipts_territory_idx"  ON "receipts"("territory");
CREATE INDEX IF NOT EXISTS "receipts_receiptDate_idx" ON "receipts"("receiptDate");

ALTER TABLE "receipts" ADD CONSTRAINT "receipts_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- receipt_items
CREATE TABLE IF NOT EXISTS "receipt_items" (
  "id"               TEXT NOT NULL,
  "receiptId"        TEXT NOT NULL,
  "lineIndex"        INTEGER NOT NULL,
  "rawLabel"         TEXT NOT NULL,
  "normalizedLabel"  TEXT,
  "brand"            TEXT,
  "category"         TEXT,
  "subcategory"      TEXT,
  "quantity"         DOUBLE PRECISION,
  "unit"             TEXT,
  "packageSizeValue" DOUBLE PRECISION,
  "packageSizeUnit"  TEXT,
  "unitPrice"        DOUBLE PRECISION,
  "totalPrice"       DOUBLE PRECISION NOT NULL,
  "vatRate"          DOUBLE PRECISION,
  "barcode"          TEXT,
  "productId"        TEXT,
  "confidenceScore"  INTEGER NOT NULL DEFAULT 0,
  "needsReview"      BOOLEAN NOT NULL DEFAULT false,
  "notes"            TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "receipt_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "receipt_items_receiptId_idx" ON "receipt_items"("receiptId");
CREATE INDEX IF NOT EXISTS "receipt_items_productId_idx" ON "receipt_items"("productId");

ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_receiptId_fkey"
  FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- products
CREATE TABLE IF NOT EXISTS "products" (
  "id"                   TEXT NOT NULL,
  "productKey"           TEXT NOT NULL,
  "displayName"          TEXT NOT NULL,
  "rawLabel"             TEXT NOT NULL,
  "normalizedLabel"      TEXT NOT NULL,
  "brand"                TEXT,
  "category"             TEXT,
  "subcategory"          TEXT,
  "barcode"              TEXT,
  "packageSizeValue"     DOUBLE PRECISION,
  "packageSizeUnit"      TEXT,
  "primaryImageUrl"      TEXT,
  "imageSource"          TEXT,
  "imageSourceType"      TEXT,
  "imageConfidenceScore" INTEGER,
  "imageNeedsReview"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "products_productKey_key" ON "products"("productKey");
CREATE UNIQUE INDEX IF NOT EXISTS "products_barcode_key"    ON "products"("barcode") WHERE "barcode" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "products_category_idx"         ON "products"("category");
CREATE INDEX IF NOT EXISTS "products_barcode_idx"          ON "products"("barcode");

ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- product_images
CREATE TABLE IF NOT EXISTS "product_images" (
  "id"              TEXT NOT NULL,
  "productId"       TEXT NOT NULL,
  "imageUrl"        TEXT NOT NULL,
  "thumbnailUrl"    TEXT,
  "pageUrl"         TEXT,
  "source"          TEXT NOT NULL,
  "sourceType"      TEXT NOT NULL,
  "confidenceScore" INTEGER NOT NULL DEFAULT 0,
  "isPrimary"       BOOLEAN NOT NULL DEFAULT false,
  "needsReview"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "product_images_productId_idx" ON "product_images"("productId");
CREATE INDEX IF NOT EXISTS "product_images_isPrimary_idx" ON "product_images"("isPrimary");

ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- price_observations
CREATE TABLE IF NOT EXISTS "price_observations" (
  "id"               TEXT NOT NULL,
  "source"           TEXT NOT NULL DEFAULT 'receipt_ocr',
  "receiptId"        TEXT,
  "receiptItemId"    TEXT,
  "productId"        TEXT,
  "territory"        TEXT NOT NULL,
  "storeId"          TEXT,
  "storeLabel"       TEXT NOT NULL,
  "observedAt"       TIMESTAMP(3) NOT NULL,
  "productLabel"     TEXT NOT NULL,
  "normalizedLabel"  TEXT NOT NULL,
  "category"         TEXT,
  "brand"            TEXT,
  "barcode"          TEXT,
  "quantity"         DOUBLE PRECISION,
  "unit"             TEXT,
  "packageSizeValue" DOUBLE PRECISION,
  "packageSizeUnit"  TEXT,
  "price"            DOUBLE PRECISION NOT NULL,
  "currency"         TEXT NOT NULL DEFAULT 'EUR',
  "confidenceScore"  INTEGER NOT NULL DEFAULT 0,
  "needsReview"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "price_observations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "price_obs_product_territory_date_idx"
  ON "price_observations"("productId", "territory", "observedAt");
CREATE INDEX IF NOT EXISTS "price_obs_territory_date_idx"
  ON "price_observations"("territory", "observedAt");
CREATE INDEX IF NOT EXISTS "price_obs_storeId_idx"     ON "price_observations"("storeId");
CREATE INDEX IF NOT EXISTS "price_obs_needsReview_idx" ON "price_observations"("needsReview");

ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_receiptId_fkey"
  FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_receiptItemId_fkey"
  FOREIGN KEY ("receiptItemId") REFERENCES "receipt_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- price_history_monthly
CREATE TABLE IF NOT EXISTS "price_history_monthly" (
  "id"                TEXT NOT NULL,
  "productId"         TEXT NOT NULL,
  "territory"         TEXT NOT NULL,
  "year"              INTEGER NOT NULL,
  "month"             INTEGER NOT NULL,
  "avgPrice"          DOUBLE PRECISION NOT NULL,
  "minPrice"          DOUBLE PRECISION NOT NULL,
  "maxPrice"          DOUBLE PRECISION NOT NULL,
  "observationsCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "price_history_monthly_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "price_hist_monthly_unique"
  ON "price_history_monthly"("productId", "territory", "year", "month");
CREATE INDEX IF NOT EXISTS "price_hist_monthly_idx"
  ON "price_history_monthly"("productId", "territory", "year", "month");

ALTER TABLE "price_history_monthly" ADD CONSTRAINT "price_hist_monthly_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- price_history_yearly
CREATE TABLE IF NOT EXISTS "price_history_yearly" (
  "id"                TEXT NOT NULL,
  "productId"         TEXT NOT NULL,
  "territory"         TEXT NOT NULL,
  "year"              INTEGER NOT NULL,
  "avgPrice"          DOUBLE PRECISION NOT NULL,
  "minPrice"          DOUBLE PRECISION NOT NULL,
  "maxPrice"          DOUBLE PRECISION NOT NULL,
  "observationsCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "price_history_yearly_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "price_hist_yearly_unique"
  ON "price_history_yearly"("productId", "territory", "year");
CREATE INDEX IF NOT EXISTS "price_hist_yearly_idx"
  ON "price_history_yearly"("productId", "territory", "year");

ALTER TABLE "price_history_yearly" ADD CONSTRAINT "price_hist_yearly_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- price_alert_rules
CREATE TABLE IF NOT EXISTS "price_alert_rules" (
  "id"                   TEXT NOT NULL,
  "userId"               TEXT NOT NULL,
  "territory"            TEXT NOT NULL,
  "productId"            TEXT,
  "category"             TEXT,
  "thresholdType"        TEXT NOT NULL,
  "thresholdValue"       DOUBLE PRECISION NOT NULL,
  "notificationChannels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isActive"             BOOLEAN NOT NULL DEFAULT true,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "price_alert_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "price_alert_rules_userId_idx"    ON "price_alert_rules"("userId");
CREATE INDEX IF NOT EXISTS "price_alert_rules_productId_idx" ON "price_alert_rules"("productId");
CREATE INDEX IF NOT EXISTS "price_alert_rules_active_idx"    ON "price_alert_rules"("isActive");

-- price_alert_events
CREATE TABLE IF NOT EXISTS "price_alert_events" (
  "id"            TEXT NOT NULL,
  "ruleId"        TEXT,
  "productId"     TEXT NOT NULL,
  "territory"     TEXT NOT NULL,
  "observedAt"    TIMESTAMP(3) NOT NULL,
  "currentPrice"  DOUBLE PRECISION NOT NULL,
  "previousPrice" DOUBLE PRECISION,
  "eventType"     TEXT NOT NULL,
  "payloadJson"   JSONB,
  "processed"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "price_alert_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "price_alert_events_productId_idx" ON "price_alert_events"("productId", "territory");
CREATE INDEX IF NOT EXISTS "price_alert_events_processed_idx" ON "price_alert_events"("processed");

-- review_queue
CREATE TABLE IF NOT EXISTS "review_queue_entries" (
  "id"          TEXT NOT NULL,
  "entityType"  TEXT NOT NULL,
  "entityId"    TEXT NOT NULL,
  "reason"      TEXT NOT NULL,
  "payloadJson" JSONB,
  "status"      TEXT NOT NULL DEFAULT 'pending',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "review_queue_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "review_queue_status_type_idx"
  ON "review_queue_entries"("status", "entityType");
CREATE INDEX IF NOT EXISTS "review_queue_entityId_idx" ON "review_queue_entries"("entityId");
