import { z } from 'zod';

export const bookingSchema = z.object({
  doctor_id: z.string().min(1, 'Choose a doctor'),
  hospital_id: z.string().min(1, 'Choose a hospital'),
  department_id: z.string().min(1, 'Choose a department'),
  slot_id: z.string().min(1, 'Choose a time slot'),
  reason: z.string().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
