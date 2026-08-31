import { getDoctorsByHospital, getDoctorsByDepartment, getDoctorById } from '../api';
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

test('getDoctorsByHospital calls GET /api/doctors/hospital/:id', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await getDoctorsByHospital('h1');
  expect(apiRequest).toHaveBeenCalledWith('/api/doctors/hospital/h1');
});

test('getDoctorsByDepartment calls GET /api/doctors/department/:id', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await getDoctorsByDepartment('d1');
  expect(apiRequest).toHaveBeenCalledWith('/api/doctors/department/d1');
});

test('getDoctorById calls GET /api/doctors/:id', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ doctor_id: 'doc1' });
  await getDoctorById('doc1');
  expect(apiRequest).toHaveBeenCalledWith('/api/doctors/doc1');
});

test('demo mode routes every doctor function to the demo adapter, never the real API', async () => {
  process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
  (demoAdapter.demoGetDoctorsByHospital as jest.Mock).mockResolvedValue([]);
  (demoAdapter.demoGetDoctorsByDepartment as jest.Mock).mockResolvedValue([]);
  (demoAdapter.demoGetDoctorById as jest.Mock).mockResolvedValue({ doctor_id: 'doc1' });

  await getDoctorsByHospital('h1');
  await getDoctorsByDepartment('dep1');
  await getDoctorById('doc1');

  expect(demoAdapter.demoGetDoctorsByHospital).toHaveBeenCalledWith('h1');
  expect(demoAdapter.demoGetDoctorsByDepartment).toHaveBeenCalledWith('dep1');
  expect(demoAdapter.demoGetDoctorById).toHaveBeenCalledWith('doc1');
  expect(apiRequest).not.toHaveBeenCalled();
});

test('a real doctor API failure rejects without falling back to demo data', async () => {
  (apiRequest as jest.Mock).mockRejectedValue(new Error('network down'));

  await expect(getDoctorsByHospital('h1')).rejects.toThrow('network down');

  expect(demoAdapter.demoGetDoctorsByHospital).not.toHaveBeenCalled();
});
