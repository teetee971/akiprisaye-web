/**
 * Modération de texte pour les Groupes de Parole Citoyens.
 * Pure function — pas de dépendances externes.
 */

const BLOCKED_PATTERNS: RegExp[] = [
  /\b(haine|nazi|fascis[mt]e?)\b/,
  /\b(nique|encule|putain|connard|salope|merde)\b/,
  /\b(suicide|se tuer|se pendre)\b/,
  /\b(spam|achetez|promo|click|http[s]?:\/\/(?!akiprisaye))\b/,
  /\b(viol|pedophil|pédophil)\b/,
];

/**
 * Basic AI moderation: keyword filter for French inappropriate content.
 * Returns a flag reason if the text is problematic, null otherwise.
 */
export function moderateText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(lower)) {
      return 'Contenu potentiellement inapproprié détecté automatiquement.';
    }
  }
  return null;
}
