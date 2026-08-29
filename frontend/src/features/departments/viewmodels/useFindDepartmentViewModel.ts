import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocationSelector } from '../../../core/location/useLocationSelector';
import { queryKeys } from '../../../shared/constants/queryKeys';
import { findDepartments } from '../model/adapters/findDepartmentsAdapter';

export function useFindDepartmentViewModel() {
  const [query, setQuery] = useState('');
  const selector = useLocationSelector();
  const { mode, coordinates, manualCity } = selector;

  const {
    data: departments = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: [...queryKeys.findDepartments(query), mode, coordinates, manualCity],
    queryFn: () => findDepartments(query, { mode, coordinates, manualCity }),
    enabled: query.trim().length > 0,
  });

  return { departments, isLoading, isError, query, setQuery, selector };
}
