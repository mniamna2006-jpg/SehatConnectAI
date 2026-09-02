import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useLoginViewModel } from '../../viewmodels/useLoginViewModel';
import { LoginView } from '../LoginView';

jest.mock('../../viewmodels/useLoginViewModel');
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

const baseViewModel = {
  control: {},
  errors: {},
  onSubmit: jest.fn(),
  isSubmitting: false,
  apiError: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useLoginViewModel as jest.Mock).mockReturnValue({ ...baseViewModel, onSubmit: jest.fn() });
});

test('keeps login email-only and exposes account recovery navigation', async () => {
  await render(<LoginView />);

  expect(screen.getByRole('header', { name: 'Welcome back' })).toBeOnTheScreen();
  expect(screen.getByLabelText('Email')).toBeOnTheScreen();
  expect(screen.getByLabelText('Password')).toBeOnTheScreen();
  expect(screen.queryByLabelText(/phone/i)).not.toBeOnTheScreen();
  expect(screen.getByLabelText('/register')).toBeOnTheScreen();
  expect(screen.getByLabelText('/forgot-password')).toBeOnTheScreen();
  expect(screen.getByText('Hospital Admin / Staff Login')).toBeOnTheScreen();
  expect(screen.getByLabelText('/hospital-login')).toBeOnTheScreen();
});

test('password is hidden by default and can be shown then hidden', async () => {
  await render(<LoginView />);
  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', true);

  await fireEvent.press(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', false);

  await fireEvent.press(screen.getByRole('button', { name: 'Hide password' }));
  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', true);
});

test('submits through view-model contract', async () => {
  const onSubmit = jest.fn();
  (useLoginViewModel as jest.Mock).mockReturnValue({ ...baseViewModel, onSubmit });
  await render(<LoginView />);

  await fireEvent.press(screen.getByRole('button', { name: 'Log In' }));

  expect(onSubmit).toHaveBeenCalledTimes(1);
});

test('exposes loading and API error states', async () => {
  (useLoginViewModel as jest.Mock).mockReturnValue({
    ...baseViewModel,
    isSubmitting: true,
    apiError: 'Unable to sign in.',
  });
  await render(<LoginView />);

  expect(screen.getByTestId('login-submit')).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent('Unable to sign in.');
});
