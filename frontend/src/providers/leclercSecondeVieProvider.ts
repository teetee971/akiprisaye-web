import { createLeclercCategoryProvider } from './createLeclercCategoryProvider';

export const leclercSecondeVieProvider = createLeclercCategoryProvider({
  source: 'leclerc_secondevie',
  apiEndpoint: '/api/leclerc-secondevie',
  envFlag: 'VITE_PRICE_PROVIDER_LECLERC_SECONDEVIE',
  unavailableMsg: 'Catalogue Seconde Vie E.Leclerc indisponible.',
});
