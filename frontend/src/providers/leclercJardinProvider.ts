import { createLeclercCategoryProvider } from './createLeclercCategoryProvider';

export const leclercJardinProvider = createLeclercCategoryProvider({
  source: 'leclerc_jardin',
  apiEndpoint: '/api/leclerc-jardin',
  envFlag: 'VITE_PRICE_PROVIDER_LECLERC_JARDIN',
  unavailableMsg: 'Catalogue Jardin E.Leclerc indisponible.',
});
