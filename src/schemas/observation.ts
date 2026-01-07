/**
 * A KI PRI SA YÉ - Observation Schema
 * 
 * Schema TypeScript strict pour les observations de prix basées sur tickets de caisse
 * Sans dépendances externes - Validation native
 */

export interface Product {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  tva_pct?: number;
  categorie?: string;
  ean?: string;
}

export interface Observation {
  id: string;
  territoire: string;
  commune: string;
  enseigne: string;
  magasin_id?: string;
  date: string; // YYYY-MM-DD
  heure: string; // HH:MM:SS
  produits: Product[];
  total_ttc: number;
  source: 'ticket_caisse';
  fiabilite: 'preuve_physique';
  verifie: boolean;
  created_at: string; // ISO 8601 timestamp
}

/**
 * Valide un objet comme Observation
 * @param obj Object à valider
 * @returns Array d'erreurs (vide si valide)
 */
export function validateObservation(obj: any): string[] {
  const errors: string[] = [];

  // Vérifications champs obligatoires
  if (!obj || typeof obj !== 'object') {
    errors.push('L\'observation doit être un objet');
    return errors;
  }

  // ID
  if (typeof obj.id !== 'string' || obj.id.trim().length === 0) {
    errors.push('Le champ "id" est requis et doit être une chaîne non vide');
  }

  // Territoire
  const territoiresValides = [
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
    'Terres australes et antarctiques françaises',
    'Hexagone'
  ];
  if (!territoiresValides.includes(obj.territoire)) {
    errors.push(`Le champ "territoire" doit être l'un des suivants: ${territoiresValides.join(', ')}`);
  }

  // Commune
  if (typeof obj.commune !== 'string' || obj.commune.trim().length === 0) {
    errors.push('Le champ "commune" est requis et doit être une chaîne non vide');
  }

  // Enseigne
  if (typeof obj.enseigne !== 'string' || obj.enseigne.trim().length === 0) {
    errors.push('Le champ "enseigne" est requis et doit être une chaîne non vide');
  }

  // Date (format YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (typeof obj.date !== 'string' || !dateRegex.test(obj.date)) {
    errors.push('Le champ "date" doit être au format YYYY-MM-DD');
  }

  // Heure (format HH:MM:SS)
  const heureRegex = /^\d{2}:\d{2}:\d{2}$/;
  if (typeof obj.heure !== 'string' || !heureRegex.test(obj.heure)) {
    errors.push('Le champ "heure" doit être au format HH:MM:SS');
  }

  // Produits
  if (!Array.isArray(obj.produits) || obj.produits.length === 0) {
    errors.push('Le champ "produits" doit être un tableau non vide');
  } else {
    obj.produits.forEach((produit: any, index: number) => {
      if (typeof produit !== 'object') {
        errors.push(`Le produit à l'index ${index} doit être un objet`);
        return;
      }

      if (typeof produit.nom !== 'string' || produit.nom.trim().length === 0) {
        errors.push(`Le produit à l'index ${index} doit avoir un "nom" (chaîne non vide)`);
      }

      if (typeof produit.quantite !== 'number' || produit.quantite <= 0) {
        errors.push(`Le produit à l'index ${index} doit avoir une "quantite" positive`);
      }

      if (typeof produit.prix_unitaire !== 'number' || produit.prix_unitaire < 0) {
        errors.push(`Le produit à l'index ${index} doit avoir un "prix_unitaire" >= 0`);
      }

      if (typeof produit.prix_total !== 'number' || produit.prix_total < 0) {
        errors.push(`Le produit à l'index ${index} doit avoir un "prix_total" >= 0`);
      }

      // Vérification cohérence prix (tolérance pour arrondis)
      const PRICE_CALCULATION_TOLERANCE = 0.02;
      const expectedTotal = produit.quantite * produit.prix_unitaire;
      if (Math.abs(produit.prix_total - expectedTotal) > PRICE_CALCULATION_TOLERANCE) {
        errors.push(
          `Le produit à l'index ${index} a une incohérence: prix_total (${produit.prix_total}) != quantite (${produit.quantite}) × prix_unitaire (${produit.prix_unitaire})`
        );
      }
    });
  }

  // Total TTC
  if (typeof obj.total_ttc !== 'number' || obj.total_ttc < 0) {
    errors.push('Le champ "total_ttc" doit être un nombre >= 0');
  }

  // Source
  if (obj.source !== 'ticket_caisse') {
    errors.push('Le champ "source" doit être "ticket_caisse"');
  }

  // Fiabilité
  if (obj.fiabilite !== 'preuve_physique') {
    errors.push('Le champ "fiabilite" doit être "preuve_physique"');
  }

  // Vérifié
  if (typeof obj.verifie !== 'boolean') {
    errors.push('Le champ "verifie" doit être un booléen');
  }

  // Created_at (ISO 8601)
  if (typeof obj.created_at !== 'string') {
    errors.push('Le champ "created_at" doit être une chaîne (ISO 8601)');
  } else {
    const timestamp = new Date(obj.created_at);
    if (isNaN(timestamp.getTime())) {
      errors.push('Le champ "created_at" doit être un timestamp ISO 8601 valide');
    }
  }

  return errors;
}

/**
 * Valide un objet Product
 * @param obj Object à valider
 * @returns Array d'erreurs (vide si valide)
 */
export function validateProduct(obj: any): string[] {
  const errors: string[] = [];

  if (!obj || typeof obj !== 'object') {
    errors.push('Le produit doit être un objet');
    return errors;
  }

  if (typeof obj.nom !== 'string' || obj.nom.trim().length === 0) {
    errors.push('Le champ "nom" est requis et doit être une chaîne non vide');
  }

  if (typeof obj.quantite !== 'number' || obj.quantite <= 0) {
    errors.push('Le champ "quantite" doit être un nombre > 0');
  }

  if (typeof obj.prix_unitaire !== 'number' || obj.prix_unitaire < 0) {
    errors.push('Le champ "prix_unitaire" doit être un nombre >= 0');
  }

  if (typeof obj.prix_total !== 'number' || obj.prix_total < 0) {
    errors.push('Le champ "prix_total" doit être un nombre >= 0');
  }

  return errors;
}
