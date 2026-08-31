import { login, registerPatient, getMe } from '../api';
import { apiRequest } from '../../../../core/api/client';

jest.mock('../../../../core/api/client');

beforeEach(() => {
  jest.clearAllMocks();
});

test('login posts credentials without auth header and returns AuthResult', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ token: 't', user: { user_id: '1' } });
  const result = await login({ email: 'a@b.com', password: 'secret1' });
  expect(apiRequest).toHaveBeenCalledWith('/api/auth/login', {
    method: 'POST',
    body: { email: 'a@b.com', password: 'secret1' },
    auth: false,
  });
  expect(result.token).toBe('t');
});

test('registerPatient posts to /api/auth/register/patient without auth header', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ token: 't', user: { user_id: '1' } });
  await registerPatient({
    full_name: 'A', email: 'a@b.com', password: 'secret1', preferred_language: 'ENGLISH',
  });
  expect(apiRequest).toHaveBeenCalledWith('/api/auth/register/patient', expect.objectContaining({
    method: 'POST', auth: false,
  }));
});

test('getMe calls GET /api/auth/me with auth', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ user_id: '1' });
  await getMe();
  expect(apiRequest).toHaveBeenCalledWith('/api/auth/me');
});

test('a login API failure rejects', async () => {
  (apiRequest as jest.Mock).mockRejectedValue(new Error('network down'));

  await expect(login({ email: 'a@b.com', password: 'secret1' })).rejects.toThrow('network down');
});
