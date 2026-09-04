import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useHospitalDetailsViewModel } from '../../viewmodels/useHospitalDetailsViewModel';
import { useDoctorAvailabilitySubscription } from '../../../doctors/viewmodels/useDoctorAvailabilitySubscription';
import { openHospitalNavigation } from '../../../../core/navigation/openHospitalNavigation';
import { ltr } from '../../../../shared/utils/formatters';
import { HospitalDetailsView } from '../HospitalDetailsView';

jest.mock('../../viewmodels/useHospitalDetailsViewModel');
jest.mock('../../../doctors/viewmodels/useDoctorAvailabilitySubscription');
jest.mock('../../../../core/navigation/openHospitalNavigation');
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

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-09-07T10:00:00'));
});

afterEach(() => {
  jest.useRealTimers();
});

test('renders supported hospital profile, departments, doctors, and 12-hour timing', async () => {
  (useDoctorAvailabilitySubscription as jest.Mock).mockReturnValue({
    subscribed: false,
    isLoading: false,
    isError: false,
    isUpdating: false,
    hasMutationError: false,
    canManageAlert: false,
    toggleAlert: jest.fn(),
    refetch: jest.fn(),
  });
  (useHospitalDetailsViewModel as jest.Mock).mockReturnValue({
    hospital: {
      hospital_id: 'h1',
      name: 'City Hospital',
      facility_type: 'HOSPITAL',
      description: 'Trusted specialist care.',
      phone: '+92 21 111 222 333',
      email: 'care@city.test',
      address: 'Main Road',
      city: 'Karachi',
      working_hours: [{
        day_of_week: 'MONDAY',
        opening_time: '09:00',
        closing_time: '17:00',
        is_open: true,
      }],
      departments: [{ department_id: 'dep1', name: 'Cardiology' }],
      doctors: [{ doctor_id: 'd1', name: 'Dr. Ali', specialization: 'Cardiology' }],
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

  await render(<HospitalDetailsView hospitalId="h1" />);

  expect(screen.getByTestId('hospital-name')).toHaveTextContent('City Hospital');
  expect(screen.getByTestId('hospital-address')).toHaveTextContent('Main Road, Karachi');
  expect(screen.getByText(ltr('+92 21 111 222 333'))).toBeOnTheScreen();
  expect(screen.getByText('care@city.test')).toBeOnTheScreen();
  expect(screen.getByText(ltr('9:00 AM'))).toBeOnTheScreen();
  expect(screen.getByText(`to ${ltr('5:00 PM')}`)).toBeOnTheScreen();
  expect(screen.getAllByText('Cardiology')).not.toHaveLength(0);
  expect(screen.getByText('Dr. Ali')).toBeOnTheScreen();
  expect(screen.queryByText(/rating|review|statistic/i)).not.toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(router.back).toHaveBeenCalledTimes(1);
});

test('pressing Get Directions opens navigation with the hospital location', async () => {
  (useHospitalDetailsViewModel as jest.Mock).mockReturnValue({
    hospital: {
      hospital_id: 'h1',
      name: 'City Hospital',
      facility_type: 'HOSPITAL',
      address: 'Main Road',
      city: 'Karachi',
      latitude: 24.86,
      longitude: 67.0,
      working_hours: [],
      departments: [],
      doctors: [],
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  (openHospitalNavigation as jest.Mock).mockResolvedValue(true);

  await render(<HospitalDetailsView hospitalId="h1" />);

  await fireEvent.press(screen.getByTestId('get-directions-button'));

  await waitFor(() => expect(openHospitalNavigation).toHaveBeenCalledWith({
    latitude: 24.86,
    longitude: 67.0,
    address: 'Main Road',
    city: 'Karachi',
    hospitalName: 'City Hospital',
  }));
});

test('safely renders absent optional logo, contact, timing, departments, and doctors', async () => {
  (useHospitalDetailsViewModel as jest.Mock).mockReturnValue({
    hospital: {
      hospital_id: 'h2',
      name: 'Community Clinic',
      facility_type: 'CLINIC',
      working_hours: [],
      departments: [],
      doctors: [],
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

  await render(<HospitalDetailsView hospitalId="h2" />);

  expect(screen.getByText('Community Clinic')).toBeOnTheScreen();
  expect(screen.queryByTestId('hospital-working-hours-section')).not.toBeOnTheScreen();
  expect(screen.queryByTestId('hospital-departments-section')).not.toBeOnTheScreen();
  expect(screen.queryByTestId('hospital-doctors-section')).not.toBeOnTheScreen();
});

test('renders a closed working-hours day as closed without opening times', async () => {
  (useHospitalDetailsViewModel as jest.Mock).mockReturnValue({
    hospital: {
      hospital_id: 'h3',
      name: 'City Hospital',
      facility_type: 'HOSPITAL',
      working_hours: [{
        day_of_week: 'MONDAY',
        opening_time: '09:00',
        closing_time: '17:00',
        is_open: false,
      }],
      departments: [],
      doctors: [],
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

  await render(<HospitalDetailsView hospitalId="h3" />);

  expect(screen.getByTestId('hospital-today-hours')).toHaveTextContent('TodayClosed');
  expect(screen.queryByText('9:00 AM')).not.toBeOnTheScreen();
  expect(screen.queryByText('to 5:00 PM')).not.toBeOnTheScreen();
});

test('the full week stays hidden behind a toggle until the patient asks for it', async () => {
  (useDoctorAvailabilitySubscription as jest.Mock).mockReturnValue({
    subscribed: false,
    isLoading: false,
    isError: false,
    isUpdating: false,
    hasMutationError: false,
    canManageAlert: false,
    toggleAlert: jest.fn(),
    refetch: jest.fn(),
  });
  (useHospitalDetailsViewModel as jest.Mock).mockReturnValue({
    hospital: {
      hospital_id: 'h4',
      name: 'City Hospital',
      facility_type: 'HOSPITAL',
      working_hours: [
        { day_of_week: 'MONDAY', opening_time: '09:00', closing_time: '17:00', is_open: true },
        { day_of_week: 'TUESDAY', opening_time: '09:00', closing_time: '17:00', is_open: true },
        { day_of_week: 'SUNDAY', opening_time: '09:00', closing_time: '17:00', is_open: false },
      ],
      departments: [],
      doctors: [],
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

  await render(<HospitalDetailsView hospitalId="h4" />);

  expect(screen.queryByTestId('hospital-working-hours-list')).not.toBeOnTheScreen();

  await fireEvent.press(screen.getByTestId('toggle-weekly-hours'));

  expect(screen.getByTestId('hospital-working-hours-list')).toBeOnTheScreen();
  expect(screen.getByTestId('working-hours-SUNDAY')).toHaveTextContent('SundayClosed');
});
