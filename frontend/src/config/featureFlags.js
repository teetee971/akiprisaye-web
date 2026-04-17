// Feature flags pour activer/désactiver des comportements sans redeploiement complexe.
// Utilisation: import { FEATURE_FUZZY_SEARCH, FEATURE_TRENDING } from 'src/config/featureFlags';
function toBool(val, fallback) {
  if (val === undefined || val === null) return fallback;
  const s = String(val).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off'].includes(s)) return false;
  return fallback;
}

export const FEATURE_FUZZY_SEARCH = toBool(import.meta.env.VITE_FEATURE_FUZZY_SEARCH, true);
export const FEATURE_TRENDING = toBool(import.meta.env.VITE_FEATURE_TRENDING, false);
export const FEATURE_PRICE_COMPARISON = toBool(
  import.meta.env.VITE_FEATURE_PRICE_COMPARISON,
  false
);
export const FEATURE_PRODUCT_INSIGHT = toBool(import.meta.env.VITE_FEATURE_PRODUCT_INSIGHT, false);
export const FEATURE_PRODUCT_DOSSIER = toBool(import.meta.env.VITE_FEATURE_PRODUCT_DOSSIER, false);
export const FEATURE_INGREDIENT_EVOLUTION = toBool(
  import.meta.env.VITE_FEATURE_INGREDIENT_EVOLUTION,
  false
);
export const FEATURE_OPEN_DATA_EXPORT = toBool(
  import.meta.env.VITE_FEATURE_OPEN_DATA_EXPORT,
  false
);
export const FEATURE_PRODUCT_HISTORY = toBool(import.meta.env.VITE_FEATURE_PRODUCT_HISTORY, false);
export const FEATURE_COST_OF_LIVING = toBool(import.meta.env.VITE_FEATURE_COST_OF_LIVING, false);
