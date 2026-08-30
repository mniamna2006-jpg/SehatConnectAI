import { loginSchema, registerSchema } from '../schemas';

test('loginSchema requires password and either email or phone', () => {
  expect(loginSchema.safeParse({ email: 'a@b.com', password: 'secret1' }).success).toBe(true);
  expect(loginSchema.safeParse({ password: 'secret1' }).success).toBe(false);
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
