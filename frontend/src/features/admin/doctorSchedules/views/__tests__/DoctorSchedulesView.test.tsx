import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { useDoctorSchedulesViewModel } from '../../viewmodels/useDoctorSchedulesViewModel';
import { DoctorSchedulesView } from '../DoctorSchedulesView';

jest.mock('../../viewmodels/useDoctorSchedulesViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn() }));
jest.mock('react-hook-form', () => ({
  Controller: ({ render: renderField }: { render: (input: { field: { onBlur(): void; onChange(): void; value: string } }) => ReactNode }) =>
    renderField({ field: { onBlur: jest.fn(), onChange: jest.fn(), value: '' } }),
}));

const baseViewModel = {
  doctor: {
    doctor_id: 'doctor-1',
    hospital_id: 'hospital-1',
    department_id: 'department-1',
    name: 'Dr. Amina Shah',
    specialization: 'Cardiology',
    qualification: 'FCPS',
    license_number: 'PMC-1001',
    bio: null,
    consultation_fee: '2500.00',
    is_active: true,
  },
  doctorMissing: false,
  schedules: [{
    schedule_id: 'schedule-1',
    doctor_id: 'doctor-1',
    day_of_week: 'MONDAY',
    start_time: '09:00',
    end_time: '12:00',
    start_time_12h: '9:00 AM',
    end_time_12h: '12:00 PM',
    appointment_duration: 30,
    is_active: true,
  }],
  isLoading: false,
  isError: false,
  error: null,
  refetch: jest.fn(),
  scheduleFormOpen: false,
  openScheduleForm: jest.fn(),
  closeScheduleForm: jest.fn(),
  scheduleControl: {},
  scheduleErrors: {},
  setScheduleValue: jest.fn(),
  isCreatingSchedule: false,
  onCreateSchedule: jest.fn(),
  scheduleError: null,
  scheduleSuccess: null,
  generationControl: {},
  generationErrors: {},
  setGenerationValue: jest.fn(),
  onGenerateSlots: jest.fn(),
  isGenerating: false,
  generationError: null,
  generationSuccess: null,
  generatedSlots: [],
};

beforeEach(() => jest.clearAllMocks());

test('shows schedule loading state', async () => {
  (useDoctorSchedulesViewModel as jest.Mock).mockReturnValue({ ...baseViewModel, isLoading: true });
  await render(<DoctorSchedulesView />);
  expect(screen.getByText('Loading doctor schedules…')).toBeOnTheScreen();
});

test('shows backend schedule loading errors', async () => {
  (useDoctorSchedulesViewModel as jest.Mock).mockReturnValue({
    ...baseViewModel,
    isError: true,
    error: new Error('Schedule service unavailable'),
  });
  await render(<DoctorSchedulesView />);
  expect(screen.getByText('Schedule service unavailable')).toBeOnTheScreen();
});

test('shows an empty state when the doctor is not active in the admin hospital', async () => {
  (useDoctorSchedulesViewModel as jest.Mock).mockReturnValue({
    ...baseViewModel,
    doctor: null,
    doctorMissing: true,
  });
  await render(<DoctorSchedulesView />);
  expect(screen.getByText('Doctor unavailable')).toBeOnTheScreen();
});

test('renders real schedules and generated slots with localized backend status', async () => {
  (useDoctorSchedulesViewModel as jest.Mock).mockReturnValue({
    ...baseViewModel,
    generationSuccess: '1 time slot generated.',
    generatedSlots: [{
      slot_id: 'slot-1',
      doctor_id: 'doctor-1',
      hospital_id: 'hospital-1',
      date: '2026-09-07T00:00:00.000Z',
      start_time: '09:00',
      end_time: '09:30',
      status: 'AVAILABLE',
    }],
  });
  await render(<DoctorSchedulesView />);

  expect(screen.getByText('Monday')).toBeOnTheScreen();
  expect(screen.getByText('9:00 AM – 9:30 AM')).toBeOnTheScreen();
  expect(screen.getByText('Available')).toBeOnTheScreen();
  expect(screen.queryByText('AVAILABLE')).not.toBeOnTheScreen();
});
