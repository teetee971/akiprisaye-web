/**
 * Internal provider
 *
 * Returns price observations sourced from the internal database.
 * Currently a stub; wire to the DB when the price-observation schema
 * is finalised.
 */

/** A price observation row returned by the internal provider. */
export interface InternalObservation {
  retailer: string;
  territory: string;
  price: number;
  currency: 'EUR';
  observedAt: string;
  source: 'internal';
}

/** Fetch internal observations for a product query in a territory. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function internalProvider(
  _query: string,
  _territory: string,
): Promise<InternalObservation[]> {
  // TODO: wire real DB query (e.g. Prisma select on price_observation table)
  return [];
}
