import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useUnreadNotificationCountViewModel } from '../../viewmodels/useUnreadNotificationCountViewModel';
import { NotificationBell } from '../NotificationBell';

jest.mock('../../viewmodels/useUnreadNotificationCountViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => {
  const { View: MockView } = require('react-native');
  return {
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <MockView accessibilityRole="link" accessibilityLabel={href}>
        {children}
      </MockView>
    ),
  };
});

test('shows no badge when there are zero unread notifications', async () => {
  (useUnreadNotificationCountViewModel as jest.Mock).mockReturnValue({ count: 0, hasUnread: false, isLoading: false });
  await render(<NotificationBell />);

  expect(screen.queryByTestId('notification-badge')).toBeNull();
});

test('shows the unread count badge when there is at least one unread notification', async () => {
  (useUnreadNotificationCountViewModel as jest.Mock).mockReturnValue({ count: 3, hasUnread: true, isLoading: false });
  await render(<NotificationBell />);

  expect(screen.getByTestId('notification-badge')).toBeOnTheScreen();
  expect(screen.getByText('3')).toBeOnTheScreen();
});

test('links to the notifications screen', async () => {
  (useUnreadNotificationCountViewModel as jest.Mock).mockReturnValue({ count: 0, hasUnread: false, isLoading: false });
  await render(<NotificationBell />);

  expect(screen.getByLabelText('/notifications')).toBeOnTheScreen();
});
