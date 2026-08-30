import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/constants/queryKeys';
import { getDoctorsByDepartment } from '../../doctors/model/api';

export function useDepartmentDoctorsViewModel(departmentId: string) {
  const {
    data: doctors = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.doctorsByDepartment(departmentId),
    queryFn: () => getDoctorsByDepartment(departmentId),
    enabled: departmentId.length > 0,
  });

  return { doctors, isLoading, isError, refetch };
}
