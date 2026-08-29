import { useLocalSearchParams } from 'expo-router';
import { AppointmentsView } from '../../../src/features/appointments/views/AppointmentsView';

export default function AppointmentsRoute() {
  const { doctorId, hospitalId, departmentId } = useLocalSearchParams<{
    doctorId?: string;
    hospitalId?: string;
    departmentId?: string;
  }>();

  return (
    <AppointmentsView
      doctorId={doctorId}
      hospitalId={hospitalId}
      departmentId={departmentId}
    />
  );
}
