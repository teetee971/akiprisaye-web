import { createLeclercCategoryProvider } from './createLeclercCategoryProvider';

export const leclercElectromenagerProvider = createLeclercCategoryProvider({
  source: 'leclerc_electromenager',
  apiEndpoint: '/api/leclerc-electromenager',
  envFlag: 'VITE_PRICE_PROVIDER_LECLERC_ELECTROMENAGER',
  unavailableMsg: 'Catalogue Électroménager E.Leclerc indisponible.',
});
