import { Redirect } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';
import { LoadingState } from '../src/shared/components/LoadingState';
import { Screen } from '../src/shared/components/Screen';

export default function RootRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Screen><LoadingState label="Preparing your session…" /></Screen>;
  }

  if (user) return <Redirect href="/home" />;
  return <Redirect href="/login" />;
}
