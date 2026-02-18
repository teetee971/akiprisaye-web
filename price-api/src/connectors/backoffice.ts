import type { Connector } from './types';

export const backofficeConnector: Connector = {
  id: 'backoffice',
  name: 'Backoffice Placeholder Connector',
  type: 'backoffice',
  enabledByDefault: true,
  supportsTerritory: () => true,
  async fetchPrices() {
    return [];
  },
};
