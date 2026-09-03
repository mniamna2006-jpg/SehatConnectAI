import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { useHomeViewModel } from '../../viewmodels/useHomeViewModel';
import { HomeView } from '../HomeView';

jest.mock('../../viewmodels/useHomeViewModel');
jest.mock('../../../notifications/views/NotificationBell', () => ({ NotificationBell: () => null }));
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => {
  const { View: MockView } = require('react-native');
  return {
    Link: ({ children, href }: { children: ReactNode; href: string }) => (
      <MockView accessibilityRole="link" accessibilityLabel={href}>
        {children}
      </MockView>
    ),
  };
});

test('presents patient identity and the four frozen care actions', async () => {
  (useHomeViewModel as jest.Mock).mockReturnValue({
    user: { full_name: 'Demo Patient' },
  });

  await render(<HomeView />);

  expect(screen.getByText('Demo Patient')).toBeOnTheScreen();
  expect(screen.getByText('How can we help you today?')).toBeOnTheScreen();
  expect(screen.getByLabelText('/find-hospital')).toBeOnTheScreen();
  expect(screen.getByLabelText('/find-doctor')).toBeOnTheScreen();
  expect(screen.getByLabelText('/find-department')).toBeOnTheScreen();
  expect(screen.getByLabelText('/appointments')).toBeOnTheScreen();
  expect(screen.getByLabelText('/ai-chat')).toBeOnTheScreen();
});

test('keeps sign-out off the home screen; it lives on the profile screen instead', async () => {
  (useHomeViewModel as jest.Mock).mockReturnValue({
    user: { full_name: 'Demo Patient' },
  });

  await render(<HomeView />);

  expect(screen.queryByTestId('home-logout')).not.toBeOnTheScreen();
  expect(screen.queryByLabelText('Log out')).not.toBeOnTheScreen();
});
