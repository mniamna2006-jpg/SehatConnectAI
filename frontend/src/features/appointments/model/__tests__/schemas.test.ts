import { createBookingSchema } from '../schemas';

const t = (key: string) => key;
const bookingSchema = createBookingSchema(t);

test('bookingSchema requires doctor, hospital, department, and slot ids', () => {
  const valid = {
    doctor_id: 'd1',
    hospital_id: 'h1',
    department_id: 'dep1',
    slot_id: 's1',
  };

  expect(bookingSchema.safeParse(valid).success).toBe(true);
  expect(bookingSchema.safeParse({ ...valid, doctor_id: undefined }).success).toBe(false);
});

test('bookingSchema reports localized keys instead of raw zod text for missing selections', () => {
  const valid = {
    doctor_id: 'd1',
    hospital_id: 'h1',
    department_id: 'dep1',
    slot_id: 's1',
  };

  const result = bookingSchema.safeParse({ ...valid, doctor_id: '', slot_id: '' });

  expect(result.success).toBe(false);
  const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
  expect(messages).toEqual(['appointments.booking.validation.doctor', 'appointments.booking.validation.slot']);
  expect(messages.join(' ')).not.toMatch(/too small|expected string/i);
});
