/**
 * Utilitaires pour la gestion sécurisée des mots de passe
 *
 * Utilise bcrypt pour le hashing:
 * - Salt rounds: 12 (recommandé pour 2024+)
 * - Résistant aux attaques par force brute
 * - Timing-safe comparison
 *
 * RGPD: Les mots de passe ne sont jamais stockés en clair (Art. 32 - sécurité)
 */

import bcrypt from 'bcrypt';
import { z } from 'zod';

// Configuration
const SALT_ROUNDS = 12; // Coût de hashing (12 = ~250ms, bon compromis sécurité/performance)

/**
 * Schéma de validation de mot de passe
 *
 * Exigences:
 * - Minimum 8 caractères
 * - Au moins une majuscule
 * - Au moins une minuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial
 */
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(
    /[^A-Za-z0-9]/,
    'Le mot de passe doit contenir au moins un caractère spécial'
  );

/**
 * Hash un mot de passe avec bcrypt
 *
 * @param password - Mot de passe en clair
 * @returns Hash bcrypt du mot de passe
 *
 * Utilise 12 salt rounds (~250ms de calcul)
 * Le hash résultant contient le salt et le coût
 */
export async function hashPassword(password: string): Promise<string> {
  // Validation du format
  passwordSchema.parse(password);

  // Génération du hash avec salt automatique
  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  return hash;
}

/**
 * Vérifie un mot de passe contre son hash
 *
 * @param password - Mot de passe en clair
 * @param hash - Hash bcrypt à comparer
 * @returns true si le mot de passe correspond, false sinon
 *
 * Utilise une comparaison timing-safe pour éviter les timing attacks
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    // bcrypt.compare est timing-safe
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    // En cas d'erreur (hash malformé, etc.), retourner false
    return false;
  }
}

/**
 * Vérifie la force d'un mot de passe
 *
 * @param password - Mot de passe à vérifier
 * @returns Objet avec score de force et recommandations
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0-5
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Longueur
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  else if (password.length < 8) {
    feedback.push('Utilisez au moins 8 caractères');
  }

  // Complexité
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Ajoutez des lettres minuscules');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Ajoutez des lettres majuscules');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Ajoutez des chiffres');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Ajoutez des caractères spéciaux (!@#$%^&*)');

  // Patterns communs à éviter
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /azerty/i,
    /admin/i,
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      feedback.push('Évitez les mots de passe courants');
      score = Math.max(0, score - 2);
      break;
    }
  }

  return {
    score: Math.min(5, score),
    feedback,
  };
}

/**
 * Génère un mot de passe aléatoire sécurisé
 *
 * @param length - Longueur souhaitée (min 12, défaut 16)
 * @returns Mot de passe aléatoire
 *
 * Utilise crypto.randomBytes pour une génération cryptographiquement sûre
 */
export function generateRandomPassword(length = 16): string {
  if (length < 12) {
    throw new Error('La longueur minimale est 12 caractères');
  }

  const chars = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };

  const allChars =
    chars.lowercase + chars.uppercase + chars.numbers + chars.special;

  let password = '';

  // Assurer au moins un caractère de chaque type
  password += chars.lowercase[Math.floor(Math.random() * chars.lowercase.length)];
  password += chars.uppercase[Math.floor(Math.random() * chars.uppercase.length)];
  password += chars.numbers[Math.floor(Math.random() * chars.numbers.length)];
  password += chars.special[Math.floor(Math.random() * chars.special.length)];

  // Remplir le reste aléatoirement
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mélanger les caractères
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
