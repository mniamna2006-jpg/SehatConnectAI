import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { LoadingState } from '../../src/shared/components/LoadingState';
import { Screen } from '../../src/shared/components/Screen';

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Screen><LoadingState label="Preparing your care experience…" /></Screen>;
  if (!user) return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
