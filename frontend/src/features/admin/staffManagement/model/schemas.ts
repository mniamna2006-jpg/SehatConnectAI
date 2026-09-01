import { z } from 'zod';

export const staffCreateSchema = z
  .object({
    full_name: z.string().min(2),
    employee_id: z.string().min(1),
    position: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(7).optional().or(z.literal('')),
    password: z.string().min(6),
    department_id: z.string().optional(),
  })
  .refine((v) => !!v.email || !!v.phone, { message: 'Email or phone is required', path: ['email'] });

export const staffUpdateSchema = z.object({
  full_name: z.string().min(2),
  employee_id: z.string().min(1),
  position: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(7).optional().or(z.literal('')),
  department_id: z.string().optional(),
});
