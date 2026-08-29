import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocationSelector } from '../../../core/location/useLocationSelector';
import { queryKeys } from '../../../shared/constants/queryKeys';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { findDepartments } from '../model/adapters/findDepartmentsAdapter';
import { getDepartmentsByHospital } from '../model/api';

interface FindDepartmentPrefill {
  hospitalId?: string;
  departmentId?: string;
}

export function useFindDepartmentViewModel(prefill: FindDepartmentPrefill = {}) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const selector = useLocationSelector();
  const { mode, coordinates, manualCity } = selector;
  const debouncedManualCity = useDebouncedValue(manualCity);

  // When we arrive from Hospital Details with a hospitalId, skip the
  // cross-hospital GPS/manual discovery entirely and fetch that hospital's
  // departments directly instead. GPS/manual behavior is unchanged otherwise.
  const isHospitalScoped = Boolean(prefill.hospitalId);

  const {
    data: departments = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: isHospitalScoped
      ? queryKeys.departmentsByHospital(prefill.hospitalId as string)
      : [...queryKeys.findDepartments(debouncedQuery), mode, coordinates, debouncedManualCity],
    queryFn: () =>
      isHospitalScoped
        ? getDepartmentsByHospital(prefill.hospitalId as string)
        : findDepartments(debouncedQuery, { mode, coordinates, manualCity: debouncedManualCity }),
    enabled: isHospitalScoped || debouncedQuery.trim().length > 0,
  });

  return {
    departments,
    isLoading,
    isError,
    refetch,
    query,
    setQuery,
    selector,
    isHospitalScoped,
    highlightedDepartmentId: prefill.departmentId,
  };
}
