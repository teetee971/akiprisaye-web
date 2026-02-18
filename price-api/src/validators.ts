import { z } from 'zod';
import { RETAILERS, TERRITORIES, type Territory } from './types';

export const EAN_REGEX = /^\d{8,14}$/;
const SHA256_REGEX = /^[a-fA-F0-9]{64}$/;

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
  source: z.enum(['admin', 'admin_seed', 'partner', 'receipt', 'receipt_user']).default('admin'),
  confidence: z.number().min(0).max(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const receiptInitSchema = z.object({
  territory: territoryEnum,
  sourceType: z.enum(['receipt', 'invoice', 'quote']),
  imagesCount: z.number().int().min(1).max(6),
});

export const receiptCompleteSchema = z.object({
  jobId: z.string().min(1).max(128),
  images: z.array(z.object({
    imageId: z.string().min(1).max(128),
    sha256: z.string().regex(SHA256_REGEX, 'sha256 must be a 64 chars hex string'),
    width: z.number().int().positive().max(20000).optional(),
    height: z.number().int().positive().max(20000).optional(),
  })).min(1).max(6),
});

export const receiptConfirmSchema = z.object({
  items: z.array(z.object({
    lineIndex: z.number().int().min(0),
    productLabel: z.string().min(1).max(512),
    quantity: z.number().positive().optional(),
    unitPrice: z.number().nonnegative().optional(),
    lineTotal: z.number().nonnegative().optional(),
    ean: z.string().regex(EAN_REGEX).optional(),
    brand: z.string().min(1).max(255).optional(),
    category: z.string().min(1).max(128).optional(),
    confidence: z.number().min(0).max(1).optional(),
  })).max(200),
  totals: z.object({
    total: z.number().nonnegative().optional(),
    tax: z.number().nonnegative().optional(),
    subtotal: z.number().nonnegative().optional(),
  }).optional(),
});

export function assertAdminToken(request: Request, expectedToken: string): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  return authHeader.slice('Bearer '.length) === expectedToken;
}

export function assertUserIngestToken(request: Request, expectedToken?: string): boolean {
  if (!expectedToken) {
    return false;
  }

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
