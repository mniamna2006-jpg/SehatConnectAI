import { Redirect, useLocalSearchParams } from 'expo-router';
import { DepartmentDoctorsView } from '../../../../src/features/departments/views/DepartmentDoctorsView';

export default function DepartmentDoctorsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id || typeof id !== 'string') return <Redirect href="/find-department" />;
  return <DepartmentDoctorsView departmentId={id} />;
}
