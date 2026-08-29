import { useQuery } from '@tanstack/react-query';
import { getHospitalById } from '../model/api';
import { queryKeys } from '../../../shared/constants/queryKeys';

export function useHospitalDetailsViewModel(hospitalId: string) {
  const { data: hospital, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.hospital(hospitalId),
    queryFn: () => getHospitalById(hospitalId),
    enabled: !!hospitalId,
  });

  return { hospital, isLoading, isError, refetch };
}
