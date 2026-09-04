import { createLoginSchema, createRegisterSchema } from '../schemas';

const t = (key: string) => key;
const loginSchema = createLoginSchema(t);
const registerSchema = createRegisterSchema(t);

test('loginSchema requires password and either email or phone', () => {
  expect(loginSchema.safeParse({ email: 'a@b.com', password: 'secret1' }).success).toBe(true);
  expect(loginSchema.safeParse({ password: 'secret1' }).success).toBe(false);
});

test('loginSchema never leaks a raw Zod default message', () => {
  const result = loginSchema.safeParse({ email: 'not-an-email', password: '123' });
  expect(result.success).toBe(false);
  const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
  expect(messages).toContain('auth.validation.email');
  expect(messages).toContain('auth.validation.password');
  expect(messages.some((m) => /string|character|invalid/i.test(m))).toBe(false);
});

test('registerSchema rejects mismatched confirmPassword', () => {
  const base = {
    full_name: 'Ayesha Khan',
    email: 'ayesha@example.com',
    password: 'secret12',
    confirmPassword: 'different',
    preferred_language: 'ENGLISH' as const,
  };
  expect(registerSchema.safeParse(base).success).toBe(false);
  expect(registerSchema.safeParse({ ...base, confirmPassword: 'secret12' }).success).toBe(true);
});

test('registerSchema never leaks a raw Zod default message across every validator', () => {
  const result = registerSchema.safeParse({
    full_name: 'A',
    email: 'not-an-email',
    password: '1',
    confirmPassword: '2',
    preferred_language: 'FRENCH',
  });
  expect(result.success).toBe(false);
  const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
  expect(messages).toEqual(
    expect.arrayContaining([
      'auth.validation.fullName',
      'auth.validation.email',
      'auth.validation.password',
      'auth.validation.language',
    ])
  );
  expect(messages.some((m) => /string|character|invalid|enum/i.test(m))).toBe(false);
});

test('registerSchema requires an email or phone with a localized message', () => {
  const result = registerSchema.safeParse({
    full_name: 'Ayesha Khan',
    password: 'secret12',
    confirmPassword: 'secret12',
    preferred_language: 'ENGLISH',
  });
  expect(result.success).toBe(false);
  const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
  expect(messages).toContain('auth.validation.contactRequired');
});
