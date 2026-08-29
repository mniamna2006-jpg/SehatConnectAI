import { z } from 'zod';

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().min(7).optional(),
  preferred_language: z.enum(['ENGLISH', 'URDU', 'ROMAN_URDU']).optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  emergency_contact: z.string().optional(),
});
