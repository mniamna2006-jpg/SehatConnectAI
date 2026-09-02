import { render, screen } from '@testing-library/react-native';
import { useAdminAnalyticsViewModel } from '../../viewmodels/useAdminAnalyticsViewModel';
import { AdminAnalyticsView } from '../AdminAnalyticsView';

jest.mock('../../viewmodels/useAdminAnalyticsViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

const analytics = {
  appointments: {
    total: 42,
    booked: 8,
    confirmed: 7,
    checked_in: 4,
    in_progress: 3,
    completed: 15,
    cancelled: 4,
    no_show: 1,
    today: 5,
    this_week: 19,
    this_month: 42,
  },
  patients: { total: 120, active: 96, new_today: 3, new_this_week: 11, new_this_month: 28 },
  queue: { total: 9, waiting: 3, called: 1, in_progress: 2, completed: 2, skipped: 1, average_wait_minutes: 14.5 },
  operations: {
    hospitals: { total: 1, active: 1 },
    doctors: { total: 10, active: 9 },
    departments: { total: 4, active: 3 },
    appointments_by_department: [{ department_id: 'dep1', department_name: 'Cardiology', total: 18 }],
    appointments_by_doctor: [{ doctor_id: 'd1', doctor_name: 'Dr. Ali', specialization: 'Cardiology', total: 12 }],
    doctor_workload: [{ doctor_id: 'd1', doctor_name: 'Dr. Ali', specialization: 'Cardiology', total_appointments: 12, by_status: { COMPLETED: 8, CONFIRMED: 4 } }],
    hospital_workload: {
      hospital_id: 'h1',
      hospital_name: 'City Hospital',
      total_appointments: 42,
      total_queues: 9,
      active_doctors: 9,
      active_departments: 3,
    },
  },
};

const emptyAnalytics = {
  appointments: { total: 0, booked: 0, confirmed: 0, checked_in: 0, in_progress: 0, completed: 0, cancelled: 0, no_show: 0, today: 0, this_week: 0, this_month: 0 },
  patients: { total: 0, active: 0, new_today: 0, new_this_week: 0, new_this_month: 0 },
  queue: { total: 0, waiting: 0, called: 0, in_progress: 0, completed: 0, skipped: 0, average_wait_minutes: null },
  operations: {
    hospitals: { total: 1, active: 1 },
    doctors: { total: 0, active: 0 },
    departments: { total: 0, active: 0 },
    appointments_by_department: [],
    appointments_by_doctor: [],
    doctor_workload: [],
    hospital_workload: { hospital_id: 'h1', hospital_name: 'City Hospital', total_appointments: 0, total_queues: 0, active_doctors: 0, active_departments: 0 },
  },
};

beforeEach(() => jest.clearAllMocks());

test('shows analytics loading and error states', async () => {
  (useAdminAnalyticsViewModel as jest.Mock).mockReturnValue({ isLoading: true });
  await render(<AdminAnalyticsView />);
  expect(screen.getByText('Loading analytics…')).toBeOnTheScreen();

  (useAdminAnalyticsViewModel as jest.Mock).mockReturnValue({ isLoading: false, isError: true, error: new Error('Analytics unavailable'), refetch: jest.fn() });
  await screen.rerender(<AdminAnalyticsView />);
  expect(screen.getByText('Analytics unavailable')).toBeOnTheScreen();
});

test('shows an empty state when the service returns no operational activity', async () => {
  (useAdminAnalyticsViewModel as jest.Mock).mockReturnValue({ analytics: emptyAnalytics, isLoading: false, isError: false, refetch: jest.fn() });
  await render(<AdminAnalyticsView />);

  expect(screen.getByText('No analytics yet')).toBeOnTheScreen();
});

test('presents only returned overview metrics and breakdowns', async () => {
  (useAdminAnalyticsViewModel as jest.Mock).mockReturnValue({ analytics, isLoading: false, isError: false, refetch: jest.fn() });
  await render(<AdminAnalyticsView />);

  expect(screen.getByTestId('analytics-appointments')).toHaveTextContent(/42/);
  expect(screen.getByTestId('analytics-patients')).toHaveTextContent(/120/);
  expect(screen.getByTestId('analytics-queue')).toHaveTextContent(/14\.5 min/);
  expect(screen.getByTestId('analytics-operations')).toHaveTextContent(/City Hospital/);
  expect(screen.getByTestId('department-breakdown-dep1')).toHaveTextContent(/Cardiology/);
  expect(screen.getByTestId('department-breakdown-dep1')).toHaveTextContent(/18/);
  expect(screen.getByTestId('doctor-breakdown-d1')).toHaveTextContent(/Dr\. Ali/);
  expect(screen.getByTestId('doctor-workload-d1')).toHaveTextContent(/12/);
});
