import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { TestQueryProvider } from '../../../../../core/query/testUtils';
import { getStaffDashboard } from '../../model/api';
import { useStaffDashboardViewModel } from '../useStaffDashboardViewModel';

jest.mock('../../model/api');

const wrapper = ({ children }: { children: ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

beforeEach(() => jest.clearAllMocks());

test('loads the real staff dashboard data', async () => {
  (getStaffDashboard as jest.Mock).mockResolvedValue({
    hospital: { hospital_id: 'h1', name: 'City Hospital', facility_type: 'HOSPITAL', city: 'Karachi' },
    staff_context: { staff_id: 's1', employee_id: 'E-1', position: 'Nurse', department: null },
    departments: { active: 3 },
    doctors: { active: 8, available_today: 5 },
    today_appointments: { total: 12, by_status: { BOOKED: 5, COMPLETED: 7 } },
    today_queue: { total: 4, by_status: { WAITING: 4 } },
  });

  const { result } = await renderHook(() => useStaffDashboardViewModel(), { wrapper });

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.dashboard?.hospital?.name).toBe('City Hospital');
  expect(result.current.dashboard?.doctors.available_today).toBe(5);
});

test('surfaces the error state when the dashboard fails to load', async () => {
  (getStaffDashboard as jest.Mock).mockRejectedValue(new Error('Hospital not found'));

  const { result } = await renderHook(() => useStaffDashboardViewModel(), { wrapper });

  await waitFor(() => expect(result.current.isError).toBe(true));
});
