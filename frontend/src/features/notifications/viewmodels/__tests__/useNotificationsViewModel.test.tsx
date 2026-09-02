import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { TestQueryProvider } from '../../../../core/query/testUtils';
import * as api from '../../model/api';
import type { Notification } from '../../model/types';
import { useNotificationsViewModel } from '../useNotificationsViewModel';

jest.mock('../../model/api');
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

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

beforeEach(() => {
  jest.clearAllMocks();
  (api.getNotifications as jest.Mock).mockResolvedValue([notification()]);
  (api.markNotificationRead as jest.Mock).mockResolvedValue(notification({ is_read: true }));
  (api.markAllNotificationsRead as jest.Mock).mockResolvedValue({ updated_count: 1 });
});

test('loads notifications from the API', async () => {
  const { result } = await renderHook(() => useNotificationsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.notifications).toHaveLength(1);
  expect(result.current.notifications[0].notification_id).toBe('n1');
});

test('exposes an error state when the list request fails', async () => {
  (api.getNotifications as jest.Mock).mockRejectedValue(new Error('down'));
  const { result } = await renderHook(() => useNotificationsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.isError).toBe(true);
});

test('reports an empty list safely', async () => {
  (api.getNotifications as jest.Mock).mockResolvedValue([]);
  const { result } = await renderHook(() => useNotificationsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  expect(result.current.notifications).toEqual([]);
});

test('onPress marks an unread notification read and navigates to its appointment reference', async () => {
  const { result } = await renderHook(() => useNotificationsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(async () => {
    await result.current.onPress(notification());
  });

  expect(api.markNotificationRead).toHaveBeenCalledWith('n1');
  expect(router.push).toHaveBeenCalledWith('/appointments');
});

test('onPress does not navigate when the notification has no appointment reference', async () => {
  const { result } = await renderHook(() => useNotificationsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(async () => {
    await result.current.onPress(notification({ related_appointment_id: null }));
  });

  expect(router.push).not.toHaveBeenCalled();
});

test('onPress does not re-mark an already-read notification', async () => {
  const { result } = await renderHook(() => useNotificationsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(async () => {
    await result.current.onPress(notification({ is_read: true }));
  });

  expect(api.markNotificationRead).not.toHaveBeenCalled();
  expect(router.push).toHaveBeenCalledWith('/appointments');
});

test('onMarkAllRead calls the mark-all-read endpoint', async () => {
  const { result } = await renderHook(() => useNotificationsViewModel(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(async () => {
    await result.current.onMarkAllRead();
  });

  expect(api.markAllNotificationsRead).toHaveBeenCalled();
});
