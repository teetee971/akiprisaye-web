/**
 * Validation des identifiants d'entreprises françaises (SIREN/SIRET)
 *
 * Conformité légale:
 * - Décret n°82-130 du 9 février 1982
 * - Article R123-220 du Code de commerce
 * - Algorithme de Luhn pour la validation
 *
 * Base juridique RGPD:
 * - Article 6.1.e: mission d'intérêt public
 * - Les numéros SIREN/SIRET sont des données publiques (Open Data INSEE)
 */

/**
 * Valide un numéro SIREN selon l'algorithme de Luhn
 *
 * Le SIREN est un identifiant à 9 chiffres délivré par l'INSEE.
 * Il utilise l'algorithme de Luhn pour vérifier sa validité.
 *
 * @param siren - Numéro SIREN à valider (9 chiffres)
 * @returns true si le SIREN est valide, false sinon
 *
 * @example
 * validateSiren('732829320') // true - SIREN valide
 * validateSiren('123456789') // false - SIREN invalide (clé de contrôle incorrecte)
 * validateSiren('12345678')  // false - longueur incorrecte
 */
export function validateSiren(siren: string): boolean {
  // Vérification du format: exactement 9 chiffres
  if (!siren || typeof siren !== 'string') {
    return false;
  }

  // Suppression des espaces éventuels
  const cleanSiren = siren.replace(/\s/g, '');

  // Vérification de la longueur
  if (cleanSiren.length !== 9) {
    return false;
  }

  // Vérification que ce sont bien des chiffres
  if (!/^\d{9}$/.test(cleanSiren)) {
    return false;
  }

  // Application de l'algorithme de Luhn
  return validateLuhn(cleanSiren);
}

/**
 * Valide un numéro SIRET selon l'algorithme de Luhn
 *
 * Le SIRET est composé de 14 chiffres:
 * - 9 premiers chiffres = SIREN (identifiant de l'entreprise)
 * - 5 derniers chiffres = NIC (Numéro Interne de Classement de l'établissement)
 *
 * @param siret - Numéro SIRET à valider (14 chiffres)
 * @returns true si le SIRET est valide, false sinon
 *
 * @example
 * validateSiret('73282932000074') // true - SIRET valide
 * validateSiret('12345678901234') // false - SIRET invalide (clé de contrôle incorrecte)
 * validateSiret('123456789')      // false - longueur incorrecte
 */
export function validateSiret(siret: string): boolean {
  // Vérification du format: exactement 14 chiffres
  if (!siret || typeof siret !== 'string') {
    return false;
  }

  // Suppression des espaces éventuels
  const cleanSiret = siret.replace(/\s/g, '');

  // Vérification de la longueur
  if (cleanSiret.length !== 14) {
    return false;
  }

  // Vérification que ce sont bien des chiffres
  if (!/^\d{14}$/.test(cleanSiret)) {
    return false;
  }

  // Application de l'algorithme de Luhn
  return validateLuhn(cleanSiret);
}

/**
 * Vérifie la cohérence entre un SIREN et un SIRET
 *
 * Un SIRET valide doit contenir le SIREN dans ses 9 premiers chiffres.
 * Cette fonction vérifie que:
 * 1. Le SIREN est valide
 * 2. Le SIRET est valide
 * 3. Le SIRET commence bien par le SIREN
 *
 * @param siren - Numéro SIREN (9 chiffres)
 * @param siret - Numéro SIRET (14 chiffres)
 * @returns true si SIREN et SIRET sont cohérents, false sinon
 *
 * @example
 * validateSirenSiretConsistency('732829320', '73282932000074') // true
 * validateSirenSiretConsistency('732829320', '12345678901234') // false
 */
export function validateSirenSiretConsistency(siren: string, siret: string): boolean {
  // Vérification de la validité individuelle
  if (!validateSiren(siren)) {
    return false;
  }

  if (!validateSiret(siret)) {
    return false;
  }

  // Nettoyage des espaces
  const cleanSiren = siren.replace(/\s/g, '');
  const cleanSiret = siret.replace(/\s/g, '');

  // Vérification que le SIRET commence par le SIREN
  return cleanSiret.startsWith(cleanSiren);
}

/**
 * Extrait le SIREN d'un SIRET
 *
 * @param siret - Numéro SIRET (14 chiffres)
 * @returns Le SIREN (9 premiers chiffres) ou null si le SIRET est invalide
 *
 * @example
 * extractSirenFromSiret('73282932000074') // '732829320'
 * extractSirenFromSiret('invalid')        // null
 */
export function extractSirenFromSiret(siret: string): string | null {
  if (!validateSiret(siret)) {
    return null;
  }

  const cleanSiret = siret.replace(/\s/g, '');
  return cleanSiret.substring(0, 9);
}

/**
 * Implémentation de l'algorithme de Luhn
 *
 * L'algorithme de Luhn est utilisé pour valider les numéros SIREN et SIRET.
 * C'est une méthode de validation par clé de contrôle.
 *
 * Processus:
 * 1. En partant de la droite, doubler la valeur d'un chiffre sur deux
 * 2. Si le résultat est > 9, soustraire 9
 * 3. Additionner tous les chiffres
 * 4. Le résultat doit être divisible par 10
 *
 * @param number - Chaîne de chiffres à valider
 * @returns true si la clé de contrôle est valide, false sinon
 *
 * Référence: ISO/IEC 7812-1
 */
function validateLuhn(number: string): boolean {
  let sum = 0;
  let isEven = false;

  // Parcours du numéro de droite à gauche
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  // Le numéro est valide si la somme est divisible par 10
  return sum % 10 === 0;
}

/**
 * Formate un SIREN pour l'affichage
 *
 * @param siren - Numéro SIREN (9 chiffres)
 * @returns SIREN formaté avec espaces (XXX XXX XXX) ou la chaîne d'origine si invalide
 *
 * @example
 * formatSiren('732829320') // '732 829 320'
 */
export function formatSiren(siren: string): string {
  const cleanSiren = siren.replace(/\s/g, '');

  if (cleanSiren.length !== 9) {
    return siren;
  }

  return `${cleanSiren.substring(0, 3)} ${cleanSiren.substring(3, 6)} ${cleanSiren.substring(6, 9)}`;
}

/**
 * Formate un SIRET pour l'affichage
 *
 * @param siret - Numéro SIRET (14 chiffres)
 * @returns SIRET formaté avec espaces (XXX XXX XXX XXXXX) ou la chaîne d'origine si invalide
 *
 * @example
 * formatSiret('73282932000074') // '732 829 320 00074'
 */
export function formatSiret(siret: string): string {
  const cleanSiret = siret.replace(/\s/g, '');

  if (cleanSiret.length !== 14) {
    return siret;
  }

  return `${cleanSiret.substring(0, 3)} ${cleanSiret.substring(3, 6)} ${cleanSiret.substring(6, 9)} ${cleanSiret.substring(9, 14)}`;
}
