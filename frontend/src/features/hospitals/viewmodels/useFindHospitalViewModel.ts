import { useQuery } from '@tanstack/react-query';
import { useLocationSelector } from '../../../core/location/useLocationSelector';
import { getHospitals, getHospitalsNearby, searchHospitalsByCity } from '../model/api';
import { queryKeys } from '../../../shared/constants/queryKeys';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';

export function useFindHospitalViewModel() {
  const selector = useLocationSelector();
  const { mode, coordinates, manualCity } = selector;
  const debouncedManualCity = useDebouncedValue(manualCity);

  const hasManualCity = mode === 'manual' && debouncedManualCity.trim().length > 0;
  const hasGpsCoords = mode === 'gps' && !!coordinates;

  const { data: hospitals = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.hospitals({ mode, coordinates, manualCity: debouncedManualCity }),
    queryFn: () => {
      if (hasGpsCoords) return getHospitalsNearby(coordinates!);
      if (hasManualCity) return searchHospitalsByCity(debouncedManualCity.trim());
      return getHospitals();
    },
  });

  return { hospitals, isLoading, isError, refetch, selector };
}
