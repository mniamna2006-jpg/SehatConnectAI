import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { useFindDepartmentViewModel } from '../../viewmodels/useFindDepartmentViewModel';
import { FindDepartmentView } from '../FindDepartmentView';

let mockIsRTL = false;

jest.mock('../../viewmodels/useFindDepartmentViewModel');
jest.mock('../../../../providers/LocaleProvider', () => {
  const { translate } = require('../../../../i18n');
  return {
    useOptionalLocale: () => ({ isRTL: mockIsRTL }),
    useTranslations: () => (key: string) => translate(mockIsRTL ? 'URDU' : 'ENGLISH', key),
  };
});
jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text: MockText } = require('react-native');
  return ({ name }: { name: string }) => <MockText testID={`icon-${name}`} />;
});

beforeEach(() => {
  mockIsRTL = false;
});
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

test('flips the department tile disclosure arrow for RTL locales', async () => {
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
  expect(screen.getByTestId('icon-arrow-forward')).toBeOnTheScreen();
  expect(screen.getByTestId('tile-arrow-wrap')).toHaveStyle({ right: 14, left: undefined });

  mockIsRTL = true;
  await render(<FindDepartmentView hospitalId="h1" departmentId="dep1" />);
  expect(screen.getAllByTestId('icon-arrow-back').length).toBeGreaterThan(0);
  expect(screen.getAllByTestId('tile-arrow-wrap')[0]).toHaveStyle({ left: 14, right: undefined });
});
