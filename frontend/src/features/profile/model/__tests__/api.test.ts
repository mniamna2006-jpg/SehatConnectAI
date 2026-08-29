import { getProfile, updateProfile } from '../api';
import { apiRequest } from '../../../../core/api/client';

jest.mock('../../../../core/api/client');

test('getProfile calls GET /api/patient/profile', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ patient_id: '1' });
  await getProfile();
  expect(apiRequest).toHaveBeenCalledWith('/api/patient/profile');
});

test('updateProfile PATCHes /api/patient/profile with a partial body', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ patient_id: '1' });
  await updateProfile({ city: 'Karachi' });
  expect(apiRequest).toHaveBeenCalledWith('/api/patient/profile', { method: 'PATCH', body: { city: 'Karachi' } });
});
