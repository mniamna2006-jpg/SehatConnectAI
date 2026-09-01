import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { useFindDepartmentViewModel } from '../../viewmodels/useFindDepartmentViewModel';
import { FindDepartmentView } from '../FindDepartmentView';

jest.mock('../../viewmodels/useFindDepartmentViewModel');
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

test('renders accessible two-column department directory and selected affordance', async () => {
  (useFindDepartmentViewModel as jest.Mock).mockReturnValue({
    departments: [{ department_id: 'dep1', name: 'Cardiology', description: 'Heart care' }],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    query: '',
    setQuery: jest.fn(),
    isHospitalScoped: true,
    highlightedDepartmentId: 'dep1',
    selector: null,
  });

  await render(<FindDepartmentView hospitalId="h1" departmentId="dep1" />);

  expect(screen.getByText('Browse Departments')).toBeOnTheScreen();
  expect(screen.getByText('Cardiology')).toBeOnTheScreen();
  expect(screen.getByText('Heart care')).toBeOnTheScreen();
  expect(screen.getByTestId('department-row-dep1')).toBeSelected();
  expect(screen.getByLabelText('/department/dep1/doctors')).toBeOnTheScreen();
});
