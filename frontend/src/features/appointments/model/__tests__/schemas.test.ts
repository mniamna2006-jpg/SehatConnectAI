import { bookingSchema } from '../schemas';

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
