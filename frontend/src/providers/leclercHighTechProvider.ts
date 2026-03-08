import { createLeclercCategoryProvider } from './createLeclercCategoryProvider';

export const leclercHighTechProvider = createLeclercCategoryProvider({
  source: 'leclerc_hightech',
  apiEndpoint: '/api/leclerc-hightech',
  envFlag: 'VITE_PRICE_PROVIDER_LECLERC_HIGHTECH',
  unavailableMsg: 'Catalogue High-Tech E.Leclerc indisponible.',
});
