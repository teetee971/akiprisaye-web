/**
 * Utilitaire de normalisation et hashing des données
 * Garantit un hash identique pour des données équivalentes
 * 
 * @module dataIntegrity
 */

import crypto from 'crypto';

/**
 * Normalise un objet JSON de manière canonique
 * - Trie les clés alphabétiquement
 * - Supprime les espaces inutiles
 * - Format stable et reproductible
 * 
 * @param {Object} data - Données à normaliser
 * @returns {string} JSON normalisé
 */
export function canonicalizeJSON(data) {
  if (data === null) return 'null';
  if (typeof data !== 'object') return JSON.stringify(data);
  
  if (Array.isArray(data)) {
    return '[' + data.map(item => canonicalizeJSON(item)).join(',') + ']';
  }
  
  // Trier les clés alphabétiquement
  const sortedKeys = Object.keys(data).sort();
  const pairs = sortedKeys.map(key => {
    return JSON.stringify(key) + ':' + canonicalizeJSON(data[key]);
  });
  
  return '{' + pairs.join(',') + '}';
}

/**
 * Calcule le hash SHA-256 d'un objet de données
 * 
 * @param {Object} data - Données à hasher
 * @returns {string} Hash en hexadécimal
 */
export function hashData(data) {
  const canonical = canonicalizeJSON(data);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Génère une preuve d'intégrité pour un dataset
 * 
 * @param {Object} data - Données à certifier
 * @param {Object} metadata - Métadonnées (nom du dataset, version, etc.)
 * @returns {Object} Preuve d'intégrité
 */
export function generateProof(data, metadata = {}) {
  const hash = hashData(data);
  const timestamp = new Date().toISOString();
  
  return {
    hash,
    algorithme: 'SHA-256',
    timestamp,
    metadata: {
      nom: metadata.nom || 'dataset',
      version: metadata.version || '1.0.0',
      territoire: metadata.territoire || null,
      periode: metadata.periode || null,
      ...metadata
    },
    verification: {
      methode: 'Recalculer le hash des données et comparer',
      clePublique: '/transparence/cle-publique.json'
    }
  };
}

/**
 * Vérifie l'intégrité d'un dataset
 * 
 * @param {Object} data - Données à vérifier
 * @param {Object} proof - Preuve d'intégrité
 * @returns {boolean} True si les données sont intègres
 */
export function verifyIntegrity(data, proof) {
  const calculatedHash = hashData(data);
  return calculatedHash === proof.hash;
}

/**
 * Génère un rapport de vérification lisible
 * 
 * @param {Object} data - Données vérifiées
 * @param {Object} proof - Preuve d'intégrité
 * @returns {Object} Rapport de vérification
 */
export function generateVerificationReport(data, proof) {
  const calculatedHash = hashData(data);
  const isValid = calculatedHash === proof.hash;
  
  return {
    valide: isValid,
    hashCalcule: calculatedHash,
    hashAttendu: proof.hash,
    algorithme: proof.algorithme,
    timestamp: proof.timestamp,
    metadata: proof.metadata,
    message: isValid
      ? '✅ Données certifiées - Aucune modification détectée'
      : '❌ ATTENTION - Les données ont été modifiées ou corrompues'
  };
}
