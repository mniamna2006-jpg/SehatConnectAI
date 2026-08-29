import { apiRequest } from '../../../../core/api/client';
import { getDepartmentsByHospital } from '../api';

jest.mock('../../../../core/api/client');

test('getDepartmentsByHospital calls GET /api/departments/hospital/:id', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await getDepartmentsByHospital('h1');
  expect(apiRequest).toHaveBeenCalledWith('/api/departments/hospital/h1');
});
