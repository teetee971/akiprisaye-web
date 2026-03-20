import { z } from 'zod';

export const compareQuerySchema = z.object({
  query: z.string().min(1),
  territory: z.string().min(2),
  retailer: z.string().optional(),
});
