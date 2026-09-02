import { apiRequest } from '../../../core/api/client';
import type { Notification } from './types';

export function getNotifications(): Promise<Notification[]> {
  return apiRequest<Notification[]>('/api/notifications/my');
}

export function getUnreadNotificationCount(): Promise<{ count: number }> {
  return apiRequest<{ count: number }>('/api/notifications/unread-count');
}

export function markNotificationRead(notificationId: string): Promise<Notification> {
  return apiRequest<Notification>(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead(): Promise<{ updated_count: number }> {
  return apiRequest<{ updated_count: number }>('/api/notifications/read-all', { method: 'PATCH' });
}
