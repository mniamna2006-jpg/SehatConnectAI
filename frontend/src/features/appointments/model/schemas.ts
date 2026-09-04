import { z } from 'zod';

type T = (key: string) => string;

export function createBookingSchema(t: T) {
  return z.object({
    doctor_id: z.string().min(1, t('appointments.booking.validation.doctor')),
    hospital_id: z.string().min(1, t('appointments.booking.validation.hospital')),
    department_id: z.string().min(1, t('appointments.booking.validation.department')),
    slot_id: z.string().min(1, t('appointments.booking.validation.slot')),
    reason: z.string().optional(),
  });
}

export type BookingInput = z.infer<ReturnType<typeof createBookingSchema>>;
