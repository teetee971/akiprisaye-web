import { z } from 'zod';
import { RETAILERS, TERRITORIES, type Territory } from './types';

export const EAN_REGEX = /^\d{8,14}$/;

const territoryEnum = z.enum(TERRITORIES);
const currencyEnum = z.literal('EUR');

const retailerSchema = z
  .string()
  .min(2)
  .max(64)
  .transform((value) => value.trim().toLowerCase());

const isoDateSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime())
  .transform((value) => new Date(value).toISOString());

export const getPricesQuerySchema = z.object({
  ean: z.string().regex(EAN_REGEX, 'ean must have 8-14 digits'),
  territory: territoryEnum.optional(),
  retailer: retailerSchema.optional(),
});

export const getProductParamsSchema = z.object({
  ean: z.string().regex(EAN_REGEX, 'ean must have 8-14 digits'),
});

export const adminProductSchema = z.object({
  ean: z.string().regex(EAN_REGEX, 'ean must have 8-14 digits'),
  productName: z.string().min(1).max(255),
  brand: z.string().min(1).max(255).optional(),
  quantity: z.string().min(1).max(128).optional(),
  ingredientsText: z.string().min(1).max(5000).optional(),
});

export const adminObservationSchema = z.object({
  ean: z.string().regex(EAN_REGEX, 'ean must have 8-14 digits'),
  territory: territoryEnum,
  retailer: retailerSchema,
  price: z.number().positive(),
  currency: currencyEnum.default('EUR'),
  unit: z.string().min(1).max(32).optional(),
  observedAt: isoDateSchema.optional(),
  storeId: z.string().min(1).max(128).optional(),
  storeName: z.string().min(1).max(255).optional(),
  source: z.enum(['admin', 'admin_seed', 'partner', 'receipt']).default('admin'),
  confidence: z.number().min(0).max(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export function assertAdminToken(request: Request, expectedToken: string): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  return authHeader.slice('Bearer '.length) === expectedToken;
}

export function validateRetailer(retailer: string): string {
  const normalized = retailer.trim().toLowerCase();
  if (RETAILERS.includes(normalized as (typeof RETAILERS)[number])) {
    return normalized;
  }

  return normalized;
}

export function validateTerritory(territory: string): Territory {
  const parsed = territoryEnum.safeParse(territory);
  if (!parsed.success) {
    throw new Error('invalid territory');
  }

  return parsed.data;
}
