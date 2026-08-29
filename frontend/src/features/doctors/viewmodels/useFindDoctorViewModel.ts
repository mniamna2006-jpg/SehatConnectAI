import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocationSelector } from '../../../core/location/useLocationSelector';
import { queryKeys } from '../../../shared/constants/queryKeys';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { findDoctors } from '../model/adapters/findDoctorsAdapter';

export function useFindDoctorViewModel() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const selector = useLocationSelector();
  const { mode, coordinates, manualCity } = selector;
  const debouncedManualCity = useDebouncedValue(manualCity);

  const {
    data: doctors = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [...queryKeys.findDoctors(debouncedQuery), mode, coordinates, debouncedManualCity],
    queryFn: () => findDoctors(debouncedQuery, { mode, coordinates, manualCity: debouncedManualCity }),
    enabled: debouncedQuery.trim().length > 0,
  });

  return { doctors, isLoading, isError, refetch, query, setQuery, selector };
}
