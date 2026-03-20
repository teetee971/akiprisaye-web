import { z } from 'zod';

export const productsQuerySchema = z.object({
  q: z.string().min(1),
});
