import type { Connector } from './types';

export const openDataDummyConnector: Connector = {
  id: 'open_data_dummy',
  name: 'Open Data Dummy Connector',
  type: 'open_data',
  enabledByDefault: true,
  supportsTerritory: () => true,
  async fetchPrices() {
    // TODO: implement authorized open-data source integration.
    return [];
  },
};
