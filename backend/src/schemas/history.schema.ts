import { z } from 'zod';

export const historyQuerySchema = z.object({
  territory: z.string().min(2).default('GP'),
  range: z.enum(['7d', '30d']).default('7d'),
});
