/**
 * TypeScript schema for price observations from receipt tickets
 * "A KI PRI SA YÉ" - Manual ingestion module
 */

/**
 * Product on a receipt
 */
export interface Product {
  /** Product name/description as shown on receipt */
  nom: string;
  /** Quantity purchased */
  quantite: number;
  /** Unit price in euros */
  prix_unitaire: number;
  /** Total price for this product (prix_unitaire * quantite) */
  prix_total: number;
  /** VAT percentage (e.g., 0, 2.1, 5.5, 10, 20) */
  tva_pct: number;
  /** Optional: Product category */
  categorie?: string;
  /** Optional: EAN/GTIN barcode */
  ean?: string;
}

/**
 * Complete observation from a receipt ticket
 */
export interface Observation {
  /** Unique identifier (auto-generated: YYYY-MM-DD-HHMMSS-random) */
  id: string;
  /** Territory (DROM-COM) */
  territoire: string;
  /** Municipality/commune */
  commune: string;
  /** Store brand/name */
  enseigne: string;
  /** Optional: Store ID if available on receipt */
  magasin_id?: string;
  /** Date of purchase (YYYY-MM-DD) */
  date: string;
  /** Time of purchase (HH:MM:SS) */
  heure: string;
  /** List of products on the receipt */
  produits: Product[];
  /** Total amount including tax (euros) */
  total_ttc: number;
  /** Source type - always "ticket_caisse" for this module */
  source: 'ticket_caisse';
  /** Reliability level - always "preuve_physique" for receipt-based observations */
  fiabilite: 'preuve_physique';
  /** Verification status - false by default, set to true after manual verification */
  verifie: boolean;
  /** Timestamp when the observation was created (ISO 8601) */
  created_at: string;
  /** Optional: Additional notes or comments */
  notes?: string;
}

/**
 * Validate a product object
 * @param product - Product to validate
 * @returns Array of error messages (empty if valid)
 */
export function validateProduct(product: any): string[] {
  const errors: string[] = [];

  if (!product || typeof product !== 'object') {
    errors.push('Product must be an object');
    return errors;
  }

  // Required fields
  if (typeof product.nom !== 'string' || product.nom.trim() === '') {
    errors.push('Product "nom" must be a non-empty string');
  }

  if (typeof product.quantite !== 'number' || product.quantite <= 0) {
    errors.push('Product "quantite" must be a positive number');
  }

  if (typeof product.prix_unitaire !== 'number' || product.prix_unitaire < 0) {
    errors.push('Product "prix_unitaire" must be a non-negative number');
  }

  if (typeof product.prix_total !== 'number' || product.prix_total < 0) {
    errors.push('Product "prix_total" must be a non-negative number');
  }

  if (typeof product.tva_pct !== 'number' || product.tva_pct < 0 || product.tva_pct > 100) {
    errors.push('Product "tva_pct" must be a number between 0 and 100');
  }

  // Optional fields validation
  if (product.categorie !== undefined && typeof product.categorie !== 'string') {
    errors.push('Product "categorie" must be a string if provided');
  }

  if (
    product.ean !== undefined &&
    (typeof product.ean !== 'string' || !/^\d{8,13}$/.test(product.ean))
  ) {
    errors.push('Product "ean" must be an 8-13 digit string if provided');
  }

  return errors;
}

/**
 * Validate an observation object
 * @param observation - Observation to validate
 * @returns Array of error messages (empty if valid)
 */
export function validateObservation(observation: any): string[] {
  const errors: string[] = [];

  if (!observation || typeof observation !== 'object') {
    errors.push('Observation must be an object');
    return errors;
  }

  // Required fields
  if (typeof observation.id !== 'string' || observation.id.trim() === '') {
    errors.push('Field "id" must be a non-empty string');
  }

  const validTerritories = [
    'Guadeloupe',
    'Martinique',
    'Guyane',
    'La Réunion',
    'Mayotte',
    'Saint-Pierre-et-Miquelon',
    'Saint-Barthélemy',
    'Saint-Martin',
    'Wallis-et-Futuna',
    'Polynésie française',
    'Nouvelle-Calédonie',
  ];

  if (
    typeof observation.territoire !== 'string' ||
    !validTerritories.includes(observation.territoire)
  ) {
    errors.push(`Field "territoire" must be one of: ${validTerritories.join(', ')}`);
  }

  if (typeof observation.commune !== 'string' || observation.commune.trim() === '') {
    errors.push('Field "commune" must be a non-empty string');
  }

  if (typeof observation.enseigne !== 'string' || observation.enseigne.trim() === '') {
    errors.push('Field "enseigne" must be a non-empty string');
  }

  if (observation.magasin_id !== undefined && typeof observation.magasin_id !== 'string') {
    errors.push('Field "magasin_id" must be a string if provided');
  }

  // Date validation (YYYY-MM-DD)
  if (typeof observation.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(observation.date)) {
    errors.push('Field "date" must be in YYYY-MM-DD format');
  }

  // Time validation (HH:MM:SS)
  if (typeof observation.heure !== 'string' || !/^\d{2}:\d{2}:\d{2}$/.test(observation.heure)) {
    errors.push('Field "heure" must be in HH:MM:SS format');
  }

  // Products array
  if (!Array.isArray(observation.produits) || observation.produits.length === 0) {
    errors.push('Field "produits" must be a non-empty array');
  } else {
    observation.produits.forEach((product: any, index: number) => {
      const productErrors = validateProduct(product);
      productErrors.forEach((err) => {
        errors.push(`Product ${index + 1}: ${err}`);
      });
    });
  }

  if (typeof observation.total_ttc !== 'number' || observation.total_ttc <= 0) {
    errors.push('Field "total_ttc" must be a positive number');
  }

  if (observation.source !== 'ticket_caisse') {
    errors.push('Field "source" must be "ticket_caisse"');
  }

  if (observation.fiabilite !== 'preuve_physique') {
    errors.push('Field "fiabilite" must be "preuve_physique"');
  }

  if (typeof observation.verifie !== 'boolean') {
    errors.push('Field "verifie" must be a boolean');
  }

  // ISO 8601 timestamp validation
  if (typeof observation.created_at !== 'string' || isNaN(Date.parse(observation.created_at))) {
    errors.push('Field "created_at" must be a valid ISO 8601 timestamp');
  }

  if (observation.notes !== undefined && typeof observation.notes !== 'string') {
    errors.push('Field "notes" must be a string if provided');
  }

  return errors;
}
