import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocationSelector } from '../../../core/location/useLocationSelector';
import { queryKeys } from '../../../shared/constants/queryKeys';
import { findDoctors } from '../model/adapters/findDoctorsAdapter';

export function useFindDoctorViewModel() {
  const [query, setQuery] = useState('');
  const selector = useLocationSelector();
  const { mode, coordinates, manualCity } = selector;

  const {
    data: doctors = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [...queryKeys.findDoctors(query), mode, coordinates, manualCity],
    queryFn: () => findDoctors(query, { mode, coordinates, manualCity }),
    enabled: query.trim().length > 0,
  });

  return { doctors, isLoading, isError, refetch, query, setQuery, selector };
}
