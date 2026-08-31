import { getHospitals, getHospitalsNearby, searchHospitalsByCity, getHospitalById } from '../api';
import { apiRequest } from '../../../../core/api/client';

jest.mock('../../../../core/api/client');

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
