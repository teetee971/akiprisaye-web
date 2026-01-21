// src/types/PriceObservation.ts

export type TerritoryCode =
  | 'FR'
  | 'GP'
  | 'MQ'
  | 'GF'
  | 'RE'
  | 'YT'
  | 'PM'
  | 'BL'
  | 'MF'
  | 'WF'
  | 'PF'
  | 'NC';

export type ProductCategory =
  | 'Produits laitiers'
  | 'Fruits et légumes'
  | 'Viandes et poissons'
  | 'Épicerie'
  | 'Boissons'
  | 'Hygiène et beauté'
  | 'Entretien'
  | 'Bébé'
  | 'Autres';

export interface PriceObservation {
  /** Identifiant interne (optionnel, ex: Firestore) */
  id?: string;

  /** Identifiant produit normalisé */
  productId: string;

  /** Libellé brut du produit */
  productLabel: string;

  /** Territoire ISO / DOM */
  territory: TerritoryCode;

  /** Prix observé */
  price: number;

  /** Date d’observation (ISO 8601) */
  observedAt: string;

  /** Nom de l’enseigne */
  storeLabel?: string;

  /** Catégorie produit */
  productCategory?: ProductCategory;

  /** Devise (actuellement EUR uniquement) */
  currency?: 'EUR';

  /** Source de l’observation */
  sourceType?: 'citizen' | 'open_data' | 'partner';

  /** Score de confiance calculé */
  confidenceScore?: number;

  /** Nombre d’observations agrégées */
  observationsCount?: number;

  /** Source libre (URL, OCR, API…) */
  source?: string;

  /** Unité de vente */
  unit?: 'unit' | 'kg' | 'l';

  /** Prix unitaire normalisé */
  pricePerUnit?: number;

  /** Libellé nettoyé / normalisé */
  normalizedLabel?: string;

  /** Code-barres (EAN/UPC) */
  barcode?: string;

  /** Marque */
  brand?: string;

  /** Métadonnées additionnelles */
  metadata?: Record<string, string>;
}
