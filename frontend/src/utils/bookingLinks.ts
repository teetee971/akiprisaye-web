/**
 * bookingLinks.ts
 *
 * Utilitaire de construction des URLs de réservation.
 *
 * Principe « Observer, pas vendre » :
 *   - Les liens vont toujours vers le site officiel de l'opérateur.
 *   - Des paramètres UTM standards sont ajoutés pour le suivi analytique
 *     interne (aucune donnée transmise à des tiers, aucune commission cachée).
 *   - Le paramètre `ref` permet, le moment venu, d'activer un programme
 *     d'affiliation sans modifier le comportement visible pour l'utilisateur.
 *
 * Statut commissions par clic : ACTIVÉES.
 */

/** Configuration globale — modifier ici pour activer l'affiliation */
export const BOOKING_CONFIG = {
  /** Suivi analytique interne via paramètres UTM (toujours actif) */
  utmEnabled: true,
  /** Source UTM — identifie le site dans Google Analytics / Plausible */
  utmSource: 'akiprisaye',
  /** Support de l'affiliation (activé — commission possible) */
  affiliateEnabled: true,
  /** Code de partenariat à injecter quand affiliateEnabled === true */
  affiliateRef: 'akiprisaye',
} as const;

export type BookingCampaign =
  | 'comparateur-vols'
  | 'comparateur-bateaux'
  | 'comparateur-voiture'
  | 'comparateur-carburants'
  | 'comparateur-assurances'
  | 'comparateur-internet'
  | 'comparateur-mobile'
  | 'comparateur-fret'
  | 'recherche-prix'
  | 'comparateur-prix';

/**
 * Construit l'URL de réservation finale.
 *
 * @param baseUrl   URL de base de l'opérateur (peut déjà contenir des params)
 * @param campaign  Nom de la campagne UTM (identifie le comparateur d'origine)
 * @param medium    Support UTM (défaut : "comparateur")
 * @returns URL enrichie, prête à être utilisée dans un <a href>
 *
 * @example
 * buildBookingUrl('https://www.airfrance.fr/...', 'comparateur-vols')
 * // → 'https://www.airfrance.fr/...?utm_source=akiprisaye&utm_medium=comparateur&utm_campaign=comparateur-vols'
 */
export function buildBookingUrl(
  baseUrl: string,
  campaign: BookingCampaign,
  medium = 'comparateur'
): string {
  // Liens vides ou invalides passés tels quels
  if (!baseUrl || baseUrl === '#') return baseUrl;

  try {
    const url = new URL(baseUrl);

    if (BOOKING_CONFIG.utmEnabled) {
      url.searchParams.set('utm_source', BOOKING_CONFIG.utmSource);
      url.searchParams.set('utm_medium', medium);
      url.searchParams.set('utm_campaign', campaign);
    }

    if (BOOKING_CONFIG.affiliateEnabled && BOOKING_CONFIG.affiliateRef) {
      url.searchParams.set('ref', BOOKING_CONFIG.affiliateRef);
    }

    return url.toString();
  } catch {
    // URL relative ou non parseable — on la retourne sans modification
    return baseUrl;
  }
}

/**
 * Retourne un objet décrivant l'état actuel des commissions.
 * Utilisé par BookingLinkBadge pour afficher le bon libellé.
 */
export function getCommissionStatus(): {
  active: boolean;
  label: string;
  detail: string;
  color: 'green' | 'yellow' | 'red';
} {
  if (BOOKING_CONFIG.affiliateEnabled && BOOKING_CONFIG.affiliateRef) {
    return {
      active: true,
      label: 'Lien partenaire',
      detail:
        "Lien vers le site officiel de l'opérateur. Il s'agit d'un lien partenaire : si vous réservez après avoir cliqué dessus, le site peut percevoir une commission, sans surcoût pour vous, avec un suivi technique du parcours.",
      color: 'yellow',
    };
  }
  return {
    active: false,
    label: 'Lien direct',
    detail: "Lien direct vers le site officiel de l'opérateur.",
    color: 'green',
  };
}
