import { demoLogin, demoRegister, demoGetMe } from '../demoAdapter';
import { ApiError } from '../../../../core/api/client';

test('demoLogin resolves for the documented demo credentials', async () => {
  const result = await demoLogin({ email: 'demo@sehatconnect.test', password: 'Demo123!' });
  expect(result.token).toBeTruthy();
  expect(result.user.email).toBe('demo@sehatconnect.test');
});

test('demoLogin rejects any other credentials, even a real-looking email', async () => {
  await expect(demoLogin({ email: 'someone@real.com', password: 'wrong' })).rejects.toBeInstanceOf(ApiError);
  await expect(demoLogin({ email: 'demo@sehatconnect.test', password: 'wrong' })).rejects.toBeInstanceOf(ApiError);
});

test('demoRegister simulates account creation using the submitted profile fields', async () => {
  const result = await demoRegister({
    full_name: 'Test User',
    email: 'test@example.com',
    password: 'secret1',
    preferred_language: 'URDU',
  });
  expect(result.user.full_name).toBe('Test User');
  expect(result.user.email).toBe('test@example.com');
  expect(result.user.preferred_language).toBe('URDU');
});

test('demoGetMe returns the fixed demo user', async () => {
  const user = await demoGetMe();
  expect(user.role).toBe('PATIENT');
});
