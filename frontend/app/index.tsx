import { Redirect } from 'expo-router';
import { useAuth } from '../src/providers/AuthProvider';
import { useTranslations } from '../src/providers/LocaleProvider';
import { ErrorState } from '../src/shared/components/ErrorState';
import { LoadingState } from '../src/shared/components/LoadingState';
import { Screen } from '../src/shared/components/Screen';

export default function RootRoute() {
  const { user, isLoading, sessionError, retrySession } = useAuth();
  const t = useTranslations();

  if (isLoading) {
    return <Screen><LoadingState label={t('common.loading')} /></Screen>;
  }

  if (sessionError) {
    return (
      <Screen>
        <ErrorState message={t('auth.errors.network')} onRetry={retrySession} />
      </Screen>
    );
  }

  if (user) return <Redirect href="/home" />;
  return <Redirect href="/login" />;
}
