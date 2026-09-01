import { apiRequest } from '../../../../../core/api/client';
import { getAdminAnalytics } from '../api';

jest.mock('../../../../../core/api/client');

test('requests the real hospital-scoped analytics overview endpoint', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ appointments: { total: 0 } });

  await getAdminAnalytics();

  expect(apiRequest).toHaveBeenCalledWith('/api/analytics/overview', { scope: 'hospital' });
});
