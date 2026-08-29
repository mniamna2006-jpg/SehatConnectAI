import { useLocalSearchParams } from 'expo-router';
import { FindDepartmentView } from '../../src/features/departments/views/FindDepartmentView';

export default function FindDepartmentRoute() {
  const { hospitalId, departmentId } = useLocalSearchParams<{
    hospitalId?: string;
    departmentId?: string;
  }>();

  return (
    <FindDepartmentView
      hospitalId={typeof hospitalId === 'string' ? hospitalId : undefined}
      departmentId={typeof departmentId === 'string' ? departmentId : undefined}
    />
  );
}
