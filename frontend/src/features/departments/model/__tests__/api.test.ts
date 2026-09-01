import { apiRequest } from '../../../../core/api/client';
import { getDepartmentsByHospital } from '../api';

jest.mock('../../../../core/api/client');

beforeEach(() => {
  jest.clearAllMocks();
});

test('getDepartmentsByHospital calls GET /api/departments/hospital/:id', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await getDepartmentsByHospital('h1');
  expect(apiRequest).toHaveBeenCalledWith('/api/departments/hospital/h1');
});

test('a department API failure rejects', async () => {
  (apiRequest as jest.Mock).mockRejectedValue(new Error('network down'));
  await expect(getDepartmentsByHospital('h1')).rejects.toThrow('network down');
});
