import { useLocalSearchParams } from 'expo-router';
import { AppointmentsView } from '../../../src/features/appointments/views/AppointmentsView';

function toStringParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0] || undefined;
  return value || undefined;
}

export default function AppointmentsRoute() {
  const { doctorId, hospitalId, departmentId } = useLocalSearchParams<{
    doctorId?: string | string[];
    hospitalId?: string | string[];
    departmentId?: string | string[];
  }>();

  return (
    <AppointmentsView
      doctorId={toStringParam(doctorId)}
      hospitalId={toStringParam(hospitalId)}
      departmentId={toStringParam(departmentId)}
    />
  );
}
