import { render, screen } from '@testing-library/react-native';
import { useAppointmentBookingViewModel } from '../../viewmodels/useAppointmentBookingViewModel';
import { BookingTab } from '../BookingTab';

jest.mock('../../viewmodels/useAppointmentBookingViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('react-hook-form', () => ({
  Controller: ({ render }: { render: (args: unknown) => unknown }) =>
    render({ field: { value: '', onBlur: jest.fn(), onChange: jest.fn() } }),
}));

test('renders a mobile date strip and 12-hour time slots', async () => {
  (useAppointmentBookingViewModel as jest.Mock).mockReturnValue({
    control: {},
    errors: {},
    hospitals: [],
    departments: [],
    doctors: [],
    timeSlots: [
      {
        slot_id: 'slot-1',
        start_time: '09:00',
        end_time: '09:30',
        status: 'AVAILABLE',
      },
    ],
    hospitalId: '',
    departmentId: '',
    doctorId: '',
    selectedDate: '2026-08-31',
    selectedSlotId: '',
    isLoadingHospitals: false,
    isLoadingDepartments: false,
    isLoadingDoctors: false,
    isLoadingSlots: false,
    isSlotsError: false,
    refetchSlots: jest.fn(),
    onSelectHospital: jest.fn(),
    onSelectDepartment: jest.fn(),
    onSelectDoctor: jest.fn(),
    onSelectDate: jest.fn(),
    onSelectSlot: jest.fn(),
    onSubmit: jest.fn(),
    isSubmitting: false,
    bookingError: null,
    bookingSuccess: null,
  });

  await render(<BookingTab prefill={{}} />);

  expect(screen.getByText('Choose Date')).toBeOnTheScreen();
  expect(screen.getByTestId('date-option-0')).toBeOnTheScreen();
  expect(screen.getByText('9:00 AM')).toBeOnTheScreen();
});
