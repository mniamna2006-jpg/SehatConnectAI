import { z } from 'zod';

export const bookingSchema = z.object({
  doctor_id: z.string().min(1),
  hospital_id: z.string().min(1),
  department_id: z.string().min(1),
  slot_id: z.string().min(1),
  reason: z.string().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
