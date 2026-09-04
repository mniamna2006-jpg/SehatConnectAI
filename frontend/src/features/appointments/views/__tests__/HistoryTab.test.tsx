import { render, screen } from '@testing-library/react-native';
import { useAppointmentHistoryViewModel } from '../../viewmodels/useAppointmentHistoryViewModel';
import { HistoryTab } from '../HistoryTab';

jest.mock('../../viewmodels/useAppointmentHistoryViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);

function mockViewModel(overrides: Record<string, unknown> = {}) {
  (useAppointmentHistoryViewModel as jest.Mock).mockReturnValue({
    appointments: [],
    filter: 'upcoming',
    setFilter: jest.fn(),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    cancelError: null,
    isCancelling: () => false,
    onCancel: jest.fn(),
    ...overrides,
  });
}

test('shows the doctor and hospital name from the enriched appointment, never a raw id', async () => {
  mockViewModel({
    appointments: [
      {
        appointment_id: 'a1',
        doctor_id: 'doc-11111111-1111-1111-1111-111111111111',
        hospital_id: 'hosp-22222222-2222-2222-2222-222222222222',
        status: 'BOOKED',
        appointment_date: '2026-09-10',
        appointment_time: '10:00',
        appointment_time_12h: '10:00 AM',
        booking_reference: 'REF123',
        doctor: { name: 'Dr. Ahmed Khan' },
        hospital: { name: 'SehatConnect Test Hospital' },
      },
    ],
  });

  await render(<HistoryTab />);

  expect(screen.getByText('Dr. Ahmed Khan')).toBeOnTheScreen();
  expect(screen.getByText('SehatConnect Test Hospital')).toBeOnTheScreen();
  expect(screen.queryByText(/hosp-|doc-/)).not.toBeOnTheScreen();
});

test('falls back to a localized message instead of a raw id when doctor or hospital name is missing', async () => {
  mockViewModel({
    appointments: [
      {
        appointment_id: 'a2',
        doctor_id: 'doc-33333333-3333-3333-3333-333333333333',
        hospital_id: 'hosp-44444444-4444-4444-4444-444444444444',
        status: 'CONFIRMED',
        appointment_date: '2026-09-11',
        appointment_time: '11:00',
        appointment_time_12h: '11:00 AM',
        booking_reference: 'REF456',
      },
    ],
  });

  await render(<HistoryTab />);

  expect(screen.getAllByText('Details unavailable').length).toBe(2);
  expect(screen.queryByText(/hosp-|doc-/)).not.toBeOnTheScreen();
});

test('renders localized section title, filters, and cancel action', async () => {
  mockViewModel({
    appointments: [
      {
        appointment_id: 'a3',
        doctor_id: 'd3',
        hospital_id: 'h3',
        status: 'BOOKED',
        appointment_date: '2026-09-12',
        appointment_time: '12:00',
        appointment_time_12h: '12:00 PM',
        booking_reference: 'REF789',
        doctor: { name: 'Dr. Sara' },
        hospital: { name: 'City Hospital' },
      },
    ],
  });

  await render(<HistoryTab />);

  expect(screen.getByText('Appointment history')).toBeOnTheScreen();
  expect(screen.getByRole('tab', { name: 'Upcoming' })).toBeOnTheScreen();
  expect(screen.getByRole('tab', { name: 'Completed' })).toBeOnTheScreen();
  expect(screen.getByRole('tab', { name: 'Cancelled' })).toBeOnTheScreen();
  expect(screen.getByText('Booked')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeOnTheScreen();
});
