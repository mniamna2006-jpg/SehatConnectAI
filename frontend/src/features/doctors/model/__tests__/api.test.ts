import { getDoctorsByHospital, getDoctorsByDepartment, getDoctorById } from '../api';
import { apiRequest } from '../../../../core/api/client';

jest.mock('../../../../core/api/client');

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
