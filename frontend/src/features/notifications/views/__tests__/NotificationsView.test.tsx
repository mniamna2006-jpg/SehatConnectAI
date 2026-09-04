import { fireEvent, render, screen } from '@testing-library/react-native';
import { useNotificationsViewModel } from '../../viewmodels/useNotificationsViewModel';
import type { Notification } from '../../model/types';
import { NotificationsView } from '../NotificationsView';

jest.mock('../../viewmodels/useNotificationsViewModel');
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

const notification = (overrides: Partial<Notification> = {}): Notification => ({
  notification_id: 'n1',
  type: 'QUEUE_UPDATE',
  title: 'Queue update',
  message: 'You are next in line.',
  related_appointment_id: 'a1',
  is_read: false,
  created_at: '2026-08-31T10:00:00.000Z',
  ...overrides,
});

const baseVm = {
  notifications: [] as Notification[],
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
  onPress: jest.fn(),
  onMarkAllRead: jest.fn(),
  isMarkingAllRead: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('shows a loading state while notifications are loading', async () => {
  (useNotificationsViewModel as jest.Mock).mockReturnValue({ ...baseVm, isLoading: true });
  await render(<NotificationsView />);

  expect(screen.getByText('Loading…')).toBeOnTheScreen();
});

test('shows an error state with retry when the request fails', async () => {
  (useNotificationsViewModel as jest.Mock).mockReturnValue({ ...baseVm, isError: true });
  await render(<NotificationsView />);

  expect(screen.getByText("We couldn't load your notifications.")).toBeOnTheScreen();
  fireEvent.press(screen.getByText('Try again'));
  expect(baseVm.refetch).toHaveBeenCalled();
});

test('shows an empty state when there are no notifications', async () => {
  (useNotificationsViewModel as jest.Mock).mockReturnValue({ ...baseVm });
  await render(<NotificationsView />);

  expect(screen.getByText('No notifications')).toBeOnTheScreen();
});

test('renders notification title, message, and readable timestamp', async () => {
  (useNotificationsViewModel as jest.Mock).mockReturnValue({
    ...baseVm,
    notifications: [notification()],
  });
  await render(<NotificationsView />);

  expect(screen.getByText('Queue update')).toBeOnTheScreen();
  expect(screen.getByText('You are next in line.')).toBeOnTheScreen();
  expect(screen.getByText(/Aug 31, 2026/)).toBeOnTheScreen();
});

test('renders an unrecognized notification type generically without crashing', async () => {
  (useNotificationsViewModel as jest.Mock).mockReturnValue({
    ...baseVm,
    notifications: [notification({ type: 'SOME_FUTURE_TYPE' as Notification['type'] })],
  });
  await render(<NotificationsView />);

  expect(screen.getByText('Queue update')).toBeOnTheScreen();
});

test('renders doctor availability notification safely without unsupported navigation', async () => {
  const doctorAvailability = notification({
    type: 'DOCTOR_AVAILABILITY',
    title: 'Doctor Available',
    message: 'Dr. Amina Shah is now available.',
    related_appointment_id: null,
  });
  const vm = { ...baseVm, notifications: [doctorAvailability] };
  (useNotificationsViewModel as jest.Mock).mockReturnValue(vm);
  await render(<NotificationsView />);

  expect(screen.getByText('Doctor Available')).toBeOnTheScreen();
  expect(screen.getByText('Dr. Amina Shah is now available.')).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Doctor Available'));
  expect(vm.onPress).toHaveBeenCalledWith(doctorAvailability);
});

test('handles missing optional appointment reference safely', async () => {
  (useNotificationsViewModel as jest.Mock).mockReturnValue({
    ...baseVm,
    notifications: [notification({ related_appointment_id: null })],
  });
  await render(<NotificationsView />);

  expect(screen.getByText('Queue update')).toBeOnTheScreen();
});

test('tapping a notification calls onPress with that notification', async () => {
  const vm = { ...baseVm, notifications: [notification()] };
  (useNotificationsViewModel as jest.Mock).mockReturnValue(vm);
  await render(<NotificationsView />);

  fireEvent.press(screen.getByText('Queue update'));
  expect(vm.onPress).toHaveBeenCalledWith(notification());
});

test('pressing mark all as read calls onMarkAllRead', async () => {
  const vm = { ...baseVm, notifications: [notification()] };
  (useNotificationsViewModel as jest.Mock).mockReturnValue(vm);
  await render(<NotificationsView />);

  fireEvent.press(screen.getByText('Mark all as read'));
  expect(vm.onMarkAllRead).toHaveBeenCalled();
});

test('shows a visible error when a mark-read mutation failed, instead of failing silently', async () => {
  (useNotificationsViewModel as jest.Mock).mockReturnValue({
    ...baseVm,
    notifications: [notification()],
    hasMutationError: true,
  });
  await render(<NotificationsView />);

  expect(screen.getByText("We couldn't update that. Please try again.")).toBeOnTheScreen();
});

test('distinguishes unread from read notifications for accessibility', async () => {
  (useNotificationsViewModel as jest.Mock).mockReturnValue({
    ...baseVm,
    notifications: [notification({ is_read: false }), notification({ notification_id: 'n2', is_read: true })],
  });
  await render(<NotificationsView />);

  const items = screen.getAllByRole('button');
  const unreadItem = items.find((item) => item.props.accessibilityLabel?.includes('Unread'));
  expect(unreadItem).toBeTruthy();
});
