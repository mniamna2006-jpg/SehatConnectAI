import { z } from 'zod';

export const hospitalProfileSchema = z.object({
  name: z.string().min(2),
  facility_type: z.enum(['HOSPITAL', 'CLINIC', 'MEDICAL_CENTER']),
  description: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  cover_image_url: z.string().url().optional().or(z.literal('')),
  theme: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(2),
  city: z.string().min(2),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

export type HospitalProfileFormInput = z.input<typeof hospitalProfileSchema>;
