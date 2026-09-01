import { Redirect, Stack } from 'expo-router';
import { useHospitalAuth } from '../../../src/providers/HospitalAuthProvider';

export default function StaffLayout() {
  const { hospitalUser } = useHospitalAuth();
  if (hospitalUser?.role !== 'STAFF') return <Redirect href="/admin/dashboard" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
