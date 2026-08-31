import { apiRequest } from '../../../../core/api/client';
import { getDepartmentsByHospital } from '../api';
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

test('getDepartmentsByHospital calls GET /api/departments/hospital/:id', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await getDepartmentsByHospital('h1');
  expect(apiRequest).toHaveBeenCalledWith('/api/departments/hospital/h1');
});

test('demo mode routes to the demo adapter, never the real API', async () => {
  process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
  (demoAdapter.demoGetDepartmentsByHospital as jest.Mock).mockResolvedValue([]);
  await getDepartmentsByHospital('h1');
  expect(demoAdapter.demoGetDepartmentsByHospital).toHaveBeenCalledWith('h1');
  expect(apiRequest).not.toHaveBeenCalled();
});

test('real API failure in real mode rejects — it never falls back to demo data', async () => {
  delete process.env.EXPO_PUBLIC_DEMO_MODE;
  (apiRequest as jest.Mock).mockRejectedValue(new Error('network down'));
  await expect(getDepartmentsByHospital('h1')).rejects.toThrow('network down');
  expect(demoAdapter.demoGetDepartmentsByHospital).not.toHaveBeenCalled();
});
