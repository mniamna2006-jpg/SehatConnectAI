import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useHospitalDetailsViewModel } from '../../viewmodels/useHospitalDetailsViewModel';
import { HospitalDetailsView } from '../HospitalDetailsView';

jest.mock('../../viewmodels/useHospitalDetailsViewModel');
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

test('renders supported hospital profile, departments, doctors, and 12-hour timing', async () => {
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
  expect(screen.getByText('+92 21 111 222 333')).toBeOnTheScreen();
  expect(screen.getByText('care@city.test')).toBeOnTheScreen();
  expect(screen.getByText('9:00 AM')).toBeOnTheScreen();
  expect(screen.getByText('to 5:00 PM')).toBeOnTheScreen();
  expect(screen.getAllByText('Cardiology')).not.toHaveLength(0);
  expect(screen.getByText('Dr. Ali')).toBeOnTheScreen();
  expect(screen.queryByText(/rating|review|statistic/i)).not.toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(router.back).toHaveBeenCalledTimes(1);
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
        day_of_week: 'SUNDAY',
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

  expect(screen.getByTestId('working-hours-SUNDAY')).toHaveTextContent('SUNDAYClosed');
  expect(screen.queryByText('9:00 AM')).not.toBeOnTheScreen();
  expect(screen.queryByText('to 5:00 PM')).not.toBeOnTheScreen();
});
