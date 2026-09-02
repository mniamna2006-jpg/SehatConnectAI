import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { queryKeys } from '../../../shared/constants/queryKeys';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../model/api';
import type { Notification } from '../model/types';

export function useNotificationsViewModel() {
  const queryClient = useQueryClient();
  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: getNotifications,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotificationCount });
  };

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: invalidate,
  });

  const onPress = async (notification: Notification) => {
    if (!notification.is_read) {
      await markReadMutation.mutateAsync(notification.notification_id).catch(() => undefined);
    }
    if (notification.related_appointment_id) {
      router.push('/appointments');
    }
  };

  const onMarkAllRead = async () => {
    await markAllReadMutation.mutateAsync().catch(() => undefined);
  };

  return {
    notifications,
    isLoading,
    isError,
    refetch,
    onPress,
    onMarkAllRead,
    isMarkingAllRead: markAllReadMutation.isPending,
  };
}
