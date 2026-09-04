import { createProfileUpdateSchema } from '../schemas';

const t = (key: string) => key;
const schema = createProfileUpdateSchema(t);

test('accepts a valid partial profile update', () => {
  expect(schema.safeParse({ full_name: 'Ayesha Khan', phone: '03001234567' }).success).toBe(true);
  expect(schema.safeParse({}).success).toBe(true);
});

test('accepts a real past date of birth and an empty string, rejects impossible or future dates', () => {
  expect(schema.safeParse({ date_of_birth: '1995-08-14' }).success).toBe(true);
  expect(schema.safeParse({ date_of_birth: '' }).success).toBe(true);

  const impossible = schema.safeParse({ date_of_birth: '2026-99-99' });
  expect(impossible.success).toBe(false);
  if (!impossible.success) expect(impossible.error.issues[0].message).toBe('auth.validation.dateOfBirth');

  const future = schema.safeParse({ date_of_birth: '2999-01-01' });
  expect(future.success).toBe(false);
  if (!future.success) expect(future.error.issues[0].message).toBe('auth.validation.dateOfBirth');

  const impossibleCalendarDate = schema.safeParse({ date_of_birth: '2023-02-30' });
  expect(impossibleCalendarDate.success).toBe(false);
});

test('never leaks a raw Zod default message for name, phone, or language', () => {
  const result = schema.safeParse({ full_name: 'A', phone: '123', preferred_language: 'FRENCH' });
  expect(result.success).toBe(false);
  const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
  expect(messages).toEqual(
    expect.arrayContaining(['auth.validation.fullName', 'auth.validation.phone', 'auth.validation.language'])
  );
  expect(messages.some((m) => /string|character|invalid|enum/i.test(m))).toBe(false);
});
