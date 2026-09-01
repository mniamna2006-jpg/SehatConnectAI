import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { useAdminDashboardViewModel } from '../../viewmodels/useAdminDashboardViewModel';
import { AdminDashboardView } from '../AdminDashboardView';

jest.mock('../../viewmodels/useAdminDashboardViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => {
  const { View: MockView } = require('react-native');
  return {
    router: { back: jest.fn() },
    Link: ({ children, href }: { children: ReactNode; href: string }) => (
      <MockView accessibilityRole="link" accessibilityLabel={href}>{children}</MockView>
    ),
  };
});

beforeEach(() => jest.clearAllMocks());

const baseDashboard = {
  hospital: { hospital_id: 'h1', name: 'City Hospital', facility_type: 'HOSPITAL', city: 'Karachi', phone: null, email: null, logo_url: null, cover_image_url: null, theme: null, is_active: true },
  departments: { total: 4, active: 3 },
  doctors: { total: 10, active: 9 },
  staff: { total: 6, active: 6 },
  patients: { total: 120 },
  today_appointments: [],
  appointment_counts: { total: 0, by_status: {} },
  today_queue: { total: 0, by_status: {} },
};

test('shows loading state', async () => {
  (useAdminDashboardViewModel as jest.Mock).mockReturnValue({ isLoading: true, isError: false, refetch: jest.fn() });
  await render(<AdminDashboardView />);
  expect(screen.getByText(/Preparing|Loading/i)).toBeOnTheScreen();
});

test('shows error state with retry', async () => {
  const refetch = jest.fn();
  (useAdminDashboardViewModel as jest.Mock).mockReturnValue({ isLoading: false, isError: true, error: new Error('Hospital is inactive'), refetch });
  await render(<AdminDashboardView />);
  expect(screen.getByText('Hospital is inactive')).toBeOnTheScreen();
});

test('renders only hospital information returned by the dashboard contract', async () => {
  (useAdminDashboardViewModel as jest.Mock).mockReturnValue({
    dashboard: {
      ...baseDashboard,
      hospital: {
        ...baseDashboard.hospital,
        phone: '+92 21 111 222 333',
        email: 'ops@cityhospital.test',
      },
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  await render(<AdminDashboardView />);

  expect(screen.getByText('City Hospital')).toBeOnTheScreen();
  expect(screen.getByText('Karachi')).toBeOnTheScreen();
  expect(screen.getByText('Hospital')).toBeOnTheScreen();
  expect(screen.getByText('+92 21 111 222 333')).toBeOnTheScreen();
  expect(screen.getByText('ops@cityhospital.test')).toBeOnTheScreen();
  expect(screen.getByTestId('stat-departments')).toHaveTextContent(/^4/);
  expect(screen.getByTestId('stat-doctors')).toHaveTextContent(/^10/);
  expect(screen.getByTestId('stat-staff')).toHaveTextContent(/^6/);
  expect(screen.getByTestId('stat-patients')).toHaveTextContent(/^120/);
  expect(screen.getByTestId('today-appointments-section')).toBeOnTheScreen();
});

test('links only to implemented admin screens', async () => {
  (useAdminDashboardViewModel as jest.Mock).mockReturnValue({ dashboard: baseDashboard, isLoading: false, isError: false, refetch: jest.fn() });
  await render(<AdminDashboardView />);

  expect(screen.getByLabelText('/admin/profile')).toBeOnTheScreen();
  expect(screen.getByLabelText('/admin/analytics')).toBeOnTheScreen();
  expect(screen.getByLabelText('/admin/departments')).toBeOnTheScreen();
  expect(screen.getByLabelText('/admin/doctors')).toBeOnTheScreen();
  expect(screen.queryByLabelText('/admin/staff')).not.toBeOnTheScreen();
  expect(screen.queryByLabelText('/admin/invitations')).not.toBeOnTheScreen();
});

test('renders today appointments with patient, doctor, department, and status', async () => {
  (useAdminDashboardViewModel as jest.Mock).mockReturnValue({
    dashboard: {
      ...baseDashboard,
      today_appointments: [{
        appointment_id: 'a1',
        appointment_time: '10:00',
        appointment_time_12h: '10:00 AM',
        status: 'CONFIRMED',
        patient: { user: { user_id: 'u1', full_name: 'Sara Khan', email: null, phone: null } },
        doctor: { doctor_id: 'd1', name: 'Dr. Ali', specialization: 'Cardiology' },
        department: { department_id: 'dep1', name: 'Cardiology' },
        slot: null,
      }],
      appointment_counts: { total: 1, by_status: { CONFIRMED: 1 } },
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  await render(<AdminDashboardView />);

  expect(screen.getByTestId('appointment-row-a1')).toHaveTextContent(/Sara Khan/);
  expect(screen.getByTestId('appointment-row-a1')).toHaveTextContent(/Dr\. Ali/);
  expect(screen.getByTestId('appointment-row-a1')).toHaveTextContent(/Confirmed/);
  expect(screen.getByText('Confirmed: 1')).toBeOnTheScreen();
});
