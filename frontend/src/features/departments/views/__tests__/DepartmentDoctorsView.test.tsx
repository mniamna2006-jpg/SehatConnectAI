import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { useDoctorAvailabilitySubscription } from '../../../doctors/viewmodels/useDoctorAvailabilitySubscription';
import { useDepartmentDoctorsViewModel } from '../../viewmodels/useDepartmentDoctorsViewModel';
import { DepartmentDoctorsView } from '../DepartmentDoctorsView';

jest.mock('../../viewmodels/useDepartmentDoctorsViewModel');
jest.mock('../../../doctors/viewmodels/useDoctorAvailabilitySubscription');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => {
  const mockReact = require('react');
  const { View: MockView } = require('react-native');
  return {
    Link: ({ children, href }: { children: ReactNode; href: string }) =>
      mockReact.createElement(MockView, { accessibilityRole: 'link', accessibilityLabel: href }, children),
  };
});

test('shows department doctor results', async () => {
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
  (useDepartmentDoctorsViewModel as jest.Mock).mockReturnValue({
    doctors: [{
      doctor_id: 'd1',
      hospital_id: 'h1',
      department_id: 'dep1',
      name: 'Dr. Ali',
      specialization: 'Cardiology',
      is_active: true,
    }],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

  await render(<DepartmentDoctorsView departmentId="dep1" />);

  expect(screen.getByText('Dr. Ali')).toBeOnTheScreen();
  expect(screen.getByText('Cardiology')).toBeOnTheScreen();
  expect(screen.queryByText('Specialist care team')).not.toBeOnTheScreen();
});
