import { Redirect, Stack } from 'expo-router';
import { useHospitalAuth } from '../../src/providers/HospitalAuthProvider';
import { LoadingState } from '../../src/shared/components/LoadingState';
import { Screen } from '../../src/shared/components/Screen';

export default function HospitalLayout() {
  const { hospitalUser, isLoading } = useHospitalAuth();
  if (isLoading) return <Screen><LoadingState label="Preparing your hospital workspace…" /></Screen>;
  if (!hospitalUser) return <Redirect href="/hospital-login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
