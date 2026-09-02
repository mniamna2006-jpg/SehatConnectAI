import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { ForgotPasswordView } from '../ForgotPasswordView';

jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => {
  const { Text: MockText } = require('react-native');
  return {
    Link: ({ children, href }: { children: ReactNode; href: string }) => (
      <MockText accessibilityRole="link" accessibilityLabel={href}>{children}</MockText>
    ),
  };
});

test('shows the honest unavailable state with no email field or submit action', async () => {
  await render(<ForgotPasswordView />);

  expect(screen.getByTestId('forgot-password-message')).toHaveTextContent(
    'Password recovery is currently unavailable. Please contact support.'
  );
  expect(screen.queryByLabelText('Email')).not.toBeOnTheScreen();
  expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  expect(screen.getByLabelText('/login')).toBeOnTheScreen();
});
