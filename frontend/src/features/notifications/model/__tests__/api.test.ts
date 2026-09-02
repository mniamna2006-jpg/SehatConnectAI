import { apiRequest } from '../../../../core/api/client';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api';

jest.mock('../../../../core/api/client');

beforeEach(() => {
  jest.clearAllMocks();
});

test('getNotifications calls GET /api/notifications/my', async () => {
  (apiRequest as jest.Mock).mockResolvedValue([]);
  await getNotifications();
  expect(apiRequest).toHaveBeenCalledWith('/api/notifications/my');
});

test('getUnreadNotificationCount calls GET /api/notifications/unread-count', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ count: 3 });
  const result = await getUnreadNotificationCount();
  expect(apiRequest).toHaveBeenCalledWith('/api/notifications/unread-count');
  expect(result).toEqual({ count: 3 });
});

test('markNotificationRead calls PATCH /api/notifications/:id/read', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ notification_id: 'n1', is_read: true });
  await markNotificationRead('n1');
  expect(apiRequest).toHaveBeenCalledWith('/api/notifications/n1/read', { method: 'PATCH' });
});

test('markAllNotificationsRead calls PATCH /api/notifications/read-all', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ updated_count: 5 });
  await markAllNotificationsRead();
  expect(apiRequest).toHaveBeenCalledWith('/api/notifications/read-all', { method: 'PATCH' });
});

test('a notifications API failure rejects', async () => {
  (apiRequest as jest.Mock).mockRejectedValue(new Error('network down'));
  await expect(getNotifications()).rejects.toThrow('network down');
});
