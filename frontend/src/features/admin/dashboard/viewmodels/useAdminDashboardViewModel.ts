import { useQuery } from '@tanstack/react-query';
import { getAdminDashboard } from '../model/api';
import { queryKeys } from '../../../../shared/constants/queryKeys';

export function useAdminDashboardViewModel() {
  const { data: dashboard, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: getAdminDashboard,
  });

  return { dashboard, isLoading, isError, error, refetch };
}
