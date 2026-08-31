import { getProfile, updateProfile } from '../api';
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

test('demo mode routes profile reads and updates to the demo adapter, never the real API', async () => {
  process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
  (demoAdapter.demoGetProfile as jest.Mock).mockResolvedValue({ patient_id: 'demo-patient-1' });
  (demoAdapter.demoUpdateProfile as jest.Mock).mockResolvedValue({ patient_id: 'demo-patient-1', city: 'Karachi' });

  await getProfile();
  await updateProfile({ city: 'Karachi' });

  expect(demoAdapter.demoGetProfile).toHaveBeenCalledTimes(1);
  expect(demoAdapter.demoUpdateProfile).toHaveBeenCalledWith({ city: 'Karachi' });
  expect(apiRequest).not.toHaveBeenCalled();
});

test('a real profile API failure rejects without falling back to demo data', async () => {
  (apiRequest as jest.Mock).mockRejectedValue(new Error('network down'));

  await expect(getProfile()).rejects.toThrow('network down');

  expect(demoAdapter.demoGetProfile).not.toHaveBeenCalled();
});
