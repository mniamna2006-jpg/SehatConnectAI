import {
  getDoctorAvailabilitySubscription,
  getDoctorById,
  getDoctorsByDepartment,
  getDoctorsByHospital,
  subscribeToDoctorAvailability,
  unsubscribeFromDoctorAvailability,
} from '../api';
import { apiRequest } from '../../../../core/api/client';

jest.mock('../../../../core/api/client');

beforeEach(() => {
  jest.clearAllMocks();
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

test('a doctor API failure rejects', async () => {
  (apiRequest as jest.Mock).mockRejectedValue(new Error('network down'));

  await expect(getDoctorsByHospital('h1')).rejects.toThrow('network down');
});

test('uses exact patient availability subscription contracts', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({
    doctor_id: 'd1',
    subscribed: false,
    is_available: false,
  });

  await getDoctorAvailabilitySubscription('d1');
  await subscribeToDoctorAvailability('d1');
  await unsubscribeFromDoctorAvailability('d1');

  expect(apiRequest).toHaveBeenNthCalledWith(1, '/api/doctors/d1/availability-subscription');
  expect(apiRequest).toHaveBeenNthCalledWith(2, '/api/doctors/d1/availability-subscription', {
    method: 'POST',
  });
  expect(apiRequest).toHaveBeenNthCalledWith(3, '/api/doctors/d1/availability-subscription', {
    method: 'DELETE',
  });
});
