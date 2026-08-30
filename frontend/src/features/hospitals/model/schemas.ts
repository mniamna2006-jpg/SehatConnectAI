import { z } from 'zod';

export const citySearchSchema = z.object({
  city: z.string().min(1, 'Enter a city'),
});
