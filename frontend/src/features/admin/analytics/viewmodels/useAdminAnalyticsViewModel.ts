import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../../shared/constants/queryKeys';
import { getAdminAnalytics } from '../model/api';

export function useAdminAnalyticsViewModel() {
  const { data: analytics, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminAnalytics,
    queryFn: getAdminAnalytics,
  });

  return { analytics, isLoading, isError, error, refetch };
}
