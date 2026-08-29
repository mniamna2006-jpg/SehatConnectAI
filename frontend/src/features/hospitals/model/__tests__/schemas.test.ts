import { citySearchSchema } from '../schemas';

test('citySearchSchema requires a non-empty city', () => {
  expect(citySearchSchema.safeParse({ city: '' }).success).toBe(false);
  expect(citySearchSchema.safeParse({ city: 'Karachi' }).success).toBe(true);
});
