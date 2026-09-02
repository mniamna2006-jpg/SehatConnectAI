import { Redirect, Stack } from 'expo-router';
import { useHospitalAuth } from '../../../src/providers/HospitalAuthProvider';

export default function AdminLayout() {
  const { hospitalUser } = useHospitalAuth();
  if (hospitalUser?.role !== 'ADMIN') return <Redirect href="/staff/dashboard" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
