import { Redirect } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';
import { useHospitalAuth } from '../src/providers/HospitalAuthProvider';
import { LoadingState } from '../src/shared/components/LoadingState';
import { Screen } from '../src/shared/components/Screen';

export default function RootRoute() {
  const { user, isLoading: isPatientLoading } = useAuth();
  const { hospitalUser, isLoading: isHospitalLoading } = useHospitalAuth();

  if (isPatientLoading || isHospitalLoading) {
    return <Screen><LoadingState label="Preparing your session…" /></Screen>;
  }

  if (hospitalUser?.role === 'ADMIN') return <Redirect href="/admin/dashboard" />;
  if (hospitalUser?.role === 'STAFF') return <Redirect href="/staff/dashboard" />;
  if (user) return <Redirect href="/home" />;
  return <Redirect href="/login" />;
}
