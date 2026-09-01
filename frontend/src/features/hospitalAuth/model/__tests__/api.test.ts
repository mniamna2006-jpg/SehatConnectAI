import { apiRequest } from '../../../../core/api/client';
import { getHospitalMe, loginHospital } from '../api';

jest.mock('../../../../core/api/client');

beforeEach(() => {
  jest.clearAllMocks();
});

test('hospital login posts credentials to the implemented hospital login endpoint', async () => {
  const response = {
    token: 'hospital-token',
    user: { user_id: 'admin-1', role: 'ADMIN' },
  };
  (apiRequest as jest.Mock).mockResolvedValue(response);

  await expect(
    loginHospital({ email: 'admin@hospital.test', password: 'secret1' })
  ).resolves.toBe(response);
  expect(apiRequest).toHaveBeenCalledWith('/api/auth/login-hospital', {
    method: 'POST',
    body: { email: 'admin@hospital.test', password: 'secret1' },
    auth: false,
  });
});

test('hospital session restoration uses the implemented auth session endpoint with hospital scope', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ user_id: 'staff-1', role: 'STAFF' });

  await getHospitalMe();

  expect(apiRequest).toHaveBeenCalledWith('/api/auth/me', { scope: 'hospital' });
});
