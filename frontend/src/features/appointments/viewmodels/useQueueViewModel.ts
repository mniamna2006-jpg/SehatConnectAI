import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/constants/queryKeys';
import { getMyQueue } from '../model/api';

export function useQueueViewModel() {
  const {
    data: queue = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.myQueue,
    queryFn: getMyQueue,
    refetchInterval: 15_000,
  });

  return { queue, isLoading, isError };
}
