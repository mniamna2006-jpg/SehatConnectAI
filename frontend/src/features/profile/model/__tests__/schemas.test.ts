import { createProfileUpdateSchema } from '../schemas';

const t = (key: string) => key;
const schema = createProfileUpdateSchema(t);

test('accepts a valid partial profile update', () => {
  expect(schema.safeParse({ full_name: 'Ayesha Khan', phone: '03001234567' }).success).toBe(true);
  expect(schema.safeParse({}).success).toBe(true);
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
