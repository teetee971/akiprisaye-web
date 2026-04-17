import { z } from 'zod';

export const receiptItemSchema = z.object({
  name: z.string().trim().min(1),
  price: z.number().finite().nonnegative(),
  quantity: z.number().finite().positive(),
  unit_price: z.number().finite().nonnegative().optional(),
  unit_measure: z.string().trim().min(1).optional(),
});

export const receiptSchema = z.object({
  store: z.object({
    name: z.string().trim().min(1),
    address: z.string().trim().min(1),
    territory: z.string().trim().min(1).optional(),
    siret: z.string().trim().min(1).optional(),
  }),
  transaction: z.object({
    date: z.union([
      z.string().datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Format attendu: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ssZ',
      }),
    ]),
    ticket_id: z.string().trim().min(1),
    total_amount: z.number().finite().nonnegative(),
  }),
  items: z.array(receiptItemSchema).min(1),
});

export type ReceiptPayload = z.infer<typeof receiptSchema>;

export const catalogProductSchema = z.object({
  category: z.string().trim().min(1),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  price: z.number().finite().nonnegative(),
  unit_price_text: z.string().trim().min(1),
  origin: z.string().trim().min(1),
});

export const catalogSchema = z.object({
  campaign: z.object({
    name: z.string().trim().min(1),
    retailers: z.array(z.string().trim().min(1)).min(1),
    validity_start: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format, expected YYYY-MM-DD' }),
    validity_end: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format, expected YYYY-MM-DD' }),
    territory: z.string().trim().min(1),
  }),
  stores_applicable: z.array(z.string().trim().min(1)).min(1),
  products: z.array(catalogProductSchema).min(1),
});

export type CatalogPayload = z.infer<typeof catalogSchema>;

export function zodErrorToMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Données invalides.';
  const path = issue.path.length ? issue.path.join('.') : 'payload';
  return `${path}: ${issue.message}`;
}

export function makeDeterministicId(input: string): string {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
  }
  const normalized = Math.abs(hash).toString(36);
  return normalized.slice(0, 20);
}
