import { scheduleSchema, timeSlotGenerationSchema } from '../schemas';

test('accepts the backend schedule day, time, and duration shape', () => {
  expect(scheduleSchema.safeParse({
    day_of_week: 'MONDAY',
    start_time: '09:00',
    end_time: '12:00',
    appointment_duration: '30',
  }).success).toBe(true);
});

test.each([
  { day_of_week: 'FUNDAY', start_time: '09:00', end_time: '12:00', appointment_duration: '30' },
  { day_of_week: 'MONDAY', start_time: '9am', end_time: '12:00', appointment_duration: '30' },
  { day_of_week: 'MONDAY', start_time: '12:00', end_time: '09:00', appointment_duration: '30' },
  { day_of_week: 'MONDAY', start_time: '09:00', end_time: '12:00', appointment_duration: '0' },
  { day_of_week: 'MONDAY', start_time: '09:00', end_time: '10:00', appointment_duration: '90' },
])('rejects an unsupported or unusable schedule: %j', (values) => {
  expect(scheduleSchema.safeParse(values).success).toBe(false);
});

test('accepts a real calendar date and rejects an impossible date', () => {
  expect(timeSlotGenerationSchema.safeParse({ date: '2026-09-07' }).success).toBe(true);
  expect(timeSlotGenerationSchema.safeParse({ date: '2026-02-30' }).success).toBe(false);
});
