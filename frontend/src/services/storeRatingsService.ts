/**
 * storeRatingsService — persistance locale des évaluations de magasins
 *
 * Les avis soumis par les utilisateurs sont stockés dans localStorage
 * sous la clé `akiprisaye-store-ratings-v1`, conformément au pattern
 * utilisé dans le reste de l'application (localStore.ts, priceAlertsStorage.ts).
 */

export interface UserStoreRating {
  /** Identifiant unique de l'avis (timestamp + random) */
  id: string;
  /** Nom du magasin tel que saisi par l'utilisateur */
  storeName: string;
  /** Territoire sélectionné */
  territory: string;
  /** Secteur d'activité */
  sector: string;
  /** Emoji du secteur */
  sectorEmoji: string;
  /** Classes Tailwind pour la badge secteur */
  sectorColor: string;
  /** Notes sur 5 */
  ratings: { service: number; proprete: number; disponibilite: number };
  /** Commentaire libre (optionnel) */
  comment: string;
  /** Date ISO de l'avis */
  submittedAt: string;
}

const STORAGE_KEY = 'akiprisaye-store-ratings-v1';

function readRatings(): UserStoreRating[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UserStoreRating[];
  } catch {
    return [];
  }
}

function writeRatings(ratings: UserStoreRating[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  } catch {
    // quota dépassé — on ignore silencieusement
  }
}

/** Récupère tous les avis soumis localement, du plus récent au plus ancien */
export function getUserRatings(): UserStoreRating[] {
  return readRatings().sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

/** Sauvegarde un nouvel avis */
export function saveUserRating(
  rating: Omit<UserStoreRating, 'id' | 'submittedAt'>
): UserStoreRating {
  const saved: UserStoreRating = {
    ...rating,
    id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    submittedAt: new Date().toISOString(),
  };
  const existing = readRatings();
  writeRatings([saved, ...existing]);
  return saved;
}

/** Supprime un avis utilisateur par son id */
export function deleteUserRating(id: string): void {
  const existing = readRatings().filter((r) => r.id !== id);
  writeRatings(existing);
}

/** Calcule la note moyenne d'un avis */
export function avgRatingFrom(r: {
  service: number;
  proprete: number;
  disponibilite: number;
}): number {
  return Math.round(((r.service + r.proprete + r.disponibilite) / 3) * 10) / 10;
}
