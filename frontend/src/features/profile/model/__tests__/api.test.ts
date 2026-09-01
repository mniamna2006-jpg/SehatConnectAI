import { getProfile, updateProfile } from '../api';
import { apiRequest } from '../../../../core/api/client';

jest.mock('../../../../core/api/client');

beforeEach(() => {
  jest.clearAllMocks();
});

test('getProfile calls the backend-mounted GET /api/patients/profile route', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ patient_id: '1' });
  await getProfile();
  expect(apiRequest).toHaveBeenCalledWith('/api/patients/profile');
});

test('updateProfile PATCHes the backend-mounted /api/patients/profile route', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ patient_id: '1' });
  await updateProfile({ city: 'Karachi' });
  expect(apiRequest).toHaveBeenCalledWith('/api/patients/profile', { method: 'PATCH', body: { city: 'Karachi' } });
});

test('a profile API failure rejects', async () => {
  (apiRequest as jest.Mock).mockRejectedValue(new Error('network down'));

  await expect(getProfile()).rejects.toThrow('network down');
});
