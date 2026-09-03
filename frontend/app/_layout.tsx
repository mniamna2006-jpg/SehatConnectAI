import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../src/core/query/queryClient';
import { AuthProvider } from '../src/providers/AuthProvider';
import { LocaleProvider } from '../src/providers/LocaleProvider';
import { ErrorBoundary } from '../src/shared/components/ErrorBoundary';

export default function RootLayout() {
  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LocaleProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
            <StatusBar style="dark" />
          </LocaleProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
