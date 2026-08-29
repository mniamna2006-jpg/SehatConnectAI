import { useQuery } from '@tanstack/react-query';
import { useLocationSelector } from '../../../core/location/useLocationSelector';
import { getHospitals, getHospitalsNearby, searchHospitalsByCity } from '../model/api';
import { queryKeys } from '../../../shared/constants/queryKeys';

export function useFindHospitalViewModel() {
  const selector = useLocationSelector();
  const { mode, coordinates, manualCity } = selector;

  const hasManualCity = mode === 'manual' && manualCity.trim().length > 0;
  const hasGpsCoords = mode === 'gps' && !!coordinates;

  const { data: hospitals = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.hospitals({ mode, coordinates, manualCity }),
    queryFn: () => {
      if (hasGpsCoords) return getHospitalsNearby(coordinates!);
      if (hasManualCity) return searchHospitalsByCity(manualCity.trim());
      return getHospitals();
    },
  });

  return { hospitals, isLoading, isError, refetch, selector };
}
