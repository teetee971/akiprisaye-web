import { createLeclercCategoryProvider } from './createLeclercCategoryProvider';

export const leclercParapharmacieProvider = createLeclercCategoryProvider({
  source: 'leclerc_parapharmacie',
  apiEndpoint: '/api/leclerc-parapharmacie',
  envFlag: 'VITE_PRICE_PROVIDER_LECLERC_PARAPHARMACIE',
  unavailableMsg: 'Catalogue Parapharmacie E.Leclerc indisponible.',
});
