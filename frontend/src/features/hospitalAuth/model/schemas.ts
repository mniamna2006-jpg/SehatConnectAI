import { z } from 'zod';

export const hospitalLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
