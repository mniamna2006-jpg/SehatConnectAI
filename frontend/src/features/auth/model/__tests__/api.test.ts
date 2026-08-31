import { login, registerPatient, getMe } from '../api';
import { apiRequest } from '../../../../core/api/client';
import * as demoAdapter from '../demoAdapter';

jest.mock('../../../../core/api/client');
jest.mock('../demoAdapter');

const ORIGINAL_DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE;

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.EXPO_PUBLIC_DEMO_MODE;
});

afterEach(() => {
  process.env.EXPO_PUBLIC_DEMO_MODE = ORIGINAL_DEMO_MODE;
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

test('demo mode routes login/register/getMe to the demo adapter, never the real API', async () => {
  process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
  (demoAdapter.demoLogin as jest.Mock).mockResolvedValue({ token: 'demo', user: { user_id: 'demo' } });
  (demoAdapter.demoRegister as jest.Mock).mockResolvedValue({ token: 'demo', user: { user_id: 'demo' } });
  (demoAdapter.demoGetMe as jest.Mock).mockResolvedValue({ user_id: 'demo' });

  await login({ email: 'demo@sehatconnect.test', password: 'Demo123!' });
  await registerPatient({ full_name: 'A', email: 'a@b.com', password: 'secret1', preferred_language: 'ENGLISH' });
  await getMe();

  expect(demoAdapter.demoLogin).toHaveBeenCalled();
  expect(demoAdapter.demoRegister).toHaveBeenCalled();
  expect(demoAdapter.demoGetMe).toHaveBeenCalled();
  expect(apiRequest).not.toHaveBeenCalled();
});

test('real mode (demo mode unset) still calls the real API, never the demo adapter', async () => {
  delete process.env.EXPO_PUBLIC_DEMO_MODE;
  (apiRequest as jest.Mock).mockResolvedValue({ token: 't', user: { user_id: '1' } });

  await login({ email: 'a@b.com', password: 'secret1' });

  expect(apiRequest).toHaveBeenCalled();
  expect(demoAdapter.demoLogin).not.toHaveBeenCalled();
});

test('a real API failure in real mode rejects — it never falls back to demo data', async () => {
  delete process.env.EXPO_PUBLIC_DEMO_MODE;
  (apiRequest as jest.Mock).mockRejectedValue(new Error('network down'));

  await expect(login({ email: 'a@b.com', password: 'secret1' })).rejects.toThrow('network down');
  expect(demoAdapter.demoLogin).not.toHaveBeenCalled();
});
