import type { Territory } from '../types';
import { backofficeConnector } from './backoffice';
import { openDataDummyConnector } from './open_data_dummy';
import type { Connector } from './types';

const connectors: Connector[] = [backofficeConnector, openDataDummyConnector];

export function getConnectorById(id: string): Connector | null {
  return connectors.find((connector) => connector.id === id) ?? null;
}

export function getEnabledConnectorsForTerritory(territory: Territory): Connector[] {
  return connectors.filter((connector) => connector.enabledByDefault && connector.supportsTerritory(territory));
}

export function listConnectors(): Connector[] {
  return connectors;
}
