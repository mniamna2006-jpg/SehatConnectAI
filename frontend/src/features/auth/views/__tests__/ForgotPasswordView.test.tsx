import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { requestPasswordReset } from '../../model/adapters/forgotPasswordAdapter';
import { ForgotPasswordView } from '../ForgotPasswordView';

jest.mock('../../model/adapters/forgotPasswordAdapter');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
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
  (requestPasswordReset as jest.Mock).mockResolvedValue(undefined);
});

test('uses email only and shows success after submission', async () => {
  await render(<ForgotPasswordView />);

  expect(screen.getByLabelText('Email')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Password')).not.toBeOnTheScreen();

  await fireEvent.changeText(screen.getByLabelText('Email'), 'patient@example.com');
  await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));

  expect(await screen.findByRole('header', { name: 'Check your email' })).toBeOnTheScreen();
  expect(requestPasswordReset).toHaveBeenCalledWith('patient@example.com');
  expect(screen.getByLabelText('/login')).toBeOnTheScreen();
});
