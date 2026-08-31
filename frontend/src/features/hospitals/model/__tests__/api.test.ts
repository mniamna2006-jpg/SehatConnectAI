import { getHospitals, getHospitalsNearby, searchHospitalsByCity, getHospitalById } from '../api';
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

test('getHospitals calls GET /api/hospitals', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await getHospitals();
  expect(apiRequest).toHaveBeenCalledWith('/api/hospitals');
});

test('getHospitalsNearby passes latitude/longitude/radius query params', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await getHospitalsNearby({ latitude: 24.86, longitude: 67.0 }, 15);
  expect(apiRequest).toHaveBeenCalledWith('/api/hospitals/nearby?latitude=24.86&longitude=67&radius=15');
});

test('searchHospitalsByCity url-encodes the city', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await searchHospitalsByCity('Gulshan-e-Iqbal');
  expect(apiRequest).toHaveBeenCalledWith('/api/hospitals/search?city=Gulshan-e-Iqbal');
});

test('getHospitalById calls GET /api/hospitals/:id', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ hospital_id: 'h1' });
  await getHospitalById('h1');
  expect(apiRequest).toHaveBeenCalledWith('/api/hospitals/h1');
});

test('demo mode routes every function to the demo adapter, never the real API', async () => {
  process.env.EXPO_PUBLIC_DEMO_MODE = 'true';
  (demoAdapter.demoGetHospitals as jest.Mock).mockResolvedValue([]);
  (demoAdapter.demoGetHospitalsNearby as jest.Mock).mockResolvedValue([]);
  (demoAdapter.demoSearchHospitalsByCity as jest.Mock).mockResolvedValue([]);
  (demoAdapter.demoGetHospitalById as jest.Mock).mockResolvedValue({ hospital_id: 'h1' });

  await getHospitals();
  await getHospitalsNearby({ latitude: 1, longitude: 1 });
  await searchHospitalsByCity('Lahore');
  await getHospitalById('h1');

  expect(demoAdapter.demoGetHospitals).toHaveBeenCalledTimes(1);
  expect(demoAdapter.demoGetHospitalsNearby).toHaveBeenCalledWith({ latitude: 1, longitude: 1 });
  expect(demoAdapter.demoSearchHospitalsByCity).toHaveBeenCalledWith('Lahore');
  expect(demoAdapter.demoGetHospitalById).toHaveBeenCalledWith('h1');
  expect(apiRequest).not.toHaveBeenCalled();
});

test('real API failure in real mode rejects — it never falls back to demo data', async () => {
  delete process.env.EXPO_PUBLIC_DEMO_MODE;
  (apiRequest as jest.Mock).mockRejectedValue(new Error('network down'));
  await expect(getHospitals()).rejects.toThrow('network down');
  expect(demoAdapter.demoGetHospitals).not.toHaveBeenCalled();
});
