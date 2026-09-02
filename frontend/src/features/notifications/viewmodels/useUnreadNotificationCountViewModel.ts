import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/constants/queryKeys';
import { getUnreadNotificationCount } from '../model/api';

export function useUnreadNotificationCountViewModel() {
  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.unreadNotificationCount,
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30_000,
  });

  const count = data?.count ?? 0;
  return { count, hasUnread: count > 0, isLoading };
}
