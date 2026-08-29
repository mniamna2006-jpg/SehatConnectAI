import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2),
    email: z.string().email().optional(),
    phone: z.string().min(7).optional(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    preferred_language: z.enum(['ENGLISH', 'URDU', 'ROMAN_URDU']),
  })
  .refine((v) => !!v.email || !!v.phone, { message: 'Email or phone is required', path: ['email'] })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
