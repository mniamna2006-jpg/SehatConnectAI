import { requestPasswordReset } from '../forgotPasswordAdapter';

test('always resolves with a generic message, never reveals whether the account exists', async () => {
  const result = await requestPasswordReset('someone@example.com');
  expect(result.message).toBe('If an account exists for that email or phone, reset instructions have been sent.');
});
