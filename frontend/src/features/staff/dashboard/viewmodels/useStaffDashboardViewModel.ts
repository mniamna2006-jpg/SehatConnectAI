import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../../shared/constants/queryKeys';
import { getStaffDashboard } from '../model/api';

export function useStaffDashboardViewModel() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.staffDashboard,
    queryFn: getStaffDashboard,
  });

  return { dashboard: data, isLoading, isError, refetch };
}
