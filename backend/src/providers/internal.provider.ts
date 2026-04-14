/**
 * Internal provider
 *
 * Returns price observations sourced from the internal database.
 * Queries the PriceObservation table via Prisma.
 */

import prisma from '../database/prisma.js';

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
export async function internalProvider(
  query: string,
  territory: string,
): Promise<InternalObservation[]> {
  const rows = await prisma.priceObservation.findMany({
    where: {
      territory: territory.toLowerCase(),
      OR: [
        { productLabel: { contains: query, mode: 'insensitive' } },
        { normalizedLabel: { contains: query, mode: 'insensitive' } },
        { barcode: query },
      ],
    },
    orderBy: { observedAt: 'desc' },
    take: 100,
    select: {
      storeLabel: true,
      territory: true,
      price: true,
      currency: true,
      observedAt: true,
    },
  });

  return rows.map((row) => ({
    retailer: row.storeLabel,
    territory: row.territory,
    price: row.price,
    currency: (row.currency ?? 'EUR') as 'EUR',
    observedAt: row.observedAt.toISOString(),
    source: 'internal' as const,
  }));
}
