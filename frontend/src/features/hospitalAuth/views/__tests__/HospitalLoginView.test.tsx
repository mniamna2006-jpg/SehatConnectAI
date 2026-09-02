import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useHospitalLoginViewModel } from '../../viewmodels/useHospitalLoginViewModel';
import { HospitalLoginView } from '../HospitalLoginView';

jest.mock('../../viewmodels/useHospitalLoginViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('react-hook-form', () => ({
  Controller: ({ render: renderField }: { render: (args: unknown) => ReactNode }) =>
    renderField({ field: { value: '', onChange: jest.fn() } }),
}));
jest.mock('expo-router', () => {
  const { Text: MockText } = require('react-native');
  return {
    Link: ({ children, href }: { children: ReactNode; href: string }) => (
      <MockText accessibilityRole="link" accessibilityLabel={href}>{children}</MockText>
    ),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  (useHospitalLoginViewModel as jest.Mock).mockReturnValue({
    control: {},
    errors: {},
    onSubmit: jest.fn(),
    isSubmitting: false,
    apiError: null,
  });
});

test('hospital password is hidden and supports show-hide toggle', async () => {
  await render(<HospitalLoginView />);
  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', true);

  await fireEvent.press(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', false);

  await fireEvent.press(screen.getByRole('button', { name: 'Hide password' }));
  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', true);
});

test('offers visible navigation back to Patient Login', async () => {
  await render(<HospitalLoginView />);

  expect(screen.getByText('Back to Patient Login')).toBeOnTheScreen();
  expect(screen.getByLabelText('/login')).toBeOnTheScreen();
});
